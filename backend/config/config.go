// Package config 提供应用程序的配置管理功能
// 包含服务器、数据库和JWT认证等核心配置项
package config

// Config 应用配置结构体
// 包含了应用运行所需的所有配置信息
type Config struct {
	Server   ServerConfig   // 服务器相关配置
	Database DatabaseConfig // 数据库相关配置
	JWT      JWTConfig      // JWT认证相关配置
}

// ServerConfig 服务器配置结构体
// 定义HTTP服务器的监听地址和端口
type ServerConfig struct {
	Port string // 服务器监听端口
	Host string // 服务器监听地址
}

// DatabaseConfig 数据库配置结构体
// 定义SQLite数据库的连接信息
type DatabaseConfig struct {
	DBPath string // SQLite数据库文件路径
}

// JWTConfig JWT配置结构体
// 定义JWT token的生成和验证参数
type JWTConfig struct {
	Secret      string // JWT签名密钥，生产环境中应使用强密码
	ExpireHours int    // Token过期时间（小时）
}

// GetConfig 获取应用配置
// 返回包含默认配置值的Config实例
// 在实际使用中，这些配置可以从环境变量或配置文件中读取
func GetConfig() *Config {
	return &Config{
		// 服务器配置
		// 监听所有网络接口的8091端口
		Server: ServerConfig{
			Port: "8091",       // 默认端口号
			Host: "0.0.0.0",    // 监听所有网络接口
		},
		// 数据库配置
		// 使用SQLite作为数据存储
		Database: DatabaseConfig{
			DBPath: "./data/ecommerce.db", // 数据库文件保存在data目录下
		},
		// JWT认证配置
		// 用于生成和验证用户认证token
		JWT: JWTConfig{
			Secret:      "your-secret-key-change-in-production", // 密钥，生产环境务必修改
			ExpireHours: 24 * 7,                                  // Token有效期7天
		},
	}
}
