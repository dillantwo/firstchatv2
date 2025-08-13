# 🎯 QEF Moodle LTI 工具配置清单

## 📋 在QEF Moodle中配置External Tool的完整信息

### 🔧 必填字段配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Tool name** | `QEF Chatbot` | 工具显示名称 |
| **Tool URL** | `http://localhost:3000/api/lti/login` | 工具主URL |
| **LTI version** | `LTI 1.3` | 选择LTI 1.3版本 |
| **Client ID** | `ctc9F7U8FjAdXsJ` | 从您的截图获取 |

### 🌐 LTI 1.3 专用URL配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Initiate login URL** | `http://localhost:3000/api/lti/login` | LTI登录初始化端点 |
| **Redirection URI(s)** | `http://localhost:3000/api/lti/callback` | 认证成功后的回调URL |

### 🔑 安全配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Public key** | 见下方完整公钥 | RSA公钥用于JWT验证 |
| **Default launch container** | `New window` | 在新窗口中打开 |

---

## 🔑 完整RSA公钥

请将以下**完整内容**复制粘贴到Moodle的"Public key"字段：

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArQCof0DBp4dWWe5ihd6s
kubtc0EPQAhChRn37mh6dqdLy0z9vXUY3n4sqwYZ7F2DwNFfXXZVPFCKnjM+hPkt
zmnTOI0vAt3ePmBtK8hbFv+2i8v1T9ruD60RlDpbD6biFIGSaaygax477vZVxybO
08Pd1qhx1BJQkzP4ySSfCYFelKTplc68sXjEnZ0BiTEFRCYkdKM1HKtHcksAqiJr
EHByJRpjzj2hoXE4AOMFOayLTbTGtlK++7A6luqr2XAHPUG9qqBlV+b2Cm5kRUZ8
in08C9QQk3h5l39KvO1gaQifYiS/6mHuv3rwbGJLj67JTsX1ZitIOvGrr0wFUGn4
rQIDAQAB
-----END PUBLIC KEY-----
```

---

## 🔄 LTI 1.3 认证流程

1. **用户点击Moodle中的工具链接**
   ↓
2. **Moodle调用Initiate login URL**: `http://localhost:3000/api/lti/login`
   ↓
3. **Chatbot处理登录请求并生成认证URL**
   ↓
4. **用户被重定向到Moodle进行认证**
   ↓
5. **认证成功后，Moodle POST到Redirection URI**: `http://localhost:3000/api/lti/callback`
   ↓
6. **Chatbot验证JWT令牌并创建用户会话**
   ↓
7. **用户被重定向到Chatbot主界面**: `http://localhost:3000`

---

## ✅ 配置完成检查清单

配置完成后，请验证以下项目：

- [ ] Tool name: `QEF Chatbot`
- [ ] Tool URL: `http://localhost:3000/api/lti/login`
- [ ] LTI version: `LTI 1.3`
- [ ] Client ID: `ctc9F7U8FjAdXsJ`
- [ ] Initiate login URL: `http://localhost:3000/api/lti/login`
- [ ] Redirection URI: `http://localhost:3000/api/lti/callback`
- [ ] Public key: 已正确粘贴完整公钥
- [ ] Default launch container: `New window`

---

## 🧪 测试验证

配置保存后：

1. **在课程中添加External Tool活动**
2. **选择"QEF Chatbot"工具**
3. **点击工具链接进行测试**

**期望结果**：
- ✅ 重定向到 `http://localhost:3000`
- ✅ 显示chatbot界面（而不是"需要从Moodle login"）
- ✅ 能够正常使用聊天功能

如果遇到问题，请检查Moodle的错误日志和浏览器开发者工具的控制台信息。
