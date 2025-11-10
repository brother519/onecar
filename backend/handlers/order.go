package handlers

import (
	"ecommerce-backend/database"
	"ecommerce-backend/models"
	"ecommerce-backend/utils"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct{}

// CreateOrder 创建订单
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		Items         []models.OrderItem `json:"items" binding:"required"`
		AddressID     string             `json:"addressId" binding:"required"`
		PaymentMethod string             `json:"paymentMethod" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	// 验证地址
	var address models.Address
	if err := database.DB.Where("address_id = ? AND user_id = ?", req.AddressID, userID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    6000,
			"message": "地址不存在",
		})
		return
	}

	// 计算总金额并验证库存
	var totalAmount float64
	for i, item := range req.Items {
		var product models.Product
		if err := database.DB.Where("product_id = ?", item.ProductID).First(&product).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    2000,
				"message": "商品不存在: " + item.ProductID,
			})
			return
		}

		if product.Status != "active" {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    2001,
				"message": "商品已下架: " + product.Name,
			})
			return
		}

		if product.Stock < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    2002,
				"message": "库存不足: " + product.Name,
			})
			return
		}

		// 补充商品信息
		req.Items[i].ProductName = product.Name
		req.Items[i].Price = product.Price
		var images []string
		json.Unmarshal([]byte(product.Images), &images)
		if len(images) > 0 {
			req.Items[i].Image = images[0]
		}

		totalAmount += product.Price * float64(item.Quantity)
	}

	// 构建收货地址
	shippingAddress := models.ShippingAddress{
		ReceiverName:  address.ReceiverName,
		ReceiverPhone: address.ReceiverPhone,
		Province:      address.Province,
		City:          address.City,
		District:      address.District,
		DetailAddress: address.DetailAddress,
		PostalCode:    address.PostalCode,
	}

	// 创建订单
	order := models.Order{
		OrderID:         utils.GenerateID(),
		UserID:          userID,
		OrderNumber:     utils.GenerateOrderNumber(),
		Items:           utils.ToJSONString(req.Items),
		TotalAmount:     totalAmount,
		Status:          "待支付",
		ShippingAddress: utils.ToJSONString(shippingAddress),
		PaymentMethod:   req.PaymentMethod,
		PaymentStatus:   "未支付",
	}

	if err := database.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建订单失败",
		})
		return
	}

	// 锁定库存
	for _, item := range req.Items {
		database.DB.Model(&models.Product{}).
			Where("product_id = ?", item.ProductID).
			Update("stock", database.DB.Raw("stock - ?", item.Quantity))
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "创建成功",
		"data": gin.H{
			"orderId":     order.OrderID,
			"orderNumber": order.OrderNumber,
			"totalAmount": order.TotalAmount,
			"status":      order.Status,
		},
	})
}

// GetOrder 获取订单详情
func (h *OrderHandler) GetOrder(c *gin.Context) {
	userID := c.GetString("userID")
	orderID := c.Param("orderId")

	var order models.Order
	if err := database.DB.Where("order_id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    4000,
			"message": "订单不存在",
		})
		return
	}

	// 解析JSON字段
	var items []models.OrderItem
	var shippingAddress models.ShippingAddress
	json.Unmarshal([]byte(order.Items), &items)
	json.Unmarshal([]byte(order.ShippingAddress), &shippingAddress)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data": gin.H{
			"orderId":         order.OrderID,
			"orderNumber":     order.OrderNumber,
			"items":           items,
			"totalAmount":     order.TotalAmount,
			"status":          order.Status,
			"shippingAddress": shippingAddress,
			"paymentMethod":   order.PaymentMethod,
			"paymentStatus":   order.PaymentStatus,
			"createdAt":       order.CreatedAt,
			"paidAt":          order.PaidAt,
			"shippedAt":       order.ShippedAt,
			"completedAt":     order.CompletedAt,
		},
	})
}

// GetOrders 获取订单列表
func (h *OrderHandler) GetOrders(c *gin.Context) {
	userID := c.GetString("userID")
	status := c.Query("status")
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
	query := database.DB.Model(&models.Order{}).Where("user_id = ?", userID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 总数
	var total int64
	query.Count(&total)

	// 分页查询
	var orders []models.Order
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "查询订单失败",
		})
		return
	}

	// 解析订单数据
	var orderList []map[string]interface{}
	for _, order := range orders {
		var items []models.OrderItem
		var shippingAddress models.ShippingAddress
		json.Unmarshal([]byte(order.Items), &items)
		json.Unmarshal([]byte(order.ShippingAddress), &shippingAddress)

		orderList = append(orderList, map[string]interface{}{
			"orderId":         order.OrderID,
			"orderNumber":     order.OrderNumber,
			"items":           items,
			"totalAmount":     order.TotalAmount,
			"status":          order.Status,
			"shippingAddress": shippingAddress,
			"paymentMethod":   order.PaymentMethod,
			"paymentStatus":   order.PaymentStatus,
			"createdAt":       order.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data": gin.H{
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
			"orders":   orderList,
		},
	})
}
