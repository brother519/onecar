package middleware

import (
	"ecommerce-backend/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware JWT认证中间件
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    1001,
				"message": "未提供认证令牌",
			})
			c.Abort()
			return
		}

		// Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    1001,
				"message": "令牌格式错误",
			})
			c.Abort()
			return
		}

		token := parts[1]
		userID, err := utils.ValidateToken(token, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    1001,
				"message": "令牌无效或已过期",
			})
			c.Abort()
			return
		}

		// 将用户ID存储到上下文中
		c.Set("userID", userID)
		c.Next()
	}
}
