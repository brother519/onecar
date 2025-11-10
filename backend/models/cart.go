package models

import "time"

// Cart 购物车数据模型
type Cart struct {
	CartID    string    `json:"cartId" gorm:"primaryKey"`
	UserID    string    `json:"userId" gorm:"not null;index"`
	Items     string    `json:"items" gorm:"type:text"` // JSON array stored as string
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CartItem 购物车项
type CartItem struct {
	ProductID string    `json:"productId"`
	Quantity  int       `json:"quantity"`
	Price     float64   `json:"price"`
	Selected  bool      `json:"selected"`
	AddedAt   time.Time `json:"addedAt"`
}

// CartResponse 购物车响应（包含计算后的总金额）
type CartResponse struct {
	CartID      string     `json:"cartId"`
	Items       []CartItem `json:"items"`
	TotalAmount float64    `json:"totalAmount"`
}
