# OneCar 商品管理系统 - API 接口文档

## 📋 概述

OneCar 商品管理系统提供了完整的 RESTful API 接口，支持商品管理、文件上传、验证码验证、水印处理和二维码生成等功能。所有 API 接口都遵循统一的响应格式和错误处理机制。

## 🌐 基础信息

- **Base URL**: `http://localhost:3001/api`
- **API 版本**: v1.0.0
- **数据格式**: JSON
- **字符编码**: UTF-8

## 🔐 认证机制

### JWT Token 认证

大部分 API 接口需要 JWT Token 认证。在请求头中包含：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取 Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password",
  "captcha": "1234",
  "captchaToken": "xxx"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

## 📝 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "error": "ERROR_CODE",
  "details": {
    // 错误详情（可选）
  }
}
```

### 分页响应

```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "items": [
      // 数据项
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 🛍️ 商品管理 API

### 获取商品列表

获取分页的商品列表，支持搜索、筛选和排序。

```http
GET /api/products
```

**查询参数**：
| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码（从1开始） |
| size | number | 否 | 20 | 每页数量 |
| category | string | 否 | - | 产品分类筛选 |
| status | string | 否 | - | 状态筛选（active/inactive） |
| search | string | 否 | - | 搜索关键词 |
| sortBy | string | 否 | createdAt | 排序字段 |
| sortOrder | string | 否 | desc | 排序方向（asc/desc） |

**响应示例**：
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "items": [
      {
        "id": "prod-123",
        "name": "商品名称",
        "description": "商品描述",
        "price": 99.99,
        "category": "electronics",
        "status": "active",
        "imageUrl": "/uploads/product-image.jpg",
        "stock": 100,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 获取商品详情

```http
GET /api/products/{id}
```

**路径参数**：
- `id` (string): 商品ID

**响应示例**：
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": "prod-123",
    "name": "商品名称",
    "description": "商品详细描述",
    "price": 99.99,
    "category": "electronics",
    "status": "active",
    "imageUrl": "/uploads/product-image.jpg",
    "gallery": [
      "/uploads/gallery-1.jpg",
      "/uploads/gallery-2.jpg"
    ],
    "stock": 100,
    "attributes": {
      "color": "red",
      "size": "L"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 创建商品

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "name": "新商品",
  "description": "商品描述",
  "price": 199.99,
  "category": "electronics",
  "status": "active",
  "imageUrl": "/uploads/new-product.jpg",
  "stock": 50,
  "attributes": {
    "color": "blue",
    "size": "M"
  }
}
```

### 更新商品

```http
PUT /api/products/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**（部分更新）：
```json
{
  "price": 179.99,
  "stock": 75
}
```

### 删除商品

```http
DELETE /api/products/{id}
Authorization: Bearer <token>
```

### 批量操作

```http
POST /api/products/batch
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "action": "delete",
  "productIds": ["prod-123", "prod-456"]
}
```

或

```json
{
  "action": "update",
  "productIds": ["prod-123", "prod-456"],
  "updateData": {
    "status": "inactive"
  }
}
```

### 更新排序

```http
PUT /api/products/sort
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：
```json
{
  "sortOrder": ["prod-456", "prod-123", "prod-789"]
}
```

## 🔐 验证码 API

### 获取验证码

```http
GET /api/captcha
```

**响应示例**：
```json
{
  "success": true,
  "message": "验证码生成成功",
  "data": {
    "token": "captcha-token-123",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiresIn": 300000
  }
}
```

### 验证验证码

```http
POST /api/captcha/verify
Content-Type: application/json
```

**请求体**：
```json
{
  "token": "captcha-token-123",
  "value": "ABCD"
}
```

### 刷新验证码

```http
POST /api/captcha/refresh
Content-Type: application/json
```

**请求体**：
```json
{
  "token": "captcha-token-123"
}
```

## 📁 文件上传 API

### 单文件上传

```http
POST /api/upload/single
Content-Type: multipart/form-data
Authorization: Bearer <token> (可选)
```

**请求体**：
- `file`: 文件对象

**响应示例**：
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "id": "file-123",
    "originalName": "image.jpg",
    "filename": "file-1640995200000-123456789.jpg",
    "url": "/uploads/file-1640995200000-123456789.jpg",
    "thumbnailUrl": "/uploads/thumb-file-1640995200000-123456789.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "uploadedAt": "2025-01-01T00:00:00.000Z",
    "uploadedBy": "user-123"
  }
}
```

### 多文件上传

```http
POST /api/upload/multiple
Content-Type: multipart/form-data
Authorization: Bearer <token> (可选)
```

**请求体**：
- `files`: 文件数组（最多10个）

### 图片压缩上传

```http
POST /api/upload/compress
Content-Type: multipart/form-data
Authorization: Bearer <token> (可选)
```

**请求体**：
- `image`: 图片文件
- `quality`: 压缩质量（1-100，默认80）
- `maxWidth`: 最大宽度（默认1920）
- `maxHeight`: 最大高度（默认1080）

### 删除文件

```http
DELETE /api/upload/{filename}
Authorization: Bearer <token>
```

### 获取文件信息

```http
GET /api/upload/info/{filename}
```

## 💧 水印处理 API

### 添加文字水印

```http
POST /api/watermark/text
Content-Type: application/json
Authorization: Bearer <token> (可选)
```

**请求体**：
```json
{
  "imagePath": "/uploads/original-image.jpg",
  "text": "OneCar",
  "fontSize": 24,
  "color": "rgba(255, 255, 255, 0.8)",
  "position": "bottom-right",
  "margin": 20
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "文字水印添加成功",
  "data": {
    "originalPath": "/uploads/original-image.jpg",
    "watermarkedUrl": "/uploads/watermarked-1640995200000-original-image.jpg",
    "watermarkType": "text",
    "watermarkConfig": {
      "text": "OneCar",
      "fontSize": 24,
      "color": "rgba(255, 255, 255, 0.8)",
      "position": "bottom-right",
      "margin": 20
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 添加图片水印

```http
POST /api/watermark/image
Content-Type: application/json
Authorization: Bearer <token> (可选)
```

**请求体**：
```json
{
  "imagePath": "/uploads/original-image.jpg",
  "watermarkPath": "/uploads/watermark-logo.png",
  "opacity": 0.8,
  "position": "bottom-right",
  "margin": 20,
  "scale": 0.2
}
```

### 批量添加水印

```http
POST /api/watermark/batch
Content-Type: application/json
Authorization: Bearer <token> (可选)
```

**请求体**：
```json
{
  "imagePaths": [
    "/uploads/image1.jpg",
    "/uploads/image2.jpg"
  ],
  "watermarkType": "text",
  "watermarkConfig": {
    "text": "OneCar",
    "fontSize": 24,
    "position": "bottom-right"
  }
}
```

## 🔲 二维码生成 API

### 生成二维码

```http
POST /api/qrcode/generate
Content-Type: application/json
Authorization: Bearer <token> (可选)
```

**请求体**：
```json
{
  "text": "https://onecar.com/product/123",
  "width": 200,
  "margin": 1,
  "darkColor": "#000000",
  "lightColor": "#FFFFFF",
  "errorCorrectionLevel": "M",
  "format": "png"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "二维码生成成功",
  "data": {
    "id": "qr-123",
    "text": "https://onecar.com/product/123",
    "filename": "qrcode-1640995200000.png",
    "url": "/uploads/qrcode-1640995200000.png",
    "format": "png",
    "config": {
      "width": 200,
      "margin": 1,
      "color": {
        "dark": "#000000",
        "light": "#FFFFFF"
      },
      "errorCorrectionLevel": "M"
    },
    "size": 5120,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 生成商品二维码

```http
POST /api/qrcode/product/{productId}
Content-Type: application/json
Authorization: Bearer <token> (可选)
```

**请求体**：
```json
{
  "baseUrl": "https://onecar.com/product",
  "includeParams": {
    "utm_source": "qrcode",
    "ref": "product_page"
  },
  "width": 200,
  "format": "png"
}
```

### 生成 vCard 二维码

```http
POST /api/qrcode/vcard
Content-Type: application/json
Authorization: Bearer <token> (可选)
```

**请求体**：
```json
{
  "name": "张三",
  "phone": "+86 138 0000 0000",
  "email": "zhangsan@example.com",
  "company": "OneCar",
  "title": "产品经理",
  "url": "https://onecar.com",
  "address": "北京市朝阳区",
  "width": 200,
  "format": "png"
}
```

### 批量生成二维码

```http
POST /api/qrcode/batch
Content-Type: application/json
Authorization: Bearer <token> (可选)
```

**请求体**：
```json
{
  "items": [
    {
      "text": "https://onecar.com/product/123",
      "filename": "product-123-qr.png"
    },
    {
      "text": "https://onecar.com/product/456",
      "filename": "product-456-qr.png"
    }
  ],
  "globalConfig": {
    "width": 200,
    "format": "png"
  }
}
```

## 🔧 系统管理 API

### 健康检查

```http
GET /api/health
```

**响应示例**：
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600.123,
  "environment": "development"
}
```

### API 信息

```http
GET /api
```

**响应示例**：
```json
{
  "name": "OneCar Product Management API",
  "version": "1.0.0",
  "description": "商品后台管理系统 API 服务",
  "endpoints": {
    "products": "/api/products",
    "captcha": "/api/captcha",
    "upload": "/api/upload",
    "watermark": "/api/watermark",
    "qrcode": "/api/qrcode",
    "health": "/api/health"
  }
}
```

## 📋 错误代码

| HTTP状态码 | 错误代码 | 描述 |
|-----------|----------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权访问 |
| 403 | FORBIDDEN | 禁止访问 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 413 | PAYLOAD_TOO_LARGE | 请求体过大 |
| 415 | UNSUPPORTED_MEDIA_TYPE | 不支持的媒体类型 |
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 429 | TOO_MANY_REQUESTS | 请求过于频繁 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 🚀 使用示例

### JavaScript/TypeScript 示例

```typescript
// 获取商品列表
const response = await fetch('/api/products?page=1&size=20', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.success) {
  console.log('商品列表:', data.data.items);
} else {
  console.error('错误:', data.message);
}

// 上传文件
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('/api/upload/single', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const uploadData = await uploadResponse.json();
if (uploadData.success) {
  console.log('上传成功:', uploadData.data.url);
}
```

### cURL 示例

```bash
# 获取商品列表
curl -X GET "http://localhost:3001/api/products?page=1&size=20" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"

# 创建商品
curl -X POST "http://localhost:3001/api/products" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新商品",
    "description": "商品描述",
    "price": 99.99,
    "category": "electronics",
    "status": "active"
  }'

# 上传文件
curl -X POST "http://localhost:3001/api/upload/single" \
  -H "Authorization: Bearer your-token" \
  -F "file=@/path/to/your/file.jpg"

# 生成二维码
curl -X POST "http://localhost:3001/api/qrcode/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "https://onecar.com",
    "width": 200,
    "format": "png"
  }'
```

## 📊 速率限制

| 端点分类 | 限制规则 | 说明 |
|----------|----------|------|
| 通用API | 100请求/15分钟 | 按IP地址限制 |
| 验证码API | 5请求/1分钟 | 防止恶意请求 |
| 文件上传 | 10请求/1分钟 | 防止滥用存储 |
| 认证相关 | 5请求/5分钟 | 防止暴力破解 |

## 🔒 安全注意事项

1. **API密钥保护**: 永远不要在客户端代码中暴露JWT密钥
2. **HTTPS使用**: 生产环境必须使用HTTPS
3. **输入验证**: 所有输入都会进行服务端验证
4. **文件上传安全**: 限制文件类型和大小
5. **SQL注入防护**: 使用参数化查询
6. **XSS防护**: 输出内容自动转义

---

**文档版本**: v1.0.0  
**最后更新**: 2025-09-25  
**API版本**: v1.0.0