package com.onecar.photoservice.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

/**
 * 安全工具类
 * 提供文件类型检查、权限验证、安全防护等功能
 */
public class SecurityUtils {

    private static final Logger logger = LoggerFactory.getLogger(SecurityUtils.class);

    // 支持的图片MIME类型
    private static final Set<String> SUPPORTED_IMAGE_MIME_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/gif", 
        "image/webp", "image/bmp", "image/tiff", "image/svg+xml"
    );

    // 支持的图片文件扩展名
    private static final Set<String> SUPPORTED_IMAGE_EXTENSIONS = Set.of(
        "jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"
    );

    // 文件魔数映射（前几个字节标识文件类型）
    private static final Map<String, byte[]> FILE_MAGIC_NUMBERS = Map.of(
        "jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
        "png", new byte[]{(byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47},
        "gif", new byte[]{(byte) 0x47, (byte) 0x49, (byte) 0x46},
        "bmp", new byte[]{(byte) 0x42, (byte) 0x4D},
        "webp", new byte[]{(byte) 0x52, (byte) 0x49, (byte) 0x46, (byte) 0x46}
    );

    // 危险文件扩展名（可能包含恶意代码）
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
        "exe", "bat", "cmd", "com", "pif", "scr", "vbs", "js", "jar", 
        "php", "asp", "jsp", "sh", "ps1", "msi", "dmg"
    );

    // 危险MIME类型
    private static final Set<String> DANGEROUS_MIME_TYPES = Set.of(
        "application/x-executable", "application/x-msdownload", 
        "application/x-msdos-program", "text/html", "text/javascript", 
        "application/javascript", "text/x-php", "application/x-php"
    );

    /**
     * 检查文件扩展名是否被支持
     */
    public static boolean isSupportedImageExtension(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return false;
        }
        
        String extension = FileUtils.getFileExtension(fileName);
        if (extension == null) {
            return false;
        }
        
        return SUPPORTED_IMAGE_EXTENSIONS.contains(extension.toLowerCase());
    }

    /**
     * 检查MIME类型是否被支持
     */
    public static boolean isSupportedImageMimeType(String mimeType) {
        if (!StringUtils.hasText(mimeType)) {
            return false;
        }
        
        return SUPPORTED_IMAGE_MIME_TYPES.contains(mimeType.toLowerCase());
    }

    /**
     * 检查文件是否为图片（通过扩展名和MIME类型）
     */
    public static boolean isImageFile(String fileName, String mimeType) {
        return isSupportedImageExtension(fileName) && isSupportedImageMimeType(mimeType);
    }

    /**
     * 验证文件魔数（文件头）
     */
    public static boolean validateFileMagicNumber(InputStream inputStream, String expectedType) {
        try {
            byte[] magicBytes = FILE_MAGIC_NUMBERS.get(expectedType.toLowerCase());
            if (magicBytes == null) {
                logger.debug("未知文件类型的魔数验证: {}", expectedType);
                return true; // 对于未知类型，暂时通过验证
            }

            byte[] fileHeader = new byte[magicBytes.length];
            int bytesRead = inputStream.read(fileHeader);
            
            if (bytesRead < magicBytes.length) {
                logger.warn("文件头长度不足，无法验证魔数");
                return false;
            }

            for (int i = 0; i < magicBytes.length; i++) {
                if (fileHeader[i] != magicBytes[i]) {
                    logger.warn("文件魔数验证失败，预期类型: {}", expectedType);
                    return false;
                }
            }

            return true;
        } catch (IOException e) {
            logger.error("读取文件头进行魔数验证时发生错误", e);
            return false;
        }
    }

    /**
     * 检查文件是否为危险文件
     */
    public static boolean isDangerousFile(String fileName, String mimeType) {
        // 检查危险扩展名
        String extension = FileUtils.getFileExtension(fileName);
        if (extension != null && DANGEROUS_EXTENSIONS.contains(extension.toLowerCase())) {
            logger.warn("检测到危险文件扩展名: {}", extension);
            return true;
        }

        // 检查危险MIME类型
        if (StringUtils.hasText(mimeType) && DANGEROUS_MIME_TYPES.contains(mimeType.toLowerCase())) {
            logger.warn("检测到危险MIME类型: {}", mimeType);
            return true;
        }

        return false;
    }

    /**
     * 验证文件大小是否在允许范围内
     */
    public static boolean isValidFileSize(long fileSize, long maxAllowedSize) {
        if (fileSize <= 0) {
            logger.warn("文件大小无效: {}", fileSize);
            return false;
        }

        if (fileSize > maxAllowedSize) {
            logger.warn("文件大小超出限制: {} > {}", fileSize, maxAllowedSize);
            return false;
        }

        return true;
    }

    /**
     * 生成安全的文件名（移除潜在危险字符）
     */
    public static String generateSecureFileName(String originalFileName) {
        if (!StringUtils.hasText(originalFileName)) {
            return UUID.randomUUID().toString();
        }

        // 使用FileUtils的清理功能
        String sanitized = FileUtils.sanitizeFileName(originalFileName);
        
        // 额外的安全检查：如果是危险文件，强制使用UUID
        if (isDangerousFile(sanitized, null)) {
            String extension = FileUtils.getFileExtension(sanitized);
            String uuid = UUID.randomUUID().toString().replace("-", "");
            return extension != null ? uuid + "." + extension : uuid;
        }

        return sanitized;
    }

    /**
     * 检查用户权限（简单的用户ID验证）
     */
    public static boolean isValidUserId(String userId) {
        if (!StringUtils.hasText(userId)) {
            return false;
        }

        // 用户ID长度检查
        if (userId.length() > 50 || userId.length() < 1) {
            return false;
        }

        // 用户ID格式检查（只允许字母、数字、下划线、连字符）
        return userId.matches("^[a-zA-Z0-9_-]+$");
    }

    /**
     * 检查文件访问令牌的有效性（简单实现）
     */
    public static boolean isValidAccessToken(String token) {
        if (!StringUtils.hasText(token)) {
            return false;
        }

        // 简单的令牌格式检查
        return token.length() >= 16 && token.length() <= 512;
    }

    /**
     * 检查HTTP请求是否可能包含恶意内容
     */
    public static boolean isValidHttpHeader(String headerValue) {
        if (!StringUtils.hasText(headerValue)) {
            return true; // 空值被认为是安全的
        }

        // 检查是否包含换行符（HTTP头注入攻击）
        if (headerValue.contains("\n") || headerValue.contains("\r")) {
            logger.warn("检测到HTTP头注入尝试");
            return false;
        }

        // 检查长度限制
        if (headerValue.length() > 1000) {
            logger.warn("HTTP头值过长");
            return false;
        }

        return true;
    }

    /**
     * 过滤和清理用户输入
     */
    public static String sanitizeUserInput(String input) {
        if (!StringUtils.hasText(input)) {
            return "";
        }

        // 移除HTML标签和脚本
        String sanitized = input.replaceAll("<[^>]*>", "")
                               .replaceAll("javascript:", "")
                               .replaceAll("vbscript:", "")
                               .replaceAll("on\\w+\\s*=", "");

        // 限制长度
        if (sanitized.length() > 500) {
            sanitized = sanitized.substring(0, 500);
        }

        return sanitized.trim();
    }

    /**
     * 检查文件路径是否安全（防止路径遍历攻击）
     */
    public static boolean isSecureFilePath(String filePath) {
        if (!StringUtils.hasText(filePath)) {
            return false;
        }

        // 检查路径遍历攻击模式
        String[] dangerousPatterns = {"../", "..\\", "%2e%2e", "%2E%2E", "~/"};
        String lowerPath = filePath.toLowerCase();
        
        for (String pattern : dangerousPatterns) {
            if (lowerPath.contains(pattern)) {
                logger.warn("检测到路径遍历攻击尝试: {}", filePath);
                return false;
            }
        }

        // 检查绝对路径（在某些情况下可能不安全）
        if (filePath.startsWith("/") || filePath.matches("^[a-zA-Z]:.*")) {
            logger.warn("检测到绝对路径: {}", filePath);
            return false;
        }

        return true;
    }

    /**
     * 生成防盗链验证码
     */
    public static String generateAntiHotlinkToken(String fileId, String userAgent, long timestamp) {
        String data = fileId + "|" + (userAgent != null ? userAgent : "") + "|" + timestamp;
        return Base64.getEncoder().encodeToString(data.getBytes()).substring(0, 16);
    }

    /**
     * 验证防盗链令牌
     */
    public static boolean validateAntiHotlinkToken(String token, String fileId, String userAgent, long timestamp, long maxAge) {
        try {
            String expectedToken = generateAntiHotlinkToken(fileId, userAgent, timestamp);
            boolean tokenValid = expectedToken.equals(token);
            boolean timeValid = (System.currentTimeMillis() - timestamp) <= maxAge;
            
            return tokenValid && timeValid;
        } catch (Exception e) {
            logger.error("验证防盗链令牌时发生错误", e);
            return false;
        }
    }

    /**
     * 检查IP地址是否在白名单中（简单实现）
     */
    public static boolean isAllowedIP(String clientIP, Set<String> allowedIPs) {
        if (!StringUtils.hasText(clientIP)) {
            return false;
        }

        if (allowedIPs == null || allowedIPs.isEmpty()) {
            return true; // 如果没有配置白名单，则允许所有IP
        }

        return allowedIPs.contains(clientIP);
    }

    /**
     * 检查请求频率是否超限（简单的内存实现）
     */
    private static final Map<String, List<Long>> REQUEST_TIMESTAMPS = new HashMap<>();
    private static final Object LOCK = new Object();

    public static boolean isRateLimited(String clientIdentifier, int maxRequests, long timeWindowMs) {
        synchronized (LOCK) {
            long currentTime = System.currentTimeMillis();
            List<Long> timestamps = REQUEST_TIMESTAMPS.computeIfAbsent(clientIdentifier, k -> new ArrayList<>());

            // 清理过期的时间戳
            timestamps.removeIf(timestamp -> currentTime - timestamp > timeWindowMs);

            // 检查是否超限
            if (timestamps.size() >= maxRequests) {
                logger.warn("客户端 {} 请求频率超限", clientIdentifier);
                return true;
            }

            // 记录当前请求时间
            timestamps.add(currentTime);
            return false;
        }
    }

    /**
     * 清理速率限制缓存（定时任务调用）
     */
    public static void cleanupRateLimitCache() {
        synchronized (LOCK) {
            long currentTime = System.currentTimeMillis();
            REQUEST_TIMESTAMPS.entrySet().removeIf(entry -> {
                List<Long> timestamps = entry.getValue();
                timestamps.removeIf(timestamp -> currentTime - timestamp > 3600000); // 1小时
                return timestamps.isEmpty();
            });
        }
    }

    /**
     * 验证文件名是否包含恶意内容
     */
    public static boolean containsMaliciousContent(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return false;
        }

        String lowerFileName = fileName.toLowerCase();
        
        // 检查脚本标签
        String[] scriptPatterns = {"<script", "javascript:", "vbscript:", "onload=", "onerror="};
        for (String pattern : scriptPatterns) {
            if (lowerFileName.contains(pattern)) {
                logger.warn("文件名包含恶意脚本内容: {}", fileName);
                return true;
            }
        }

        return false;
    }

    /**
     * 获取支持的图片扩展名列表
     */
    public static Set<String> getSupportedImageExtensions() {
        return new HashSet<>(SUPPORTED_IMAGE_EXTENSIONS);
    }

    /**
     * 获取支持的图片MIME类型列表
     */
    public static Set<String> getSupportedImageMimeTypes() {
        return new HashSet<>(SUPPORTED_IMAGE_MIME_TYPES);
    }
}