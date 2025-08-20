# 详细聊天历史导出格式说明

## 更新内容

已将聊天历史导出功能升级为详细格式，每条消息单独显示，并清楚标注角色类型。

## CSV格式详细说明

### 新的CSV结构
每条消息占据一行，包含以下字段：

| 字段名 | 说明 | 示例 |
|--------|------|------|
| Chat ID | 聊天记录的唯一标识符 | 68a2d095234fdb61b6d944c4 |
| Chat Name | 聊天会话名称 | 关于机器学习的讨论 |
| User Name | 用户姓名 | 张三 |
| User Email | 用户邮箱 | zhang@example.com |
| Course ID | 课程标识符 | 3 |
| Course Name | 课程名称 | 计算机科学基础 |
| Chat Created At | 聊天创建时间 | 2025-08-20T10:30:00.000Z |
| Chat Last Updated | 聊天最后更新时间 | 2025-08-20T11:45:00.000Z |
| Message Index | 消息在对话中的序号 | 1, 2, 3... |
| **Message Role** | **消息角色类型** | **User Prompt** 或 **Assistant Response** |
| **Message Content** | **消息具体内容** | 什么是机器学习？ |
| Message Timestamp | 消息发送时间 | 2025-08-20T10:31:00.000Z |
| Has Images | 是否包含图片 | Yes / No |
| Total Messages in Chat | 该聊天的总消息数 | 10 |
| Total Tokens | 总Token消耗 | 1250 |
| Estimated Cost | 预估费用 | 0.0025 |

### CSV优势
- **Excel友好**: 包含UTF-8 BOM，Excel直接打开显示正确中文
- **分析便利**: 每行一条消息，便于筛选和统计
- **角色清晰**: User Prompt 和 Assistant Response 明确标注
- **时间序列**: 可按消息时间排序分析对话流程

## JSON格式详细说明

### 新的JSON结构
```json
{
  "exportInfo": {
    "courseId": "3",
    "courseName": "计算机科学基础",
    "exportDate": "2025-08-20T12:00:00.000Z",
    "totalChats": 5,
    "totalMessages": 50,
    "dateRange": {
      "startDate": "2025-08-01",
      "endDate": "2025-08-20"
    },
    "description": "Detailed chat history export with individual message breakdown"
  },
  "chats": [
    {
      "chatInfo": {
        "chatId": "68a2d095234fdb61b6d944c4",
        "chatName": "关于机器学习的讨论",
        "createdAt": "2025-08-20T10:30:00.000Z",
        "lastUpdated": "2025-08-20T11:45:00.000Z",
        "messageCount": 8,
        "totalTokens": 1250,
        "estimatedCost": 0.0025
      },
      "userInfo": {
        "userName": "张三",
        "userEmail": "zhang@example.com"
      },
      "courseInfo": {
        "courseId": "3",
        "courseName": "计算机科学基础"
      },
      "conversation": [
        {
          "messageIndex": 1,
          "role": "User Prompt",
          "content": "什么是机器学习？",
          "timestamp": "2025-08-20T10:31:00.000Z",
          "hasImages": false,
          "wordCount": 7,
          "estimatedTokens": 2
        },
        {
          "messageIndex": 2,
          "role": "Assistant Response",
          "content": "机器学习是人工智能的一个分支...",
          "timestamp": "2025-08-20T10:31:30.000Z",
          "hasImages": false,
          "wordCount": 150,
          "estimatedTokens": 38
        }
      ]
    }
  ]
}
```

### JSON优势
- **结构化**: 清晰的层级结构，便于程序处理
- **完整信息**: 包含对话的完整上下文
- **统计数据**: 每条消息包含字数和Token估算
- **元数据**: 丰富的导出信息和统计数据

## 文件命名更新

- **CSV**: `chat_history_detailed_{课程名称}_{日期}.csv`
- **JSON**: `chat_history_detailed_{课程名称}_{日期}.json`

## 角色标注

### 明确的角色识别
- **User Prompt**: 用户的提问或输入
- **Assistant Response**: AI助手的回答

### 使用场景
1. **分析用户提问模式**: 筛选所有"User Prompt"了解学生关注点
2. **评估助手回答质量**: 查看"Assistant Response"的内容和准确性
3. **对话流程分析**: 按消息序号和时间戳追踪对话发展
4. **学习行为研究**: 统计用户提问频率和内容类型

## 数据分析建议

### Excel分析技巧
1. **筛选用户提问**: 在"Message Role"列筛选"User Prompt"
2. **按时间排序**: 使用"Message Timestamp"列排序
3. **统计分析**: 使用透视表分析不同用户的活跃度
4. **内容搜索**: 在"Message Content"列搜索关键词

### 编程分析
- JSON格式特别适合Python、JavaScript等语言进行数据分析
- 可以轻松提取对话模式、关键词频率等信息
- 支持机器学习算法进行文本分析

## 隐私和安全

- 导出数据包含完整的用户对话内容
- 请确保按照数据保护法规处理导出文件
- 建议定期清理不需要的导出文件
- 访问导出功能需要管理员权限
