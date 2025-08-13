# Moodle LTI 1.3 完整配置指南

## 📝 第一步：Moodle Tool Settings 配置

根据您的截图，请在Moodle管理界面中按以下方式配置：

### 基本信息 (Tool settings)
```
Tool name: QEF chatbot
Tool URL: https://your-chatbot-domain.com
Tool description: AI-powered educational chatbot for personalized learning assistance
LTI version: LTI 1.3
Client ID: ctc9F7U8fJAciXJ (已显示在您的截图中)
Public key type: RSA key
```

### 🔗 重要的URL配置
请在相应字段中填入：
```
Initiate login URL: https://your-chatbot-domain.com/api/lti/login
Redirection URI(s): https://your-chatbot-domain.com/api/lti/callback
```

### 🔑 Public Key配置
您需要在"Public key"文本框中粘贴RSA公钥内容（见下面的密钥生成步骤）。

## 🔑 第二步：生成RSA密钥对

在您的服务器或本地机器上运行：

### Windows (使用 OpenSSL 或 Git Bash)
```bash
# 生成私钥
openssl genrsa -out private.pem 2048

# 生成公钥
openssl rsa -in private.pem -pubout -out public.pem

# 查看私钥内容
type private.pem

# 查看公钥内容  
type public.pem
```

### Linux/Mac
```bash
# 生成私钥
openssl genrsa -out private.pem 2048

# 生成公钥
openssl rsa -in private.pem -pubout -out public.pem

# 查看私钥内容
cat private.pem

# 查看公钥内容
cat public.pem
```

## 📋 第三步：配置.env.local文件

基于您当前的配置和截图信息，创建`.env.local`文件：

```bash
# ===============================================
# JWT Secret (用于会话管理)
# ===============================================
JWT_SECRET=QEF-ChatBot-2024-Secure-Secret-Key-Please-Change-This

# ===============================================
# LTI 1.3 基本配置 (基于您的截图)
# ===============================================
LTI_CLIENT_ID=ctc9F7U8fJAciXJ
LTI_DEPLOYMENT_ID=1
LTI_ISSUER=https://your-moodle-site.com
LTI_KEYSET_URL=https://your-moodle-site.com/mod/lti/certs.php

# ===============================================
# 应用程序URL配置
# ===============================================
NEXTAUTH_URL=https://your-chatbot-domain.com
LTI_REDIRECT_URI=https://your-chatbot-domain.com/api/lti/callback

# ===============================================
# RSA密钥对 (将上面生成的密钥内容粘贴到这里)
# ===============================================
# 注意：将多行密钥转换为单行，使用 \n 替换换行符
LTI_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...(您的私钥内容)...AQAB\n-----END RSA PRIVATE KEY-----"
LTI_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0B...(您的公钥内容)...AQAB\n-----END PUBLIC KEY-----"

# ===============================================
# 保留的现有配置
# ===============================================
MONGODB_URI=mongodb://localhost:27017/firstchat
FLOWISE_BASE_URL=https://aai.eduhk.hk
FLOWISE_API_KEY=b6Vzr2ZBar8Ssb34euKp9VCm_n23DzBJMm0Baa7bphU
```

## 🔧 第四步：更新您现有的.env文件

请根据上面的模板更新您的`.env`文件，或者创建一个新的`.env.local`文件。

## 📋 第五步：完成Moodle配置

### 在Moodle中完成工具注册：
1. 将生成的**公钥内容**完整地粘贴到"Public key"字段中
2. 确保"Initiate login URL"和"Redirection URI(s)"字段填写正确
3. 保存工具配置

### 添加工具到课程：
1. 进入您的Moodle课程
2. 开启编辑模式
3. 添加活动 → External tool
4. 选择"QEF chatbot"工具
5. 配置活动名称和描述
6. 保存设置

## 🧪 第六步：测试连接

### 开发测试：
1. 启动您的chatbot应用：`npm run dev`
2. 访问测试页面：`http://localhost:3000/lti-test.html`
3. 填入配置信息进行测试

### 生产测试：
1. 在Moodle课程中点击QEF chatbot活动
2. 应该会自动跳转到chatbot应用并完成登录

## 🔍 故障排除

### 常见问题：
1. **"Access Restricted"错误**：用户未通过LTI启动访问
2. **认证失败**：检查RSA密钥配置和Client ID
3. **无效会话**：检查JWT_SECRET配置

### 调试步骤：
1. 检查浏览器控制台错误
2. 验证环境变量设置
3. 确认RSA密钥格式正确
4. 检查Moodle LTI工具配置

## 📞 技术支持

如果遇到问题，请检查：
- `LTI_SETUP_GUIDE.md` - 详细技术文档
- `LTI_MIGRATION_SUMMARY.md` - 迁移说明
- 应用日志和Moodle日志
