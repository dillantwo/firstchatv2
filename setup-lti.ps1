# PowerShell Script for QEF Chatbot LTI 1.3 Setup
# 运行此脚本自动设置LTI 1.3认证

Write-Host "🚀 QEF Chatbot LTI 1.3 自动设置脚本" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# 检查OpenSSL
Write-Host "📋 检查系统要求..." -ForegroundColor Yellow
try {
    $opensslVersion = openssl version 2>$null
    Write-Host "✅ OpenSSL已安装: $opensslVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ OpenSSL未安装。请先安装OpenSSL:" -ForegroundColor Red
    Write-Host "   推荐下载地址: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "   或使用Chocolatey: choco install openssl" -ForegroundColor Yellow
    exit 1
}

# 检查Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js未安装。请先安装Node.js" -ForegroundColor Red
    exit 1
}

# 生成RSA密钥对
Write-Host "🔑 生成RSA密钥对..." -ForegroundColor Yellow
if (Test-Path "private.pem") {
    Write-Host "⚠️  检测到已存在的private.pem文件" -ForegroundColor Yellow
    $overwrite = Read-Host "是否重新生成密钥对? 这将替换现有密钥 (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "使用现有密钥对..." -ForegroundColor Yellow
    } else {
        Remove-Item "private.pem", "public.pem" -ErrorAction SilentlyContinue
        openssl genrsa -out private.pem 2048
        openssl rsa -in private.pem -pubout -out public.pem
        Write-Host "✅ 新密钥对已生成并替换" -ForegroundColor Green
    }
} else {
    openssl genrsa -out private.pem 2048
    openssl rsa -in private.pem -pubout -out public.pem
    Write-Host "✅ RSA密钥对已生成" -ForegroundColor Green
}

# 检查密钥文件
if (-not (Test-Path "private.pem") -or -not (Test-Path "public.pem")) {
    Write-Host "❌ 密钥生成失败，请检查OpenSSL安装" -ForegroundColor Red
    exit 1
}

# 读取密钥内容并转换格式
Write-Host "📝 处理密钥格式..." -ForegroundColor Yellow
try {
    $privateKey = Get-Content private.pem -Raw
    $publicKey = Get-Content public.pem -Raw
    
    # 转换为单行格式，适合.env文件
    $privateKeyEnv = ($privateKey -replace "`r`n", "\n" -replace "`n", "\n").Trim()
    $publicKeyEnv = ($publicKey -replace "`r`n", "\n" -replace "`n", "\n").Trim()
    
    Write-Host "✅ 密钥格式处理完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 密钥文件读取失败" -ForegroundColor Red
    exit 1
}

# 创建.env.local文件
Write-Host "⚙️ 创建环境配置文件..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "⚠️  检测到已存在的.env.local文件" -ForegroundColor Yellow
    $backup = Read-Host "是否备份现有配置并创建新的? (y/N)"
    if ($backup -eq "y" -or $backup -eq "Y") {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        Copy-Item ".env.local" ".env.local.backup-$timestamp"
        Write-Host "✅ 已备份为: .env.local.backup-$timestamp" -ForegroundColor Green
    } else {
        Write-Host "保持现有.env.local文件，请手动更新密钥配置" -ForegroundColor Yellow
        Write-Host "✅ 设置脚本已完成密钥生成部分" -ForegroundColor Green
        Write-Host "🔑 请复制下面的公钥到Moodle:" -ForegroundColor Cyan
        Write-Host $publicKey -ForegroundColor White
        exit 0
    }
}

# 检查模板文件
if (-not (Test-Path ".env.local.template")) {
    Write-Host "❌ .env.local.template文件不存在" -ForegroundColor Red
    exit 1
}

# 复制模板并自动配置
try {
    $envContent = Get-Content ".env.local.template" -Raw
    
    # 替换密钥
    $envContent = $envContent -replace 'LTI_PRIVATE_KEY="[^"]*"', "LTI_PRIVATE_KEY=`"$privateKeyEnv`""
    $envContent = $envContent -replace 'LTI_PUBLIC_KEY="[^"]*"', "LTI_PUBLIC_KEY=`"$publicKeyEnv`""
    
    # 生成安全的JWT SECRET
    Add-Type -AssemblyName System.Web
    $jwtSecret = "QEF-ChatBot-2024-" + [System.Web.Security.Membership]::GeneratePassword(32, 8)
    $envContent = $envContent -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret"
    
    # 写入文件
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -NoNewline
    Write-Host "✅ .env.local文件已自动配置" -ForegroundColor Green
} catch {
    Write-Host "❌ .env.local文件创建失败: $_" -ForegroundColor Red
    exit 1
}

# 安装依赖
Write-Host "📦 检查项目依赖..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $installDeps = Read-Host "是否安装/更新项目依赖? (Y/n)"
    if ($installDeps -ne "n" -and $installDeps -ne "N") {
        Write-Host "正在安装依赖..." -ForegroundColor Yellow
        npm install
        Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    }
}

# 显示配置信息
Write-Host "" -ForegroundColor White
Write-Host "🎯 配置完成！接下来的步骤:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

Write-Host "1. 📝 请编辑 .env.local 文件，更新以下配置:" -ForegroundColor Yellow
Write-Host "   - LTI_ISSUER (您的Moodle站点URL)" -ForegroundColor White
Write-Host "   - NEXTAUTH_URL (您的chatbot域名)" -ForegroundColor White
Write-Host "   - LTI_REDIRECT_URI (回调URL)" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "2. 🔑 在Moodle LTI工具配置中粘贴以下公钥:" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Gray
Write-Host $publicKey -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Gray

Write-Host "" -ForegroundColor White
Write-Host "3. 🌐 Moodle LTI工具配置示例:" -ForegroundColor Yellow
Write-Host "   - Tool URL: https://your-domain.com/api/lti/login" -ForegroundColor White
Write-Host "   - Initiate login URL: https://your-domain.com/api/lti/login" -ForegroundColor White
Write-Host "   - Redirection URI: https://your-domain.com/api/lti/callback" -ForegroundColor White
Write-Host "   - Client ID: ctc9F7U8fJAciXJ (已在截图中配置)" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "4. 🚀 启动开发服务器:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "🔗 相关文档:" -ForegroundColor Cyan
Write-Host "   - 详细配置: MOODLE_LTI_CONFIG.md" -ForegroundColor White
Write-Host "   - 快速指南: QUICK_SETUP_GUIDE.md" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "✅ LTI 1.3 自动设置完成！" -ForegroundColor Green
Write-Host "⚡ 准备就绪，请继续配置Moodle端设置" -ForegroundColor Green
