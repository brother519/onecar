package models

import "time"

// User 用户数据模型
type User struct {
	UserID    string    `json:"userId" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"` // 不返回给前端
	Email     string    `json:"email" gorm:"unique;not null"`
	Phone     string    `json:"phone"`
	Avatar    string    `json:"avatar"`
	Bio       string    `json:"bio"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
