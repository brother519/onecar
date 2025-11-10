package models

import "time"

// Payment 支付数据模型
type Payment struct {
	PaymentID     string    `json:"paymentId" gorm:"primaryKey"`
	OrderID       string    `json:"orderId" gorm:"not null;index"`
	Amount        float64   `json:"amount" gorm:"not null"`
	PaymentMethod string    `json:"paymentMethod" gorm:"not null"`
	Status        string    `json:"status" gorm:"not null"` // pending, success, failed
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}
