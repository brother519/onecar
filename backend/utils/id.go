package utils

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// GenerateID 生成唯一ID
func GenerateID() string {
	return uuid.New().String()
}

// GenerateOrderNumber 生成订单号
func GenerateOrderNumber() string {
	return fmt.Sprintf("ORD%s", time.Now().Format("20060102150405"))
}
