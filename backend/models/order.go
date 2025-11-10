package models

import "time"

// Order 订单数据模型
type Order struct {
	OrderID         string    `json:"orderId" gorm:"primaryKey"`
	UserID          string    `json:"userId" gorm:"not null;index"`
	OrderNumber     string    `json:"orderNumber" gorm:"unique;not null"`
	Items           string    `json:"items" gorm:"type:text"` // JSON array stored as string
	TotalAmount     float64   `json:"totalAmount" gorm:"not null"`
	Status          string    `json:"status" gorm:"not null"` // 待支付、已支付、已发货、已完成、已取消
	ShippingAddress string    `json:"shippingAddress" gorm:"type:text"` // JSON object stored as string
	PaymentMethod   string    `json:"paymentMethod" gorm:"not null"`
	PaymentStatus   string    `json:"paymentStatus" gorm:"not null"` // 未支付、支付中、支付成功、支付失败
	CreatedAt       time.Time `json:"createdAt"`
	PaidAt          *time.Time `json:"paidAt"`
	ShippedAt       *time.Time `json:"shippedAt"`
	CompletedAt     *time.Time `json:"completedAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// OrderItem 订单商品项
type OrderItem struct {
	ProductID   string  `json:"productId"`
	ProductName string  `json:"productName"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
	Image       string  `json:"image"`
}

// ShippingAddress 收货地址信息
type ShippingAddress struct {
	ReceiverName  string `json:"receiverName"`
	ReceiverPhone string `json:"receiverPhone"`
	Province      string `json:"province"`
	City          string `json:"city"`
	District      string `json:"district"`
	DetailAddress string `json:"detailAddress"`
	PostalCode    string `json:"postalCode"`
}
