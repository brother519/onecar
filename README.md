# 照片上传下载系统

基于Spring Boot 3.x开发的高性能照片上传下载系统，支持图片压缩、缩略图生成、权限控制等功能。

## 系统特性

### 🚀 高性能
- 支持大文件上传（最大10MB）
- 自动图片压缩和格式优化
- 多级缓存机制
- 异步处理提升响应速度

### 🔒 安全可靠
- 文件类型安全检查（魔数验证）
- 基于角色的访问权限控制
- 防盗链保护
- XSS和路径遍历攻击防护

### 📊 智能处理
- 自动生成多种尺寸缩略图
- 重复文件检测（MD5校验）
- 图片元数据提取
- 智能文件分类存储

### 🛠 易于维护
- 完善的异常处理机制
- 详细的日志记录
- RESTful API设计
- Swagger API文档

## 技术栈

- **后端框架**: Spring Boot 3.2.1
- **数据库**: H2（开发）/ MySQL（生产）
- **缓存**: Spring Cache
- **图片处理**: Thumbnailator
- **安全**: Spring Security
- **API文档**: SpringDoc OpenAPI 3
- **构建工具**: Maven 3.8+
- **JDK版本**: Java 17+

## 项目结构

```
onecar/
├── src/
│   ├── main/
│   │   ├── java/com/onecar/photoservice/
│   │   │   ├── config/          # 配置类
│   │   │   ├── controller/      # 控制器
│   │   │   ├── dto/             # 数据传输对象
│   │   │   ├── entity/          # 实体类
│   │   │   ├── exception/       # 异常类
│   │   │   ├── repository/      # 数据访问层
│   │   │   ├── service/         # 业务逻辑层
│   │   │   └── util/            # 工具类
│   │   └── resources/
│   │       ├── application.yml          # 主配置文件
│   │       ├── application-dev.yml      # 开发环境配置
│   │       ├── application-test.yml     # 测试环境配置
│   │       └── application-prod.yml     # 生产环境配置
│   └── test/                    # 测试代码
├── target/                      # Maven构建输出（被.gitignore忽略）
├── storage/                     # 文件存储目录（被.gitignore忽略）
├── logs/                        # 日志文件（被.gitignore忽略）
├── .gitignore                   # Git忽略配置
├── pom.xml                      # Maven配置文件
└── README.md                    # 项目说明文档
```

## 版本控制

### .gitignore配置
本项目已配置完善的`.gitignore`文件，确保只跟踪必要的源代码文件：

#### 忽略的文件类型
- **构建产物**: `target/`, `*.jar`, `*.war`等Maven构建生成的文件
- **IDE配置**: `.idea/`, `*.iml`, `.vscode/`, `.settings/`等IDE生成的配置文件
- **运行时文件**: `logs/`, `storage/`, `cache/`等应用运行时生成的文件
- **系统文件**: `.DS_Store`, `Thumbs.db`等操作系统生成的文件
- **敏感文件**: `.env`, `*.key`等包含敏感信息的配置文件

#### 维护建议
- 新增构建工具或IDE时，及时更新`.gitignore`规则
- 定期检查是否有新的临时文件需要忽略
- 重要规则变更时通知团队成员

## 快速开始

### 环境要求
- JDK 17 或更高版本
- Maven 3.8+ 或使用内置的Maven Wrapper
- Git（用于版本控制）

### 运行应用

1. **克隆项目**
```bash
git clone <repository-url>
cd onecar
```

2. **运行开发环境**
```bash
./mvnw spring-boot:run
```

3. **访问应用**
- 应用地址: http://localhost:8080
- API文档: http://localhost:8080/swagger-ui.html
- H2控制台: http://localhost:8080/h2-console

### 配置说明

系统支持多环境配置：
- `dev`: 开发环境（默认）- 使用H2内存数据库
- `test`: 测试环境 - 用于自动化测试
- `prod`: 生产环境 - 使用MySQL数据库

#### 文件存储配置
应用运行时会在项目根目录下创建以下目录（已在.gitignore中忽略）：
```
storage/
├── images/     # 上传的图片文件
├── temp/       # 临时处理文件
└── cache/      # 缓存文件
```

#### 日志配置
应用日志存储在`logs/`目录下（已在.gitignore中忽略）：
- `photo-service.log` - 应用主日志文件
- 支持按大小滚动（50MB）和时间归档（30天）

## API接口

### 文件上传
```bash
# 单文件上传
POST /api/files/upload
Content-Type: multipart/form-data

# 批量文件上传
POST /api/files/batch-upload
Content-Type: multipart/form-data
```

### 文件下载
```bash
# 文件下载
GET /api/files/download/{fileId}

# 缩略图下载
GET /api/files/thumbnail/{fileId}?size=300x300

# 文件信息查询
GET /api/files/{fileId}/info
```

## 存储结构

```
storage/
├── images/           # 图片文件存储
│   └── 2024/01/01/  # 按日期分层
├── temp/            # 临时文件
└── cache/           # 缓存文件
```

## 开发指南

### 添加新的文件类型支持
1. 在 `SecurityUtils` 中添加MIME类型和扩展名
2. 如需特殊处理，在 `ImageUtils` 中添加处理逻辑
3. 更新配置文件中的允许类型列表

### 自定义存储策略
1. 实现 `FileStorageStrategy` 接口
2. 在 `FileService` 中注入新的存储策略
3. 更新配置以启用新策略

### 扩展权限控制
1. 在 `FilePermission.PermissionType` 中添加新权限类型
2. 更新 `SecurityService` 中的权限验证逻辑
3. 添加相应的API接口

## 部署说明

### Docker部署
```bash
# 构建镜像
docker build -t photo-service .

# 运行容器
docker run -p 8080:8080 -v /data/storage:/app/storage photo-service
```

### 生产环境配置
```bash
# 使用生产配置
java -jar photo-service.jar --spring.profiles.active=prod
```

## 监控和维护

### 健康检查
- 端点: `/actuator/health`
- 包含磁盘空间、数据库连接等检查

### 性能监控
- Metrics端点: `/actuator/metrics`
- 支持Prometheus格式导出

### 日志管理
- 日志文件: `logs/photo-service.log`
- 支持按大小和时间滚动

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如有问题或建议，请创建 [Issue](../../issues) 或联系开发团队。