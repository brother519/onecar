package handlers

import (
	"ecommerce-backend/database"
	"ecommerce-backend/models"
	"ecommerce-backend/utils"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type CommentHandler struct{}

// GetComments 获取商品评论列表
func (h *CommentHandler) GetComments(c *gin.Context) {
	productID := c.Param("productId")
	sortBy := c.DefaultQuery("sortBy", "createdAt")
	filter := c.Query("filter")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "10")

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// 构建查询
	query := database.DB.Table("comments").
		Select("comments.*, users.username, users.avatar").
		Joins("LEFT JOIN users ON comments.user_id = users.user_id").
		Where("comments.product_id = ?", productID)

	// 筛选条件
	switch filter {
	case "withImages":
		query = query.Where("comments.images != '[]' AND comments.images != ''")
	case "good":
		query = query.Where("comments.rating >= ?", 4)
	case "medium":
		query = query.Where("comments.rating = ?", 3)
	case "bad":
		query = query.Where("comments.rating <= ?", 2)
	}

	// 总数
	var total int64
	query.Count(&total)

	// 排序
	switch sortBy {
	case "rating_desc":
		query = query.Order("comments.rating DESC")
	case "rating_asc":
		query = query.Order("comments.rating ASC")
	case "latest":
		query = query.Order("comments.created_at DESC")
	default:
		query = query.Order("comments.created_at DESC")
	}

	// 分页
	offset := (page - 1) * pageSize
	var results []struct {
		models.Comment
		Username string `json:"username"`
		Avatar   string `json:"avatar"`
	}

	if err := query.Offset(offset).Limit(pageSize).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "查询评论失败",
		})
		return
	}

	// 格式化返回数据
	var comments []models.CommentWithUser
	for _, r := range results {
		var images []string
		json.Unmarshal([]byte(r.Images), &images)

		comments = append(comments, models.CommentWithUser{
			CommentID: r.CommentID,
			ProductID: r.ProductID,
			UserID:    r.UserID,
			Username:  r.Username,
			Avatar:    r.Avatar,
			OrderID:   r.OrderID,
			Rating:    r.Rating,
			Content:   r.Content,
			Images:    images,
			CreatedAt: r.CreatedAt,
		})
	}

	// 计算评分分布
	var ratingStats struct {
		Avg   float64
		Total int64
		Five  int64
		Four  int64
		Three int64
		Two   int64
		One   int64
	}
	database.DB.Model(&models.Comment{}).Where("product_id = ?", productID).Count(&ratingStats.Total)
	database.DB.Model(&models.Comment{}).Where("product_id = ?", productID).Select("AVG(rating)").Scan(&ratingStats.Avg)
	database.DB.Model(&models.Comment{}).Where("product_id = ? AND rating = ?", productID, 5).Count(&ratingStats.Five)
	database.DB.Model(&models.Comment{}).Where("product_id = ? AND rating = ?", productID, 4).Count(&ratingStats.Four)
	database.DB.Model(&models.Comment{}).Where("product_id = ? AND rating = ?", productID, 3).Count(&ratingStats.Three)
	database.DB.Model(&models.Comment{}).Where("product_id = ? AND rating = ?", productID, 2).Count(&ratingStats.Two)
	database.DB.Model(&models.Comment{}).Where("product_id = ? AND rating = ?", productID, 1).Count(&ratingStats.One)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data": gin.H{
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
			"comments": comments,
			"stats": gin.H{
				"avg":   ratingStats.Avg,
				"total": ratingStats.Total,
				"five":  ratingStats.Five,
				"four":  ratingStats.Four,
				"three": ratingStats.Three,
				"two":   ratingStats.Two,
				"one":   ratingStats.One,
			},
		},
	})
}

// CreateComment 发表评论
func (h *CommentHandler) CreateComment(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		ProductID string   `json:"productId" binding:"required"`
		OrderID   string   `json:"orderId" binding:"required"`
		Rating    int      `json:"rating" binding:"required,min=1,max=5"`
		Content   string   `json:"content" binding:"required,min=10,max=500"`
		Images    []string `json:"images"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误: " + err.Error(),
		})
		return
	}

	// 验证图片数量
	if len(req.Images) > 5 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "最多上传5张图片",
		})
		return
	}

	// 验证订单
	var order models.Order
	if err := database.DB.Where("order_id = ? AND user_id = ?", req.OrderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    4000,
			"message": "订单不存在",
		})
		return
	}

	// 验证订单状态
	if order.Status != "已完成" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    4001,
			"message": "只能评论已完成的订单",
		})
		return
	}

	// 验证商品是否在订单中
	var orderItems []models.OrderItem
	json.Unmarshal([]byte(order.Items), &orderItems)
	found := false
	for _, item := range orderItems {
		if item.ProductID == req.ProductID {
			found = true
			break
		}
	}
	if !found {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "该商品不在订单中",
		})
		return
	}

	// 检查是否已评论
	var existingComment models.Comment
	if err := database.DB.Where("product_id = ? AND user_id = ? AND order_id = ?", req.ProductID, userID, req.OrderID).First(&existingComment).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    7000,
			"message": "该商品已评论",
		})
		return
	}

	// 敏感词过滤（简化实现）
	sensitiveWords := []string{"垃圾", "骗子", "假货"}
	for _, word := range sensitiveWords {
		if strings.Contains(req.Content, word) {
			req.Content = strings.ReplaceAll(req.Content, word, "**")
		}
	}

	// 创建评论
	comment := models.Comment{
		CommentID: utils.GenerateID(),
		ProductID: req.ProductID,
		UserID:    userID,
		OrderID:   req.OrderID,
		Rating:    req.Rating,
		Content:   req.Content,
		Images:    utils.ToJSONString(req.Images),
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建评论失败",
		})
		return
	}

	// 更新商品评分
	var avgRating float64
	database.DB.Model(&models.Comment{}).
		Where("product_id = ?", req.ProductID).
		Select("AVG(rating)").
		Scan(&avgRating)

	database.DB.Model(&models.Product{}).
		Where("product_id = ?", req.ProductID).
		Update("rating", avgRating)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "评论成功",
		"data": gin.H{
			"commentId": comment.CommentID,
		},
	})
}
