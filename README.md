# 商品售卖平台

一个完整的电商平台，包含商品浏览、购物车、订单、支付、评论等核心功能。

## 项目结构

```
onecar/
├── backend/              # 后端服务（Go语言）
│   ├── cmd/
│   │   ├── server/      # 主服务器
│   │   └── init-data/   # 数据初始化
│   ├── handlers/        # API处理器
│   ├── models/          # 数据模型
│   ├── middleware/      # 中间件
│   ├── database/        # 数据库连接
│   ├── config/          # 配置
│   └── utils/           # 工具函数
└── frontend/            # 前端（原生HTML/CSS/JS）
    ├── index.html       # 首页
    ├── pages/           # 其他页面
    ├── js/              # JavaScript文件
    └── css/             # 样式文件
```

## 功能特性

### 后端功能
- ✅ 用户认证系统（注册、登录、JWT Token）
- ✅ 商品管理（搜索、筛选、排序、分页）
- ✅ 购物车管理（添加、修改、删除）
- ✅ 地址管理（CRUD操作）
- ✅ 订单系统（创建、查询、状态管理）
- ✅ 模拟支付（支付流程、回调）
- ✅ 评论系统（发表、查询、评分统计）

### 前端功能
- ✅ 商品列表展示和搜索
- ✅ 高级筛选（分类、品牌、价格）
- ✅ 购物车管理
- ✅ 用户登录注册
- 🚧 商品详情页
- 🚧 订单结算
- 🚧 订单管理
- 🚧 评论功能

## 快速开始

### 1. 启动后端服务

```bash
cd backend

# 初始化示例数据（首次运行）
go run cmd/init-data/main.go

# 启动服务器
go run cmd/server/main.go
```

后端服务将在 `http://localhost:8090` 启动

### 2. 访问前端

由于前端使用原生HTML/JS，需要通过HTTP服务器访问：

```bash
cd frontend

# 使用Python启动简单HTTP服务器
python3 -m http.server 8080

# 或使用Go
go run -m http.server 8080
```

然后在浏览器访问：`http://localhost:8080`

## API文档

### 基础URL
```
http://localhost:8090/api
```

### 认证接口

#### 注册
- **POST** `/auth/register`
- Body: `{"username": "", "password": "", "email": "", "phone": ""}`

#### 登录  
- **POST** `/auth/login`
- Body: `{"username": "", "password": ""}`

### 商品接口

#### 搜索商品
- **GET** `/products/search`
- 参数: `keyword, category, brand, minPrice, maxPrice, sortBy, sortOrder, page, pageSize`

#### 商品详情
- **GET** `/products/:productId`

### 购物车接口（需要登录）

#### 获取购物车
- **GET** `/cart`
- Header: `Authorization: Bearer {token}`

#### 添加商品
- **POST** `/cart/items`
- Body: `{"productId": "", "quantity": 1}`

#### 更新商品
- **PUT** `/cart/items/:productId`
- Body: `{"quantity": 1, "selected": true}`

#### 删除商品
- **DELETE** `/cart/items/:productId`

### 地址接口（需要登录）

#### 获取地址列表
- **GET** `/addresses`

#### 添加地址
- **POST** `/addresses`

#### 更新地址
- **PUT** `/addresses/:addressId`

#### 删除地址
- **DELETE** `/addresses/:addressId`

### 订单接口（需要登录）

#### 创建订单
- **POST** `/orders`

#### 订单列表
- **GET** `/orders`

#### 订单详情
- **GET** `/orders/:orderId`

### 支付接口（需要登录）

#### 发起支付
- **POST** `/payments/pay`

#### 支付回调
- **POST** `/payments/callback`

### 评论接口

#### 获取评论
- **GET** `/products/:productId/comments`

#### 发表评论（需要登录）
- **POST** `/comments`

## 技术栈

### 后端
- Go 1.24
- Gin（Web框架）
- GORM（ORM）
- SQLite（数据库）
- JWT（认证）

### 前端
- 原生HTML5
- CSS3
- JavaScript (ES6+)
- Fetch API

## 示例数据

系统已预置10个示例商品：
- iPhone 15 Pro Max
- 华为Mate 60 Pro
- MacBook Pro 14英寸
- 小米14 Ultra
- AirPods Pro 2代
- 索尼WH-1000XM5
- iPad Air 5
- 戴森V15 Detect吸尘器
- Nintendo Switch OLED
- 罗技MX Master 3S鼠标

## 注意事项

1. 后端服务运行在8090端口
2. 前端需要通过HTTP服务器访问，不能直接打开HTML文件
3. 首次运行需要先执行数据初始化脚本
4. 支付功能为模拟实现，不对接真实支付平台
5. 数据库文件位于 `backend/data/ecommerce.db`

## 开发计划

- [ ] 完善商品详情页
- [ ] 实现订单结算流程
- [ ] 添加订单管理页面
- [ ] 实现评论功能前端
- [ ] 添加商品图片上传
- [ ] 实现搜索历史
- [ ] 添加收藏功能
- [ ] 优化移动端适配
