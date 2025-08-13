#!/bin/bash
# LTI 1.3 Quick Setup Script for QEF Chatbot

echo "🚀 QEF Chatbot LTI 1.3 快速设置脚本"
echo "===================================="

# 创建keys目录
mkdir -p keys

echo "📝 第1步：生成RSA密钥对..."
# 生成RSA密钥对
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

echo "✅ RSA密钥对已生成在 keys/ 目录中"

echo ""
echo "📋 第2步：创建.env.local配置文件..."

# 读取密钥内容并转换为环境变量格式
PRIVATE_KEY=$(sed ':a;N;$!ba;s/\n/\\n/g' keys/private.pem)
PUBLIC_KEY=$(sed ':a;N;$!ba;s/\n/\\n/g' keys/public.pem)

# 创建.env.local文件
cat > .env.local << EOF
# ===============================================
# JWT Secret (用于会话管理)
# ===============================================
JWT_SECRET=QEF-ChatBot-2024-$(openssl rand -hex 16)

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
LTI_PRIVATE_KEY="$PRIVATE_KEY"
LTI_PUBLIC_KEY="$PUBLIC_KEY"

# ===============================================
# 数据库配置
# ===============================================
MONGODB_URI=mongodb://localhost:27017/firstchat

# ===============================================
# Flowise API配置
# ===============================================
FLOWISE_BASE_URL=https://aai.eduhk.hk
FLOWISE_API_KEY=b6Vzr2ZBar8Ssb34euKp9VCm_n23DzBJMm0Baa7bphU
EOF

echo "✅ .env.local文件已创建"

echo ""
echo "📋 第3步：显示公钥内容（用于Moodle配置）"
echo "=================================================="
echo "请将以下公钥内容复制到Moodle LTI工具的'Public key'字段中："
echo ""
cat keys/public.pem
echo ""
echo "=================================================="

echo ""
echo "📝 第4步：更新配置URLs"
echo "请编辑.env.local文件，将以下URL替换为您的实际域名："
echo "- NEXTAUTH_URL=https://your-chatbot-domain.com"
echo "- LTI_REDIRECT_URI=https://your-chatbot-domain.com/api/lti/callback"
echo "- LTI_ISSUER=https://your-moodle-site.com"
echo "- LTI_KEYSET_URL=https://your-moodle-site.com/mod/lti/certs.php"

echo ""
echo "🔧 第5步：在Moodle中配置LTI工具"
echo "工具设置参数："
echo "- Tool name: QEF chatbot"
echo "- Tool URL: https://your-chatbot-domain.com"
echo "- Client ID: ctc9F7U8fJAciXJ"
echo "- Initiate login URL: https://your-chatbot-domain.com/api/lti/login"
echo "- Redirection URI(s): https://your-chatbot-domain.com/api/lti/callback"
echo "- Public key: (上面显示的公钥内容)"

echo ""
echo "🧪 第6步：测试设置"
echo "运行以下命令测试："
echo "npm run migrate-to-lti"
echo "npm run dev"

echo ""
echo "🎉 设置完成！"
echo "详细说明请查看 MOODLE_LTI_CONFIG.md"
