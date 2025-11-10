package handlers

import (
	"ecommerce-backend/database"
	"ecommerce-backend/models"
	"ecommerce-backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AddressHandler struct{}

// GetAddresses 获取地址列表
func (h *AddressHandler) GetAddresses(c *gin.Context) {
	userID := c.GetString("userID")

	var addresses []models.Address
	if err := database.DB.Where("user_id = ?", userID).Order("is_default DESC, created_at DESC").Find(&addresses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "查询地址失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data":    addresses,
	})
}

// AddAddress 添加地址
func (h *AddressHandler) AddAddress(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		ReceiverName  string `json:"receiverName" binding:"required"`
		ReceiverPhone string `json:"receiverPhone" binding:"required"`
		Province      string `json:"province" binding:"required"`
		City          string `json:"city" binding:"required"`
		District      string `json:"district" binding:"required"`
		DetailAddress string `json:"detailAddress" binding:"required"`
		PostalCode    string `json:"postalCode"`
		IsDefault     bool   `json:"isDefault"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	// 如果设置为默认地址，先取消其他默认地址
	if req.IsDefault {
		database.DB.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	address := models.Address{
		AddressID:     utils.GenerateID(),
		UserID:        userID,
		ReceiverName:  req.ReceiverName,
		ReceiverPhone: req.ReceiverPhone,
		Province:      req.Province,
		City:          req.City,
		District:      req.District,
		DetailAddress: req.DetailAddress,
		PostalCode:    req.PostalCode,
		IsDefault:     req.IsDefault,
	}

	if err := database.DB.Create(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建地址失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "添加成功",
		"data":    address,
	})
}

// UpdateAddress 更新地址
func (h *AddressHandler) UpdateAddress(c *gin.Context) {
	userID := c.GetString("userID")
	addressID := c.Param("addressId")

	var req struct {
		ReceiverName  string `json:"receiverName" binding:"required"`
		ReceiverPhone string `json:"receiverPhone" binding:"required"`
		Province      string `json:"province" binding:"required"`
		City          string `json:"city" binding:"required"`
		District      string `json:"district" binding:"required"`
		DetailAddress string `json:"detailAddress" binding:"required"`
		PostalCode    string `json:"postalCode"`
		IsDefault     bool   `json:"isDefault"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	// 验证地址是否存在且属于当前用户
	var address models.Address
	if err := database.DB.Where("address_id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    6000,
			"message": "地址不存在",
		})
		return
	}

	// 如果设置为默认地址，先取消其他默认地址
	if req.IsDefault {
		database.DB.Model(&models.Address{}).Where("user_id = ? AND address_id != ?", userID, addressID).Update("is_default", false)
	}

	// 更新地址
	address.ReceiverName = req.ReceiverName
	address.ReceiverPhone = req.ReceiverPhone
	address.Province = req.Province
	address.City = req.City
	address.District = req.District
	address.DetailAddress = req.DetailAddress
	address.PostalCode = req.PostalCode
	address.IsDefault = req.IsDefault

	if err := database.DB.Save(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新地址失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "更新成功",
		"data":    address,
	})
}

// DeleteAddress 删除地址
func (h *AddressHandler) DeleteAddress(c *gin.Context) {
	userID := c.GetString("userID")
	addressID := c.Param("addressId")

	// 验证地址是否存在且属于当前用户
	var address models.Address
	if err := database.DB.Where("address_id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    6000,
			"message": "地址不存在",
		})
		return
	}

	// 检查是否是最后一个地址
	var count int64
	database.DB.Model(&models.Address{}).Where("user_id = ?", userID).Count(&count)
	if count == 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "至少需要保留一个地址",
		})
		return
	}

	// 删除地址
	if err := database.DB.Delete(&address).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除地址失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "删除成功",
	})
}
