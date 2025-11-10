package handlers

import (
	"ecommerce-backend/database"
	"ecommerce-backend/models"
	"ecommerce-backend/utils"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CartHandler struct{}

// GetCart 获取购物车
func (h *CartHandler) GetCart(c *gin.Context) {
	userID := c.GetString("userID")

	var cart models.Cart
	if err := database.DB.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		// 如果购物车不存在，创建一个新的
		cart = models.Cart{
			CartID: utils.GenerateID(),
			UserID: userID,
			Items:  "[]",
		}
		database.DB.Create(&cart)
	}

	// 解析购物车项
	var items []models.CartItem
	json.Unmarshal([]byte(cart.Items), &items)

	// 计算总金额
	var totalAmount float64
	for _, item := range items {
		if item.Selected {
			totalAmount += item.Price * float64(item.Quantity)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data": gin.H{
			"cartId":      cart.CartID,
			"items":       items,
			"totalAmount": totalAmount,
		},
	})
}

// AddToCart 添加商品到购物车
func (h *CartHandler) AddToCart(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		ProductID string `json:"productId" binding:"required"`
		Quantity  int    `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	// 验证商品
	var product models.Product
	if err := database.DB.Where("product_id = ?", req.ProductID).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    2000,
			"message": "商品不存在",
		})
		return
	}

	if product.Status != "active" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    2001,
			"message": "商品已下架",
		})
		return
	}

	if product.Stock < req.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    2002,
			"message": "库存不足",
		})
		return
	}

	// 获取或创建购物车
	var cart models.Cart
	if err := database.DB.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		cart = models.Cart{
			CartID: utils.GenerateID(),
			UserID: userID,
			Items:  "[]",
		}
		database.DB.Create(&cart)
	}

	// 解析购物车项
	var items []models.CartItem
	json.Unmarshal([]byte(cart.Items), &items)

	// 检查商品是否已在购物车中
	found := false
	for i, item := range items {
		if item.ProductID == req.ProductID {
			items[i].Quantity += req.Quantity
			if items[i].Quantity > product.Stock {
				c.JSON(http.StatusBadRequest, gin.H{
					"code":    2002,
					"message": "库存不足",
				})
				return
			}
			found = true
			break
		}
	}

	// 如果不存在，添加新项
	if !found {
		items = append(items, models.CartItem{
			ProductID: req.ProductID,
			Quantity:  req.Quantity,
			Price:     product.Price,
			Selected:  true,
			AddedAt:   time.Now(),
		})
	}

	// 保存购物车
	cart.Items = utils.ToJSONString(items)
	database.DB.Save(&cart)

	// 计算总金额
	var totalAmount float64
	for _, item := range items {
		if item.Selected {
			totalAmount += item.Price * float64(item.Quantity)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "添加成功",
		"data": gin.H{
			"cartId":      cart.CartID,
			"items":       items,
			"totalAmount": totalAmount,
		},
	})
}

// UpdateCartItem 更新购物车项
func (h *CartHandler) UpdateCartItem(c *gin.Context) {
	userID := c.GetString("userID")
	productID := c.Param("productId")

	var req struct {
		Quantity int  `json:"quantity" binding:"required,min=0"`
		Selected *bool `json:"selected"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	// 获取购物车
	var cart models.Cart
	if err := database.DB.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    3000,
			"message": "购物车为空",
		})
		return
	}

	// 解析购物车项
	var items []models.CartItem
	json.Unmarshal([]byte(cart.Items), &items)

	// 查找并更新商品
	found := false
	for i, item := range items {
		if item.ProductID == productID {
			if req.Quantity == 0 {
				// 删除商品
				items = append(items[:i], items[i+1:]...)
			} else {
				items[i].Quantity = req.Quantity
				if req.Selected != nil {
					items[i].Selected = *req.Selected
				}
			}
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "商品不在购物车中",
		})
		return
	}

	// 保存购物车
	cart.Items = utils.ToJSONString(items)
	database.DB.Save(&cart)

	// 计算总金额
	var totalAmount float64
	for _, item := range items {
		if item.Selected {
			totalAmount += item.Price * float64(item.Quantity)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "更新成功",
		"data": gin.H{
			"cartId":      cart.CartID,
			"items":       items,
			"totalAmount": totalAmount,
		},
	})
}

// DeleteCartItem 删除购物车项
func (h *CartHandler) DeleteCartItem(c *gin.Context) {
	userID := c.GetString("userID")
	productID := c.Param("productId")

	// 获取购物车
	var cart models.Cart
	if err := database.DB.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    3000,
			"message": "购物车为空",
		})
		return
	}

	// 解析购物车项
	var items []models.CartItem
	json.Unmarshal([]byte(cart.Items), &items)

	// 删除商品
	found := false
	for i, item := range items {
		if item.ProductID == productID {
			items = append(items[:i], items[i+1:]...)
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "商品不在购物车中",
		})
		return
	}

	// 保存购物车
	cart.Items = utils.ToJSONString(items)
	database.DB.Save(&cart)

	// 计算总金额
	var totalAmount float64
	for _, item := range items {
		if item.Selected {
			totalAmount += item.Price * float64(item.Quantity)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "删除成功",
		"data": gin.H{
			"cartId":      cart.CartID,
			"items":       items,
			"totalAmount": totalAmount,
		},
	})
}
