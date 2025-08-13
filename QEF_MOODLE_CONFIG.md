# 🎯 QEF Chatbot LTI 1.3 配置摘要

## ✅ 已完成配置

### 本地环境
- ✅ **应用URL**: `http://localhost:3000`
- ✅ **Moodle站点**: `https://qefmoodle.com`
- ✅ **Client ID**: `ctc9F7U8fJAciXJ`
- ✅ **RSA密钥对**: 已生成并配置

### 应用状态
- ✅ **认证系统**: Clerk已移除，LTI 1.3已启用
- ✅ **访问控制**: 非LTI访问显示"需要从Moodle login"
- ✅ **数据库**: MongoDB本地连接已配置
- ✅ **应用运行**: `http://localhost:3000` 正常运行

---

## 📋 QEF Moodle LTI 工具配置

请在您的QEF Moodle (https://qefmoodle.com) 中按以下信息配置External Tool：

### 🔧 基本设置
| 字段 | 值 |
|------|-----|
| **Tool name** | QEF Chatbot |
| **Tool URL** | `http://localhost:3000/api/lti/login` |
| **LTI version** | LTI 1.3 |
| **Client ID** | `ctc9F7U8FjAdXsJ` | 从您的截图获取 |
| **Default launch container** | New window |

### 🌐 URL配置
| 字段 | 值 |
|------|-----|
| **Initiate login URL** | `http://localhost:3000/api/lti/login` |
| **Redirection URI(s)** | `http://localhost:3000/api/lti/callback` |

### 📋 LTI 1.3 流程说明
1. **Initiate login URL**: Moodle发起LTI登录时首先访问此URL
2. **Tool URL**: 也是登录初始化URL（通常相同）
3. **Redirection URI**: 认证成功后Moodle重定向用户到此URL完成登录

### 🔑 公钥配置
在"Public key"字段中粘贴以下内容：

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

## 🧪 测试步骤

### 1. 在Moodle中测试
1. 在QEF Moodle课程中添加"External Tool"活动
2. 选择上面配置的"QEF Chatbot"工具
3. 保存并点击工具链接

### 2. 验证流程
- ✅ 应该重定向到 `http://localhost:3000`
- ✅ 应该显示chatbot界面（不是"需要从Moodle login"）
- ✅ 应该能正常使用聊天功能

### 3. 验证访问控制
- 直接访问 `http://localhost:3000` → 应该显示"需要从Moodle login"
- 从Moodle启动 → 应该显示正常的chatbot界面

---

## 🔧 故障排除

### 如果遇到问题，请检查：

1. **"Invalid JWT signature"**
   - 确认Moodle中的公钥与本配置完全一致

2. **"Invalid issuer"**
   - 确认Moodle站点URL为 `https://qefmoodle.com`

3. **"Invalid client_id"**
   - 确认Client ID为 `ctc9F7U8fJAciXJ`

4. **连接超时**
   - 确认 `http://localhost:3000` 可以从Moodle服务器访问
   - 生产环境需要HTTPS和公网可访问的域名

---

## 📞 下一步

配置完成后，请告诉我测试结果。如果一切正常，我们可以进行生产环境的HTTPS配置。

---

**配置日期**: 2025年8月11日  
**版本**: QEF Chatbot LTI 1.3 Integration
