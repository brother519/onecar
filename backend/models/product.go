package models

import "time"

// Product 商品数据模型
type Product struct {
	ProductID     string    `json:"productId" gorm:"primaryKey"`
	Name          string    `json:"name" gorm:"not null"`
	Description   string    `json:"description"`
	Price         float64   `json:"price" gorm:"not null"`
	OriginalPrice float64   `json:"originalPrice"`
	Stock         int       `json:"stock" gorm:"not null"`
	Images        string    `json:"images" gorm:"type:text"` // JSON array stored as string
	Category      string    `json:"category" gorm:"not null"`
	Brand         string    `json:"brand"`
	Tags          string    `json:"tags" gorm:"type:text"` // JSON array stored as string
	Rating        float64   `json:"rating"`
	SalesCount    int       `json:"salesCount"`
	Status        string    `json:"status" gorm:"not null"` // "active" or "inactive"
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}
