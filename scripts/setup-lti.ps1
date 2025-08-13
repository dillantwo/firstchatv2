# QEF Chatbot LTI 1.3 Setup Script for Windows
# PowerShell版本的快速设置脚本

Write-Host "🚀 QEF Chatbot LTI 1.3 快速设置脚本" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# 检查OpenSSL是否可用
try {
    openssl version | Out-Null
    Write-Host "✅ OpenSSL 已找到" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未找到OpenSSL" -ForegroundColor Red
    Write-Host "请安装OpenSSL或使用Git Bash运行 setup-lti.sh" -ForegroundColor Yellow
    Write-Host "下载地址: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    exit 1
}

# 创建keys目录
New-Item -ItemType Directory -Force -Path "keys" | Out-Null

Write-Host "📝 第1步：生成RSA密钥对..." -ForegroundColor Cyan

# 生成RSA密钥对
& openssl genrsa -out keys/private.pem 2048
& openssl rsa -in keys/private.pem -pubout -out keys/public.pem

Write-Host "✅ RSA密钥对已生成在 keys\ 目录中" -ForegroundColor Green

Write-Host "`n📋 第2步：创建.env.local配置文件..." -ForegroundColor Cyan

# 读取密钥内容
$privateKeyContent = Get-Content keys/private.pem -Raw
$publicKeyContent = Get-Content keys/public.pem -Raw

# 转换换行符为\n
$privateKey = $privateKeyContent -replace "`r`n", "\n" -replace "`n", "\n"
$publicKey = $publicKeyContent -replace "`r`n", "\n" -replace "`n", "\n"

# 生成随机JWT密钥
$jwtSecret = "QEF-ChatBot-2024-" + [System.Web.Security.Membership]::GeneratePassword(32, 0)

# 创建.env.local文件内容
$envContent = @"
# ===============================================
# JWT Secret (用于会话管理)
# ===============================================
JWT_SECRET=$jwtSecret

# ===============================================
# LTI 1.3 基本配置
# ===============================================
LTI_CLIENT_ID=ctc9F7U8fJAciXJ
LTI_DEPLOYMENT_ID=1
LTI_ISSUER=https://your-moodle-site.com
LTI_KEYSET_URL=https://your-moodle-site.com/mod/lti/certs.php

# ===============================================
# 应用程序URL配置 (请修改为您的实际域名)
# ===============================================
NEXTAUTH_URL=https://your-chatbot-domain.com
LTI_REDIRECT_URI=https://your-chatbot-domain.com/api/lti/callback

# ===============================================
# RSA密钥对 (自动生成)
# ===============================================
LTI_PRIVATE_KEY="$privateKey"
LTI_PUBLIC_KEY="$publicKey"

# ===============================================
# 数据库配置
# ===============================================
MONGODB_URI=mongodb://localhost:27017/firstchat

# ===============================================
# Flowise API配置
# ===============================================
FLOWISE_BASE_URL=https://aai.eduhk.hk
FLOWISE_API_KEY=b6Vzr2ZBar8Ssb34euKp9VCm_n23DzBJMm0Baa7bphU
"@

# 写入.env.local文件
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ .env.local文件已创建" -ForegroundColor Green

Write-Host "`n📋 第3步：显示公钥内容（用于Moodle配置）" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "请将以下公钥内容复制到Moodle LTI工具的'Public key'字段中：" -ForegroundColor Yellow
Write-Host ""
Get-Content keys/public.pem
Write-Host ""
Write-Host "==================================================" -ForegroundColor Yellow

Write-Host "`n📝 第4步：更新配置URLs" -ForegroundColor Cyan
Write-Host "请编辑.env.local文件，将以下URL替换为您的实际域名：" -ForegroundColor White
Write-Host "- NEXTAUTH_URL=https://your-chatbot-domain.com" -ForegroundColor Yellow
Write-Host "- LTI_REDIRECT_URI=https://your-chatbot-domain.com/api/lti/callback" -ForegroundColor Yellow
Write-Host "- LTI_ISSUER=https://your-moodle-site.com" -ForegroundColor Yellow
Write-Host "- LTI_KEYSET_URL=https://your-moodle-site.com/mod/lti/certs.php" -ForegroundColor Yellow

Write-Host "`n🔧 第5步：在Moodle中配置LTI工具" -ForegroundColor Cyan
Write-Host "工具设置参数：" -ForegroundColor White
Write-Host "- Tool name: QEF chatbot" -ForegroundColor Yellow
Write-Host "- Tool URL: https://your-chatbot-domain.com" -ForegroundColor Yellow
Write-Host "- Client ID: ctc9F7U8fJAciXJ" -ForegroundColor Yellow
Write-Host "- Initiate login URL: https://your-chatbot-domain.com/api/lti/login" -ForegroundColor Yellow
Write-Host "- Redirection URI(s): https://your-chatbot-domain.com/api/lti/callback" -ForegroundColor Yellow
Write-Host "- Public key: (上面显示的公钥内容)" -ForegroundColor Yellow

Write-Host "`n🧪 第6步：测试设置" -ForegroundColor Cyan
Write-Host "运行以下命令测试：" -ForegroundColor White
Write-Host "npm run migrate-to-lti" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor Yellow

Write-Host "`n🎉 设置完成！" -ForegroundColor Green
Write-Host "详细说明请查看 MOODLE_LTI_CONFIG.md" -ForegroundColor Green

Write-Host "`n💡 提示：" -ForegroundColor Cyan
Write-Host "1. 请确保MongoDB正在运行" -ForegroundColor White
Write-Host "2. 将.env.local中的域名更改为您的实际域名" -ForegroundColor White
Write-Host "3. 在Moodle中完成LTI工具配置" -ForegroundColor White
Write-Host "4. 测试LTI连接" -ForegroundColor White
