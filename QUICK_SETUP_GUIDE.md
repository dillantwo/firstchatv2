# QEF Chatbot LTI 1.3 快速设置指南

## 📋 设置步骤总览

基于您提供的Moodle配置截图，以下是完成LTI 1.3集成的具体步骤：

## 🔑 第1步：生成RSA密钥对

在项目根目录运行：

### Windows PowerShell：
```powershell
# 确保已安装OpenSSL
.\setup-lti.ps1
```

### 手动命令：
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

## ⚙️ 第2步：配置环境变量

1. 复制 `.env.local.template` 为 `.env.local`：
```powershell
Copy-Item .env.local.template .env.local
```

2. 编辑 `.env.local`，需要修改的字段：

```env
# 修改为您的实际Moodle站点URL
LTI_ISSUER=https://your-actual-moodle-site.com

# 修改为您的chatbot域名
NEXTAUTH_URL=https://your-chatbot-domain.com
LTI_REDIRECT_URI=https://your-chatbot-domain.com/api/lti/callback

# 填入生成的RSA密钥（转换为单行格式）
LTI_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
LTI_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

## 🎯 第3步：在Moodle中配置External Tool

基于您的截图，在Moodle中填入以下信息：

### 必填字段：
- **Tool URL**: `https://your-chatbot-domain.com/api/lti/login`
- **LTI version**: `LTI 1.3`
- **Public key**: 将第1步生成的 `public.pem` 内容粘贴到此处
- **Initiate login URL**: `https://your-chatbot-domain.com/api/lti/login`
- **Redirection URI(s)**: `https://your-chatbot-domain.com/api/lti/callback`

### 已配置的字段（从截图中获取）：
- **Client ID**: `ctc9F7U8fJAciXJ` ✅
- **Default launch container**: `New window` ✅

## 🚀 第4步：启动应用

```powershell
npm run dev
```

访问 `http://localhost:3000` 应该显示："需要从Moodle login"

## ✅ 第5步：测试LTI集成

1. 在Moodle课程中添加External Tool活动
2. 选择您配置的LTI工具
3. 点击工具链接，应该会：
   - 重定向到chatbot
   - 显示登录用户信息
   - 正常使用聊天功能

## 🔧 常见问题解决

### 1. "Invalid JWT signature" 错误
- 检查 `LTI_PRIVATE_KEY` 格式是否正确
- 确保Moodle中的Public key与您的private key匹配

### 2. "Invalid issuer" 错误
- 确认 `LTI_ISSUER` 与您的Moodle站点URL完全匹配

### 3. "Invalid client_id" 错误
- 确认 `LTI_CLIENT_ID=ctc9F7U8fJAciXJ` 没有被修改

### 4. HTTPS要求
- 生产环境必须使用HTTPS
- 开发环境可以使用HTTP，但某些LTI功能可能受限

## 📞 技术支持

如果遇到问题，请检查：
1. 浏览器开发者工具的控制台错误
2. Next.js终端输出的错误信息
3. Moodle的LTI调试日志

## 🔄 回滚到Clerk（如需要）

如果需要临时回滚到Clerk认证：
```bash
git checkout HEAD~1  # 回到上一个提交
```

---

**注意**: 请确保所有域名和URL配置正确，特别是在生产环境中必须使用HTTPS。
