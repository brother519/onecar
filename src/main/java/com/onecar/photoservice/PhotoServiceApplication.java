package com.onecar.photoservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 照片上传下载系统启动类
 * 
 * 系统功能特性：
 * - 高性能文件上传下载
 * - 图片自动压缩和缩略图生成
 * - 安全的文件类型检查和权限控制
 * - 支持断点续传和批量操作
 * - 完善的异常处理和日志记录
 * - 多级缓存和性能优化
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
public class PhotoServiceApplication {

    public static void main(String[] args) {
        // 设置系统属性
        System.setProperty("java.awt.headless", "true"); // 支持无头模式的图片处理
        
        SpringApplication.run(PhotoServiceApplication.class, args);
    }
}