package models

import "time"

// Comment 评论数据模型
type Comment struct {
	CommentID string    `json:"commentId" gorm:"primaryKey"`
	ProductID string    `json:"productId" gorm:"not null;index"`
	UserID    string    `json:"userId" gorm:"not null;index"`
	OrderID   string    `json:"orderId" gorm:"not null"`
	Rating    int       `json:"rating" gorm:"not null"` // 1-5
	Content   string    `json:"content" gorm:"not null"`
	Images    string    `json:"images" gorm:"type:text"` // JSON array stored as string
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CommentWithUser 评论及用户信息
type CommentWithUser struct {
	CommentID string    `json:"commentId"`
	ProductID string    `json:"productId"`
	UserID    string    `json:"userId"`
	Username  string    `json:"username"`
	Avatar    string    `json:"avatar"`
	OrderID   string    `json:"orderId"`
	Rating    int       `json:"rating"`
	Content   string    `json:"content"`
	Images    []string  `json:"images"`
	CreatedAt time.Time `json:"createdAt"`
}
