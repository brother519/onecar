package com.onecar.photoservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * 安全配置类
 * 配置Web安全、CORS、安全头等
 * 适配Spring Security 6.x
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    /**
     * 安全过滤器链配置
     * 适配Spring Security 6.x API
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF（API服务通常不需要）
            .csrf(AbstractHttpConfigurer::disable)
            
            // 配置CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 配置授权规则
            .authorizeHttpRequests(authz -> authz
                // 公开访问的端点
                .requestMatchers(
                    "/api-docs/**",
                    "/swagger-ui/**", 
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/actuator/health",
                    "/actuator/info"
                ).permitAll()
                
                // H2控制台（仅开发环境）
                .requestMatchers("/h2-console/**")
                .access((authentication, context) -> {
                    if ("dev".equals(activeProfile) || "test".equals(activeProfile)) {
                        return new org.springframework.security.authorization.AuthorizationDecision(true);
                    } else {
                        return new org.springframework.security.authorization.AuthorizationDecision(false);
                    }
                })
                
                // API端点配置（根据环境调整）
                .requestMatchers("/api/**")
                .access((authentication, context) -> {
                    if ("prod".equals(activeProfile)) {
                        return new org.springframework.security.authorization.AuthorizationDecision(false);
                    } else {
                        return new org.springframework.security.authorization.AuthorizationDecision(true);
                    }
                })
                
                // 其他请求需要认证（生产环境）
                .anyRequest()
                .access((authentication, context) -> {
                    if ("prod".equals(activeProfile)) {
                        return new org.springframework.security.authorization.AuthorizationDecision(false);
                    } else {
                        return new org.springframework.security.authorization.AuthorizationDecision(true);
                    }
                })
            )
            
            // 配置安全头
            .headers(headers -> headers
                .frameOptions(frameOptions -> {
                    if ("dev".equals(activeProfile) || "test".equals(activeProfile)) {
                        frameOptions.sameOrigin();
                    } else {
                        frameOptions.deny();
                    }
                })
                .contentTypeOptions(contentTypeOptions -> {})
                .httpStrictTransportSecurity(hstsConfig -> hstsConfig
                    .maxAgeInSeconds(31536000)
                    .includeSubdomains(true)
                    .preload(true)
                )
                .referrerPolicy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
            );

        return http.build();
    }

    /**
     * CORS配置
     * 根据环境适配不同的安全策略
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 根据环境配置允许的源
        if ("prod".equals(activeProfile)) {
            // 生产环境：严格的CORS策略
            configuration.setAllowedOrigins(Arrays.asList(
                "https://onecar.com",
                "https://www.onecar.com",
                "https://app.onecar.com"
            ));
            configuration.setAllowCredentials(true);
        } else {
            // 开发/测试环境：宽松的CORS策略
            configuration.setAllowedOriginPatterns(List.of("*"));
            configuration.setAllowCredentials(true);
        }
        
        // 允许的HTTP方法
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // 允许的头
        configuration.setAllowedHeaders(Arrays.asList(
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Cache-Control",
            "Content-Range",
            "X-File-Name"
        ));
        
        // 暴露的响应头
        configuration.setExposedHeaders(Arrays.asList(
            "Content-Range",
            "X-Content-Range",
            "X-Total-Count"
        ));
        
        // 预检请求缓存时间（根据环境调整）
        configuration.setMaxAge("prod".equals(activeProfile) ? 1800L : 3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}