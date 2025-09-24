package com.onecar.photoservice.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 缓存配置类
 * 配置系统缓存策略和缓存管理器
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * 缓存管理器配置
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // 设置缓存名称
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "fileMetadata",      // 文件元数据缓存
            "thumbnails",        // 缩略图缓存
            "permissions",       // 权限缓存
            "userStats",         // 用户统计缓存
            "compressionResults" // 压缩结果缓存
        ));
        
        // 允许空值缓存
        cacheManager.setAllowNullValues(false);
        
        return cacheManager;
    }
}