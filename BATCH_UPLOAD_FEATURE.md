# Chatflow Permission Management - Batch Upload Feature

## 新增功能

为 Chatflow Permission Management 添加了批量上传 CSV 功能，包括：

### 1. 🔽 下载模板功能
- 点击 "Download Template" 按钮下载 CSV 模板
- 模板包含示例数据和正确的格式

### 2. 📤 批量上传功能
- 点击 "Batch Upload" 按钮打开上传对话框
- 支持 CSV 文件上传和预览
- 实时验证数据格式和内容

## CSV 格式说明

### 必需列
- `chatflow_id`: Chatflow 的 ID
- `course_id`: 课程的 ID  
- `allowed_roles`: 允许的角色（多个角色用分号分隔）
- `is_active`: 权限是否激活（true/false）

### 支持的角色
- `Instructor` - 教师
- `Learner` - 学习者
- `Teaching Assistant` - 助教
- `Content Developer` - 内容开发者
- `Administrator` - 管理员

### 示例 CSV 内容
```csv
chatflow_id,course_id,allowed_roles,is_active
chatflow_123,course_abc,Instructor;Learner,true
chatflow_456,course_def,Instructor,true
chatflow_789,course_ghi,Learner;Teaching Assistant,false
```

## 功能特性

### ✅ 数据验证
- 验证必填字段
- 检查 chatflow 和 course 是否存在
- 验证角色名称是否有效
- 显示详细的错误信息

### ✅ 智能处理
- 自动处理重复权限（更新而非重复创建）
- 支持角色的多种格式（标签或完整 URI）
- 批量处理结果统计

### ✅ 用户体验
- 文件上传前预览前5行数据
- 实时上传进度显示
- 详细的使用说明
- 错误信息和成功反馈

## API 端点

### 批量上传
- **URL**: `/api/admin/chatflow-permissions/batch-upload`
- **方法**: POST
- **格式**: multipart/form-data
- **参数**: file (CSV 文件)

### 响应格式
```json
{
  "success": true,
  "message": "Batch upload completed. Created: 2, Updated: 1, Errors: 0",
  "results": {
    "created": 2,
    "updated": 1, 
    "skipped": 0,
    "errors": []
  }
}
```

## 使用步骤

1. **下载模板**
   - 点击 "Download Template" 按钮
   - 获得包含正确格式的 CSV 模板

2. **准备数据**
   - 使用 Excel 或其他工具编辑 CSV 文件
   - 确保数据格式正确

3. **上传文件**
   - 点击 "Batch Upload" 按钮
   - 选择准备好的 CSV 文件
   - 查看预览确认数据正确

4. **执行上传**
   - 点击 "Upload" 按钮
   - 等待处理完成
   - 查看结果统计

## 错误处理

### 常见错误
- **文件格式错误**: 确保上传的是 CSV 格式文件
- **必填字段缺失**: 检查所有必需列是否都有值
- **无效的角色**: 使用支持的角色名称
- **无效的 ID**: 确保 chatflow_id 和 course_id 在系统中存在

### 错误示例
```json
{
  "success": false,
  "error": "Validation errors found",
  "details": [
    "Row 2: Missing required fields (chatflow_id, course_id, allowed_roles)",
    "Row 3: Invalid role \"Teacher\"",
    "Row 4: No valid roles found"
  ]
}
```

批量上传功能现在已完整实现，可以大大提高权限管理的效率！
