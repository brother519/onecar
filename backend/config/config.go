package config

// Config 应用配置
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port string
	Host string
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	DBPath string // SQLite数据库文件路径
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret     string
	ExpireHours int
}

// GetConfig 获取应用配置
func GetConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: "8091",
			Host: "0.0.0.0",
		},
		Database: DatabaseConfig{
			DBPath: "./data/ecommerce.db",
		},
		JWT: JWTConfig{
			Secret:     "your-secret-key-change-in-production",
			ExpireHours: 24 * 7, // 7天
		},
	}
}
