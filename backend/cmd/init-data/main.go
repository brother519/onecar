package main

import (
	"ecommerce-backend/config"
	"ecommerce-backend/database"
	"ecommerce-backend/models"
	"ecommerce-backend/utils"
	"log"
)

func main() {
	// 加载配置
	cfg := config.GetConfig()

	// 初始化数据库
	if err := database.InitDB(cfg.Database.DBPath); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}

	// 初始化示例商品
	products := []models.Product{
		{
			ProductID:     utils.GenerateID(),
			Name:          "iPhone 15 Pro Max",
			Description:   "最新款苹果旗舰手机，配备A17 Pro芯片，钛金属边框，强大的摄影系统",
			Price:         9999,
			OriginalPrice: 10999,
			Stock:         100,
			Images:        `["https://via.placeholder.com/400x400/87CEEB/FFFFFF?text=iPhone15Pro", "https://via.placeholder.com/400x400/FFB6C1/FFFFFF?text=iPhone15Pro"]`,
			Category:      "手机",
			Brand:         "Apple",
			Tags:          `["5G", "旗舰", "苹果"]`,
			Rating:        4.8,
			SalesCount:    356,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "华为Mate 60 Pro",
			Description:   "国产旗舰手机，搭载麒麟9000S芯片，卫星通信功能",
			Price:         6999,
			OriginalPrice: 7499,
			Stock:         80,
			Images:        `["https://via.placeholder.com/400x400/98FB98/FFFFFF?text=Mate60Pro"]`,
			Category:      "手机",
			Brand:         "华为",
			Tags:          `["5G", "国产", "旗舰"]`,
			Rating:        4.7,
			SalesCount:    289,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "MacBook Pro 14英寸",
			Description:   "配备M3芯片的专业笔记本电脑，Liquid Retina XDR显示屏",
			Price:         15999,
			OriginalPrice: 16999,
			Stock:         50,
			Images:        `["https://via.placeholder.com/400x400/DDA0DD/FFFFFF?text=MacBookPro"]`,
			Category:      "电脑",
			Brand:         "Apple",
			Tags:          `["笔记本", "专业", "高性能"]`,
			Rating:        4.9,
			SalesCount:    145,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "小米14 Ultra",
			Description:   "徕卡专业影像，骁龙8 Gen3，120W快充",
			Price:         5999,
			OriginalPrice: 6499,
			Stock:         120,
			Images:        `["https://via.placeholder.com/400x400/F0E68C/FFFFFF?text=Mi14Ultra"]`,
			Category:      "手机",
			Brand:         "小米",
			Tags:          `["5G", "拍照", "快充"]`,
			Rating:        4.6,
			SalesCount:    478,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "AirPods Pro 2代",
			Description:   "主动降噪无线耳机，自适应通透模式，空间音频",
			Price:         1899,
			OriginalPrice: 1999,
			Stock:         200,
			Images:        `["https://via.placeholder.com/400x400/FFE4B5/FFFFFF?text=AirPodsPro"]`,
			Category:      "耳机",
			Brand:         "Apple",
			Tags:          `["无线", "降噪", "苹果"]`,
			Rating:        4.7,
			SalesCount:    623,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "索尼WH-1000XM5",
			Description:   "行业领先的降噪耳机，30小时续航，多点连接",
			Price:         2499,
			OriginalPrice: 2799,
			Stock:         85,
			Images:        `["https://via.placeholder.com/400x400/B0C4DE/FFFFFF?text=SonyXM5"]`,
			Category:      "耳机",
			Brand:         "Sony",
			Tags:          `["降噪", "头戴式", "LDAC"]`,
			Rating:        4.8,
			SalesCount:    234,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "iPad Air 5",
			Description:   "搭载M1芯片的平板电脑，10.9英寸Liquid视网膜显示屏",
			Price:         4799,
			OriginalPrice: 4999,
			Stock:         75,
			Images:        `["https://via.placeholder.com/400x400/E0FFFF/000000?text=iPadAir5"]`,
			Category:      "平板",
			Brand:         "Apple",
			Tags:          `["平板", "M1", "苹果"]`,
			Rating:        4.6,
			SalesCount:    189,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "戴森V15 Detect吸尘器",
			Description:   "激光探测技术，智能显示屏，强大吸力",
			Price:         4990,
			OriginalPrice: 5490,
			Stock:         45,
			Images:        `["https://via.placeholder.com/400x400/F5DEB3/FFFFFF?text=DysonV15"]`,
			Category:      "家电",
			Brand:         "Dyson",
			Tags:          `["无线", "吸尘器", "智能"]`,
			Rating:        4.7,
			SalesCount:    167,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "Nintendo Switch OLED",
			Description:   "7英寸OLED屏幕游戏机，64GB存储",
			Price:         2599,
			OriginalPrice: 2799,
			Stock:         95,
			Images:        `["https://via.placeholder.com/400x400/FFB6C1/FFFFFF?text=SwitchOLED"]`,
			Category:      "游戏",
			Brand:         "Nintendo",
			Tags:          `["游戏机", "掌机", "OLED"]`,
			Rating:        4.8,
			SalesCount:    412,
			Status:        "active",
		},
		{
			ProductID:     utils.GenerateID(),
			Name:          "罗技MX Master 3S鼠标",
			Description:   "人体工学无线鼠标，8000 DPI，静音按键",
			Price:         799,
			OriginalPrice: 899,
			Stock:         150,
			Images:        `["https://via.placeholder.com/400x400/C0C0C0/FFFFFF?text=MXMaster3S"]`,
			Category:      "外设",
			Brand:         "Logitech",
			Tags:          `["无线", "鼠标", "办公"]`,
			Rating:        4.9,
			SalesCount:    567,
			Status:        "active",
		},
	}

	for _, product := range products {
		// 检查是否已存在
		var existingProduct models.Product
		if err := database.DB.Where("name = ?", product.Name).First(&existingProduct).Error; err != nil {
			// 不存在，创建新商品
			if err := database.DB.Create(&product).Error; err != nil {
				log.Printf("创建商品失败: %s - %v", product.Name, err)
			} else {
				log.Printf("商品已创建: %s", product.Name)
			}
		} else {
			log.Printf("商品已存在: %s", product.Name)
		}
	}

	log.Println("数据初始化完成")
}
