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

type PaymentHandler struct{}

// Pay 发起支付
func (h *PaymentHandler) Pay(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		OrderID       string `json:"orderId" binding:"required"`
		PaymentMethod string `json:"paymentMethod" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
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

	if order.PaymentStatus == "支付成功" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    4001,
			"message": "订单已支付",
		})
		return
	}

	// 创建支付记录
	payment := models.Payment{
		PaymentID:     utils.GenerateID(),
		OrderID:       req.OrderID,
		Amount:        order.TotalAmount,
		PaymentMethod: req.PaymentMethod,
		Status:        "pending",
	}

	if err := database.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建支付记录失败",
		})
		return
	}

	// 更新订单支付状态
	order.PaymentStatus = "支付中"
	database.DB.Save(&order)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "支付发起成功",
		"data": gin.H{
			"paymentId": payment.PaymentID,
			"orderId":   payment.OrderID,
			"amount":    payment.Amount,
			"status":    payment.Status,
		},
	})
}

// PaymentCallback 模拟支付回调
func (h *PaymentHandler) PaymentCallback(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		PaymentID string `json:"paymentId" binding:"required"`
		Status    string `json:"status" binding:"required"` // success or failed
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	// 获取支付记录
	var payment models.Payment
	if err := database.DB.Where("payment_id = ?", req.PaymentID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "支付记录不存在",
		})
		return
	}

	// 获取订单
	var order models.Order
	if err := database.DB.Where("order_id = ?", payment.OrderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    4000,
			"message": "订单不存在",
		})
		return
	}

	// 验证订单所有者
	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"code":    403,
			"message": "无权限操作此订单",
		})
		return
	}

	now := time.Now()

	if req.Status == "success" {
		// 支付成功
		payment.Status = "success"
		order.PaymentStatus = "支付成功"
		order.Status = "已支付"
		order.PaidAt = &now

		// 清空购物车中的已购商品
		var cart models.Cart
		if err := database.DB.Where("user_id = ?", userID).First(&cart).Error; err == nil {
			var cartItems []models.CartItem
			json.Unmarshal([]byte(cart.Items), &cartItems)

			// 获取订单商品ID列表
			var orderItems []models.OrderItem
			json.Unmarshal([]byte(order.Items), &orderItems)
			orderProductIDs := make(map[string]bool)
			for _, item := range orderItems {
				orderProductIDs[item.ProductID] = true
			}

			// 过滤购物车商品
			var remainingItems []models.CartItem
			for _, item := range cartItems {
				if !orderProductIDs[item.ProductID] {
					remainingItems = append(remainingItems, item)
				}
			}

			cart.Items = utils.ToJSONString(remainingItems)
			database.DB.Save(&cart)
		}

		// 更新商品销量
		var orderItems []models.OrderItem
		json.Unmarshal([]byte(order.Items), &orderItems)
		for _, item := range orderItems {
			database.DB.Model(&models.Product{}).
				Where("product_id = ?", item.ProductID).
				Update("sales_count", database.DB.Raw("sales_count + ?", item.Quantity))
		}

	} else {
		// 支付失败
		payment.Status = "failed"
		order.PaymentStatus = "支付失败"

		// 恢复库存
		var orderItems []models.OrderItem
		json.Unmarshal([]byte(order.Items), &orderItems)
		for _, item := range orderItems {
			database.DB.Model(&models.Product{}).
				Where("product_id = ?", item.ProductID).
				Update("stock", database.DB.Raw("stock + ?", item.Quantity))
		}
	}

	database.DB.Save(&payment)
	database.DB.Save(&order)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "支付处理完成",
		"data": gin.H{
			"paymentId":     payment.PaymentID,
			"orderId":       order.OrderID,
			"paymentStatus": order.PaymentStatus,
			"orderStatus":   order.Status,
		},
	})
}
