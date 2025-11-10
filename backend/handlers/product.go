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

type ProductHandler struct{}

// SearchProducts 商品搜索
func (h *ProductHandler) SearchProducts(c *gin.Context) {
	keyword := c.Query("keyword")
	category := c.Query("category")
	brand := c.Query("brand")
	minPriceStr := c.Query("minPrice")
	maxPriceStr := c.Query("maxPrice")
	minRatingStr := c.Query("minRating")
	sortBy := c.DefaultQuery("sortBy", "createdAt")
	sortOrder := c.DefaultQuery("sortOrder", "desc")
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "20")

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// 构建查询
	query := database.DB.Model(&models.Product{}).Where("status = ?", "active")

	// 关键词搜索
	if keyword != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	// 分类筛选
	if category != "" {
		query = query.Where("category = ?", category)
	}

	// 品牌筛选
	if brand != "" {
		query = query.Where("brand = ?", brand)
	}

	// 价格区间
	if minPriceStr != "" {
		if minPrice, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			query = query.Where("price >= ?", minPrice)
		}
	}
	if maxPriceStr != "" {
		if maxPrice, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			query = query.Where("price <= ?", maxPrice)
		}
	}

	// 评分筛选
	if minRatingStr != "" {
		if minRating, err := strconv.ParseFloat(minRatingStr, 64); err == nil {
			query = query.Where("rating >= ?", minRating)
		}
	}

	// 总数
	var total int64
	query.Count(&total)

	// 排序
	// 将camelCase转换为snake_case
	orderField := sortBy
	switch sortBy {
	case "createdAt":
		orderField = "created_at"
	case "salesCount":
		orderField = "sales_count"
	case "originalPrice":
		orderField = "original_price"
	}
	orderClause := orderField + " " + strings.ToUpper(sortOrder)
	query = query.Order(orderClause)

	// 分页
	offset := (page - 1) * pageSize
	var products []models.Product
	if err := query.Offset(offset).Limit(pageSize).Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "查询商品失败",
		})
		return
	}

	// 解析JSON字段
	var productList []map[string]interface{}
	for _, p := range products {
		var images []string
		var tags []string
		json.Unmarshal([]byte(p.Images), &images)
		json.Unmarshal([]byte(p.Tags), &tags)

		productList = append(productList, map[string]interface{}{
			"productId":     p.ProductID,
			"name":          p.Name,
			"description":   p.Description,
			"price":         p.Price,
			"originalPrice": p.OriginalPrice,
			"stock":         p.Stock,
			"images":        images,
			"category":      p.Category,
			"brand":         p.Brand,
			"tags":          tags,
			"rating":        p.Rating,
			"salesCount":    p.SalesCount,
			"status":        p.Status,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "查询成功",
		"data": gin.H{
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
			"products": productList,
		},
	})
}

// GetProduct 获取商品详情
func (h *ProductHandler) GetProduct(c *gin.Context) {
	productID := c.Param("productId")

	var product models.Product
	if err := database.DB.Where("product_id = ?", productID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    2000,
			"message": "商品不存在",
		})
		return
	}

	// 解析JSON字段
	var images []string
	var tags []string
	json.Unmarshal([]byte(product.Images), &images)
	json.Unmarshal([]byte(product.Tags), &tags)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data": map[string]interface{}{
			"productId":     product.ProductID,
			"name":          product.Name,
			"description":   product.Description,
			"price":         product.Price,
			"originalPrice": product.OriginalPrice,
			"stock":         product.Stock,
			"images":        images,
			"category":      product.Category,
			"brand":         product.Brand,
			"tags":          tags,
			"rating":        product.Rating,
			"salesCount":    product.SalesCount,
			"status":        product.Status,
			"createdAt":     product.CreatedAt,
		},
	})
}

// CreateProduct 创建商品（管理员功能，这里简化实现）
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req struct {
		Name          string   `json:"name" binding:"required"`
		Description   string   `json:"description"`
		Price         float64  `json:"price" binding:"required"`
		OriginalPrice float64  `json:"originalPrice"`
		Stock         int      `json:"stock" binding:"required"`
		Images        []string `json:"images"`
		Category      string   `json:"category" binding:"required"`
		Brand         string   `json:"brand"`
		Tags          []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	product := models.Product{
		ProductID:     utils.GenerateID(),
		Name:          req.Name,
		Description:   req.Description,
		Price:         req.Price,
		OriginalPrice: req.OriginalPrice,
		Stock:         req.Stock,
		Images:        utils.ToJSONString(req.Images),
		Category:      req.Category,
		Brand:         req.Brand,
		Tags:          utils.ToJSONString(req.Tags),
		Rating:        0,
		SalesCount:    0,
		Status:        "active",
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建商品失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "创建成功",
		"data": gin.H{
			"productId": product.ProductID,
		},
	})
}
