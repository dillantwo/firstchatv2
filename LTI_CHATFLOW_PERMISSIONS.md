# LTI用户角色权限Chatflow选择器功能说明

## 概述

本系统已成功实现了基于LTI用户角色的Chatflow权限管理。当用户通过LTI登录时，系统会根据用户在当前课程中的角色来显示相应的可用Chatflow选项。

## 🏗️ 系统架构

### 数据模型

1. **LTIUser** - 存储LTI用户基本信息
2. **LTICourse** - 存储用户-课程关联信息，包括用户在特定课程中的角色
3. **ChatflowPermission** - 存储基于角色的Chatflow访问权限
4. **Chatflow** - 存储Chatflow的基本信息

### 权限模型

```javascript
ChatflowPermission {
  chatflowId: String,        // Chatflow ID
  courseId: String,          // 课程ID  
  allowedRoles: [String],    // 允许访问的角色列表
  isActive: Boolean,         // 是否激活
  description: String        // 描述
}
```

## 🔐 权限检查流程

### 1. 用户登录流程
```
LTI Launch → 用户验证 → 课程关联 → 角色获取 → 会话建立
```

### 2. Chatflow权限检查
```
用户请求 → 提取用户角色 → 查询权限表 → 过滤可用Chatflow → 返回结果
```

### 3. 核心API端点

- **`/api/chatflows`** - 获取用户可访问的Chatflow列表
- **`/api/chat/ai`** - 聊天时验证Chatflow使用权限
- **`/api/admin/chatflow-permissions`** - 管理员权限管理接口

## 📝 角色权限配置

### 标准LTI角色

- `http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor` - 教师
- `http://purl.imsglobal.org/vocab/lis/v2/membership#Learner` - 学生
- `http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant` - 助教
- `http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper` - 内容开发者
- `http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator` - 管理员

### 权限配置示例

```javascript
// 示例：通用AI助手 - 教师和学生都可使用
{
  courseId: "demo-course-123",
  chatflowId: "chatflow-general-ai", 
  allowedRoles: [
    "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
    "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
  ]
}

// 示例：高级研究助手 - 仅教师可使用
{
  courseId: "demo-course-123",
  chatflowId: "chatflow-advanced-research",
  allowedRoles: [
    "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
  ]
}
```

## 🛠️ 使用工具

### 1. 演示权限设置
```bash
npm run setup-demo-permissions
```
此命令会创建一些示例权限配置供测试使用。

### 2. 权限管理工具
```bash
# 查看所有权限
npm run manage-permissions list

# 查看特定课程的权限
npm run manage-permissions list demo-course-123

# 添加权限
npm run manage-permissions add demo-course-123 chatflow-general-ai "Instructor,Learner"

# 删除权限  
npm run manage-permissions remove demo-course-123 chatflow-general-ai

# 查看所有Chatflow
npm run manage-permissions chatflows
```

### 3. 管理员界面
访问 `/admin` 页面，使用图形化界面管理Chatflow权限。

## 🔄 系统工作流程

### 用户端体验

1. **LTI登录** - 用户从Moodle课程点击工具链接
2. **权限获取** - 系统获取用户在当前课程的角色
3. **Chatflow筛选** - 根据角色权限过滤可用的Chatflow
4. **选择器显示** - 在界面上显示用户可访问的Chatflow选项
5. **聊天权限验证** - 每次聊天时再次验证权限

### 管理员配置

1. **创建Chatflow** - 在Flowise中创建新的Chatflow
2. **同步到系统** - 系统自动同步Chatflow信息  
3. **配置权限** - 通过管理界面或命令行工具设置角色权限
4. **测试验证** - 使用不同角色用户测试权限是否正确

## 📋 关键文件

```
├── app/api/chatflows/route.js           # 获取用户可访问的Chatflow列表
├── app/api/chat/ai/route.js             # 聊天时的权限验证  
├── components/SimpleChatflowSelector.jsx # Chatflow选择器组件
├── utils/permissionUtilsNew.mjs         # 权限工具函数
├── models/ChatflowPermission.js         # 权限数据模型
├── scripts/setup-demo-permissions.js   # 演示权限设置脚本
├── scripts/manage-permissions.js       # 权限管理工具
└── components/admin/ChatflowPermissionManagement.jsx # 管理员界面
```

## 🧪 测试建议

### 1. 功能测试
- 使用不同角色的LTI用户登录
- 验证每个角色看到的Chatflow选项是否正确
- 测试聊天功能的权限验证

### 2. 权限边界测试
- 尝试访问无权限的Chatflow
- 验证权限变更后的实时效果
- 测试课程切换时的权限更新

### 3. 管理功能测试
- 通过管理界面添加/修改/删除权限
- 使用命令行工具批量管理权限
- 验证权限配置的持久性

## ⚠️ 注意事项

1. **角色映射** - 确保LTI角色正确映射到系统内部角色
2. **权限缓存** - 权限变更可能需要用户重新登录才能生效
3. **默认权限** - 新用户或新课程默认无任何Chatflow权限
4. **安全考虑** - 权限检查在服务端进行，不依赖前端验证

## 🔧 配置步骤

### 快速开始

1. **运行演示权限设置**
   ```bash
   npm run setup-demo-permissions
   ```

2. **修改脚本中的课程ID和Chatflow ID**
   编辑 `scripts/setup-demo-permissions.js` 中的示例数据

3. **通过管理界面配置权限**
   访问 `/admin` 进行图形化配置

4. **测试不同角色用户**
   通过不同的LTI用户登录验证权限

### 生产环境配置

1. 获取实际的LTI课程ID
2. 获取Flowise中的实际Chatflow ID  
3. 根据教学需求配置合适的角色权限
4. 定期审核和更新权限配置

---

**系统状态**: ✅ 已实现并可正常使用
**最后更新**: 2025-08-25
