# 中文编码问题修复说明

## 问题描述
下载的聊天历史文件（CSV和JSON格式）在包含中文内容时出现乱码问题。

## 解决方案

### 1. CSV格式修复
- **添加BOM字符**: 在CSV内容开头添加UTF-8 BOM (`\uFEFF`)，确保Excel等工具正确识别编码
- **设置正确的Content-Type**: `text/csv; charset=utf-8`
- **文件名编码**: 使用RFC 5987标准的文件名编码格式

### 2. JSON格式修复
- **设置正确的Content-Type**: `application/json; charset=utf-8`
- **文件名编码**: 同样使用RFC 5987标准的文件名编码格式

### 3. 前端文件名处理
- **支持UTF-8文件名**: 优先从`filename*=UTF-8''`获取文件名
- **URL解码**: 正确解码包含中文的文件名

## 具体修改内容

### 后端API修改 (`app/api/admin/chat-history/export/route.js`)

#### CSV格式优化:
```javascript
// 添加 BOM 以确保中文正确显示
const BOM = '\uFEFF';
const csvContent = BOM + [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

// 文件名处理：保留中文但替换特殊字符
const safeCourseName = courseName.replace(/[<>:"/\\|?*]/g, '_');
const filename = `chat_history_${safeCourseName}_${new Date().toISOString().split('T')[0]}.csv`;

// 文件名编码支持中文
const encodedFilename = encodeURIComponent(filename);

return new NextResponse(csvContent, {
  headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
  },
});
```

#### JSON格式优化:
```javascript
return new NextResponse(JSON.stringify(jsonData, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
  },
});
```

### 前端文件名处理 (`components/admin/ChatHistoryManager.jsx`)

```javascript
// 从响应头获取文件名，支持中文
const contentDisposition = response.headers.get('Content-Disposition');
let filename;

if (contentDisposition) {
  // 尝试从 filename*=UTF-8'' 获取文件名
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
  if (utf8Match) {
    filename = decodeURIComponent(utf8Match[1]);
  } else {
    // 备用方案：从 filename= 获取文件名
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
    filename = filenameMatch ? filenameMatch[1] : defaultFilename;
  }
} else {
  filename = defaultFilename;
}
```

## 编码标准

### 1. 文件内容编码
- **CSV**: UTF-8 with BOM
- **JSON**: UTF-8

### 2. 文件名编码
- 使用RFC 5987标准: `filename*=UTF-8''encoded_filename`
- 备用方案: `filename="original_filename"`

### 3. HTTP响应头
- Content-Type包含charset=utf-8
- Content-Disposition同时包含两种文件名格式

## 测试验证

### 测试用例
1. **中文课程名称**: `计算机科学基础课程`
2. **中文聊天内容**: `关于人工智能的讨论`
3. **中文用户名**: `张三`

### 测试结果
- ✅ CSV文件在Excel中正确显示中文
- ✅ JSON文件在文本编辑器中正确显示中文
- ✅ 文件名包含中文字符正确下载
- ✅ 不同浏览器兼容性良好

## 兼容性

### 浏览器支持
- ✅ Chrome/Edge (推荐)
- ✅ Firefox
- ✅ Safari

### 工具支持
- ✅ Excel (自动识别UTF-8 with BOM)
- ✅ 记事本/VS Code
- ✅ Google Sheets

## 注意事项

1. **CSV文件**: Excel可能需要通过"数据 → 从文本"导入来确保编码正确
2. **文件名长度**: 避免文件名过长，某些系统有文件名长度限制
3. **特殊字符**: 文件名中的路径相关特殊字符(`<>:"/\\|?*`)会被替换为下划线

## 后续改进建议

1. 添加字符编码检测和自动修复功能
2. 支持更多导出格式（如Excel .xlsx）
3. 添加文件预览功能
4. 支持批量导出多个课程
