package main

import (
	"ecommerce-backend/config"
	"ecommerce-backend/database"
	"ecommerce-backend/handlers"
	"ecommerce-backend/middleware"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.GetConfig()

	// 初始化数据库
	if err := database.InitDB(cfg.Database.DBPath); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}

	// 创建Gin引擎
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.CORSMiddleware())

	// 创建处理器
	authHandler := &handlers.AuthHandler{
		JWTSecret:      cfg.JWT.Secret,
		JWTExpireHours: cfg.JWT.ExpireHours,
	}
	productHandler := &handlers.ProductHandler{}
	cartHandler := &handlers.CartHandler{}
	addressHandler := &handlers.AddressHandler{}
	orderHandler := &handlers.OrderHandler{}
	paymentHandler := &handlers.PaymentHandler{}
	commentHandler := &handlers.CommentHandler{}

	// API路由
	api := r.Group("/api")

	// 认证相关路由（不需要认证）
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// 用户相关路由（需要认证）
	users := api.Group("/users")
	users.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	{
		users.GET("/profile", authHandler.GetProfile)
	}

	// 商品相关路由
	products := api.Group("/products")
	{
		products.GET("/search", productHandler.SearchProducts)
		products.GET("/:productId", productHandler.GetProduct)
		products.POST("", productHandler.CreateProduct) // 简化，实际应该需要管理员权限
		products.GET("/:productId/comments", commentHandler.GetComments)
	}

	// 购物车相关路由（需要认证）
	cart := api.Group("/cart")
	cart.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	{
		cart.GET("", cartHandler.GetCart)
		cart.POST("/items", cartHandler.AddToCart)
		cart.PUT("/items/:productId", cartHandler.UpdateCartItem)
		cart.DELETE("/items/:productId", cartHandler.DeleteCartItem)
	}

	// 地址相关路由（需要认证）
	addresses := api.Group("/addresses")
	addresses.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	{
		addresses.GET("", addressHandler.GetAddresses)
		addresses.POST("", addressHandler.AddAddress)
		addresses.PUT("/:addressId", addressHandler.UpdateAddress)
		addresses.DELETE("/:addressId", addressHandler.DeleteAddress)
	}

	// 订单相关路由（需要认证）
	orders := api.Group("/orders")
	orders.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	{
		orders.POST("", orderHandler.CreateOrder)
		orders.GET("", orderHandler.GetOrders)
		orders.GET("/:orderId", orderHandler.GetOrder)
	}

	// 支付相关路由（需要认证）
	payments := api.Group("/payments")
	payments.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	{
		payments.POST("/pay", paymentHandler.Pay)
		payments.POST("/callback", paymentHandler.PaymentCallback)
	}

	// 评论相关路由（需要认证）
	comments := api.Group("/comments")
	comments.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	{
		comments.POST("", commentHandler.CreateComment)
	}

	// 启动服务器
	addr := cfg.Server.Host + ":" + cfg.Server.Port
	log.Printf("服务器启动在: http://%s\n", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal("服务器启动失败:", err)
	}
}
