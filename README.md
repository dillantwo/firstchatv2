# QEF ChatBot - AI教育聊天机器人

> 一个基于 Next.js 和 Flowise API 的智能教育聊天机器人，专为香港小学科学科设计，支持 LTI 1.3 标准，可无缝集成到 Moodle 学习管理系统中。

## 🚀 主要功能

- 🤖 **智能AI对话** - 专注于小学科学科"电力及电路"课题的AI助手
- 🔐 **LTI 1.3集成** - 完全符合LTI 1.3标准，与Moodle完美集成
- 📱 **响应式设计** - 支持桌面、平板和移动设备
- 💬 **多聊天管理** - 支持多个聊天会话和不同chatflow
- 🖼️ **图片处理** - 支持图片上传和AI图像分析
- 📚 **数学公式渲染** - 使用KaTeX渲染数学公式
- 🎨 **现代化UI** - 美观易用的用户界面
- 🔒 **安全认证** - 基于JWT的安全会话管理

## 🛠️ 技术栈

- **前端**: Next.js 15, React 19, TailwindCSS
- **后端**: Node.js, MongoDB, Mongoose
- **AI集成**: Flowise API, OpenAI GPT-4
- **认证**: LTI 1.3, JWT
- **部署**: PM2, Nginx

## 📦 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd qef-chatbot
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
复制环境配置模板并填入实际配置：
```bash
cp .env.template .env.local
```

编辑 `.env.local` 文件，填入以下必要配置：
```env
# 数据库配置
MONGODB_URI=your_mongodb_connection_string

# JWT密钥
JWT_SECRET=your_jwt_secret_key

# LTI 1.3 配置
LTI_CLIENT_ID=your_lti_client_id
LTI_DEPLOYMENT_ID=your_deployment_id
LTI_ISSUER=https://your-moodle-site.com
LTI_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
LTI_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Flowise API配置
FLOWISE_BASE_URL=your_flowise_api_url
FLOWISE_API_KEY=your_flowise_api_key
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📖 文档指南

- [快速设置指南](./QUICK_SETUP_GUIDE.md) - 完整的安装和配置指南
- [LTI集成指南](./LTI_SETUP_GUIDE.md) - LTI 1.3集成详细说明
- [Moodle配置指南](./MOODLE_LTI_CONFIG.md) - Moodle端的配置步骤

## 🚀 部署

### 生产环境部署
```bash
npm run build
npm start
```

### 使用PM2部署
```bash
pm2 start ecosystem.config.js --env production
```

## 🧪 测试

运行测试脚本：
```bash
npm run migrate-to-lti  # 数据迁移
node scripts/check-lti-users.js  # 检查LTI用户
```

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📞 支持

如有问题，请联系项目维护者或提交 Issue。
