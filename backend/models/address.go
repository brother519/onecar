package models

import "time"

// Address 地址数据模型
type Address struct {
	AddressID     string    `json:"addressId" gorm:"primaryKey"`
	UserID        string    `json:"userId" gorm:"not null;index"`
	ReceiverName  string    `json:"receiverName" gorm:"not null"`
	ReceiverPhone string    `json:"receiverPhone" gorm:"not null"`
	Province      string    `json:"province" gorm:"not null"`
	City          string    `json:"city" gorm:"not null"`
	District      string    `json:"district" gorm:"not null"`
	DetailAddress string    `json:"detailAddress" gorm:"not null"`
	PostalCode    string    `json:"postalCode"`
	IsDefault     bool      `json:"isDefault" gorm:"default:false"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}
