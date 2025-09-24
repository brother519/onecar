package com.onecar.photoservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

import java.util.concurrent.Executor;

/**
 * 文件上传配置类
 * 配置文件上传相关的参数和组件
 */
@Configuration
@EnableAsync
public class FileUploadConfig {

    @Value("${app.file.max-file-size}")
    private long maxFileSize;

    @Value("${app.file.max-request-size}")
    private long maxRequestSize;

    /**
     * 配置文件上传解析器
     */
    @Bean
    public StandardServletMultipartResolver multipartResolver() {
        StandardServletMultipartResolver resolver = new StandardServletMultipartResolver();
        // Spring Boot 3.x 会自动配置，这里保留以便自定义
        return resolver;
    }

    /**
     * 异步任务执行器配置
     */
    @Bean(name = "fileProcessingExecutor")
    public Executor fileProcessingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("FileProcessing-");
        executor.setKeepAliveSeconds(60);
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    /**
     * 图片处理异步执行器
     */
    @Bean(name = "imageProcessingExecutor")
    public Executor imageProcessingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("ImageProcessing-");
        executor.setKeepAliveSeconds(60);
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}