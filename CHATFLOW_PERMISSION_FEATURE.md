# Chatflow Permission Management Feature

## Overview
这个功能允许管理员在admin dashboard中管理chatflow权限，基于course和role进行授权。

## 功能特性

### 1. 权限管理
- **按课程按角色授权**: 为特定课程的特定角色授予chatflow访问权限
- **支持多角色**: 可以为单个chatflow-course组合分配多个角色
- **权限状态管理**: 可以启用/禁用权限配置

### 2. 支持的角色类型
- Instructor (教师)
- Learner (学生) 
- Teaching Assistant (助教)
- Content Developer (内容开发者)
- Administrator (管理员)

### 3. 用户界面
- **筛选功能**: 可按课程或chatflow筛选权限列表
- **创建权限**: 通过模态框创建新的权限配置
- **编辑权限**: 修改现有权限配置
- **删除权限**: 软删除权限配置

## API 端点

### GET /api/admin/chatflow-permissions
获取权限列表，支持查询参数：
- `courseId`: 按课程筛选
- `chatflowId`: 按chatflow筛选  
- `action=chatflows`: 获取所有可用chatflows
- `action=courses`: 获取所有课程

### POST /api/admin/chatflow-permissions
创建新的权限配置
```json
{
  "chatflowId": "chatflow_id",
  "courseId": "course_id", 
  "allowedRoles": ["role1", "role2"],
  "description": "权限描述"
}
```

### PUT /api/admin/chatflow-permissions
更新现有权限配置
```json
{
  "_id": "permission_id",
  "allowedRoles": ["role1", "role2"],
  "description": "更新的描述",
  "isActive": true
}
```

### DELETE /api/admin/chatflow-permissions?id=permission_id
删除(软删除)权限配置

## 数据库模型

权限存储在`ChatflowPermission`集合中：
```javascript
{
  chatflowId: String,     // Chatflow ID
  courseId: String,       // 课程ID
  allowedRoles: [String], // 允许的角色列表
  description: String,    // 描述
  isActive: Boolean,      // 是否激活
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

## 访问方式
在admin dashboard的sidebar中选择"Chatflow Permissions"菜单项即可访问。

## 权限逻辑
- 每个chatflow-course组合只能有一个权限配置
- 创建时如果已存在相同组合，会更新现有配置
- 删除操作是软删除，将`isActive`设为false
- 角色基于LTI标准定义的角色URI

## 技术实现
- 前端：React组件，使用模态框进行CRUD操作
- 后端：Next.js API路由
- 数据库：MongoDB with Mongoose ODM
- 状态管理：React useState hooks
- 错误处理：统一的错误显示机制
