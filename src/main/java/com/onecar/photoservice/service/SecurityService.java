package com.onecar.photoservice.service;

import com.onecar.photoservice.entity.FilePermission;
import com.onecar.photoservice.repository.FilePermissionRepository;
import com.onecar.photoservice.util.SecurityUtils;
import com.onecar.photoservice.exception.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * 安全验证服务类
 * 提供文件安全检查、权限验证、访问控制等功能
 */
@Service
public class SecurityService {

    private static final Logger logger = LoggerFactory.getLogger(SecurityService.class);

    @Autowired
    private FilePermissionRepository permissionRepository;

    @Value("${app.file.allowed-types}")
    private String allowedTypes;

    @Value("${app.file.max-file-size}")
    private long maxFileSize;

    @Value("${app.security.max-download-count}")
    private int maxDownloadCount;

    /**
     * 验证上传文件的安全性
     */
    public void validateFile(MultipartFile file, String uploaderId) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("上传文件不能为空");
        }

        // 验证用户ID
        validateUserId(uploaderId);

        // 验证文件基本信息
        validateFileBasicInfo(file);

        // 验证文件类型
        validateFileType(file);

        // 验证文件大小
        validateFileSize(file.getSize());

        // 验证文件内容安全性
        validateFileContent(file);

        // 验证上传频率限制
        validateUploadRateLimit(uploaderId);
    }

    /**
     * 检查用户是否有读取文件的权限
     */
    public boolean hasReadPermission(String fileId, String userId) {
        if (!StringUtils.hasText(fileId) || !StringUtils.hasText(userId)) {
            return false;
        }

        return permissionRepository.hasValidPermission(
            fileId, userId, FilePermission.PermissionType.READ, LocalDateTime.now()
        ) || isFileOwner(fileId, userId);
    }

    /**
     * 检查用户是否有删除文件的权限
     */
    public boolean hasDeletePermission(String fileId, String userId) {
        if (!StringUtils.hasText(fileId) || !StringUtils.hasText(userId)) {
            return false;
        }

        return permissionRepository.hasValidPermission(
            fileId, userId, FilePermission.PermissionType.DELETE, LocalDateTime.now()
        ) || isFileOwner(fileId, userId);
    }

    /**
     * 检查用户是否有管理文件权限的权限
     */
    public boolean hasManagePermission(String fileId, String userId) {
        if (!StringUtils.hasText(fileId) || !StringUtils.hasText(userId)) {
            return false;
        }

        return permissionRepository.hasValidPermission(
            fileId, userId, FilePermission.PermissionType.MANAGE, LocalDateTime.now()
        ) || isFileOwner(fileId, userId);
    }

    /**
     * 授予文件访问权限
     */
    public void grantPermission(String fileId, String userId, FilePermission.PermissionType permissionType,
                               LocalDateTime expiryTime, String grantedBy) {
        // 检查授权者是否有管理权限
        if (!hasManagePermission(fileId, grantedBy)) {
            throw new FileAccessDeniedException(fileId, grantedBy);
        }

        // 检查是否已存在相同权限
        boolean exists = permissionRepository.existsByFileIdAndUserIdAndPermissionTypeAndIsActiveTrue(
            fileId, userId, permissionType
        );

        if (exists) {
            logger.warn("权限已存在: fileId={}, userId={}, permissionType={}", 
                       fileId, userId, permissionType);
            return;
        }

        // 创建新权限
        FilePermission permission = new FilePermission(fileId, userId, permissionType, expiryTime, grantedBy);
        permissionRepository.save(permission);

        logger.info("权限授予成功: fileId={}, userId={}, permissionType={}, grantedBy={}", 
                   fileId, userId, permissionType, grantedBy);
    }

    /**
     * 撤销文件访问权限
     */
    public void revokePermission(String fileId, String userId, FilePermission.PermissionType permissionType,
                                String revokedBy) {
        // 检查撤销者是否有管理权限
        if (!hasManagePermission(fileId, revokedBy)) {
            throw new FileAccessDeniedException(fileId, revokedBy);
        }

        int revokedCount = permissionRepository.revokeAllUserPermissions(fileId, userId);
        
        if (revokedCount > 0) {
            logger.info("权限撤销成功: fileId={}, userId={}, revokedCount={}, revokedBy={}", 
                       fileId, userId, revokedCount, revokedBy);
        } else {
            logger.warn("未找到要撤销的权限: fileId={}, userId={}", fileId, userId);
        }
    }

    /**
     * 获取文件的所有有效权限
     */
    public List<FilePermission> getFilePermissions(String fileId, String requesterId) {
        // 检查请求者是否有管理权限
        if (!hasManagePermission(fileId, requesterId)) {
            throw new FileAccessDeniedException(fileId, requesterId);
        }

        return permissionRepository.findByFileIdAndIsActiveTrue(fileId);
    }

    /**
     * 清理过期权限
     */
    public void cleanupExpiredPermissions() {
        try {
            int deactivatedCount = permissionRepository.deactivateExpiredPermissions(LocalDateTime.now());
            if (deactivatedCount > 0) {
                logger.info("清理过期权限完成，数量: {}", deactivatedCount);
            }
        } catch (Exception e) {
            logger.error("清理过期权限失败", e);
        }
    }

    /**
     * 验证防盗链令牌
     */
    public boolean validateAntiHotlinkToken(String token, String fileId, String userAgent) {
        if (!StringUtils.hasText(token)) {
            return false;
        }

        try {
            // 简单的防盗链验证实现
            long maxAge = 3600000; // 1小时
            long timestamp = System.currentTimeMillis() - maxAge + 60000; // 允许1分钟误差
            
            return SecurityUtils.validateAntiHotlinkToken(token, fileId, userAgent, timestamp, maxAge);
        } catch (Exception e) {
            logger.error("防盗链令牌验证失败", e);
            return false;
        }
    }

    /**
     * 生成防盗链令牌
     */
    public String generateAntiHotlinkToken(String fileId, String userAgent) {
        long timestamp = System.currentTimeMillis();
        return SecurityUtils.generateAntiHotlinkToken(fileId, userAgent, timestamp);
    }

    /**
     * 验证文件基本信息
     */
    private void validateFileBasicInfo(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        
        if (!StringUtils.hasText(originalFilename)) {
            throw new InvalidFileException("文件名不能为空");
        }

        // 验证文件名安全性
        if (!FileUtils.isValidFileName(originalFilename)) {
            throw new InvalidFileException("文件名包含非法字符");
        }

        // 检查恶意内容
        if (SecurityUtils.containsMaliciousContent(originalFilename)) {
            throw new InvalidFileException("文件名包含恶意内容");
        }
    }

    /**
     * 验证文件类型
     */
    private void validateFileType(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        // 检查扩展名
        if (!SecurityUtils.isSupportedImageExtension(originalFilename)) {
            throw new UnsupportedFileTypeException("不支持的文件扩展名");
        }

        // 检查MIME类型
        if (!SecurityUtils.isSupportedImageMimeType(contentType)) {
            throw new UnsupportedFileTypeException("不支持的文件MIME类型: " + contentType);
        }

        // 检查危险文件
        if (SecurityUtils.isDangerousFile(originalFilename, contentType)) {
            throw new InvalidFileException("检测到危险文件类型");
        }
    }

    /**
     * 验证文件大小
     */
    private void validateFileSize(long fileSize) {
        if (!SecurityUtils.isValidFileSize(fileSize, maxFileSize)) {
            throw new FileSizeExceededException(fileSize, maxFileSize);
        }
    }

    /**
     * 验证文件内容
     */
    private void validateFileContent(MultipartFile file) {
        try {
            // 验证文件魔数
            String extension = FileUtils.getFileExtension(file.getOriginalFilename());
            if (extension != null) {
                boolean validMagicNumber = SecurityUtils.validateFileMagicNumber(
                    file.getInputStream(), extension
                );
                
                if (!validMagicNumber) {
                    throw new InvalidFileException("文件内容与扩展名不匹配");
                }
            }
        } catch (IOException e) {
            logger.error("验证文件内容时发生错误", e);
            throw new FileProcessingException("文件内容验证失败", e);
        }
    }

    /**
     * 验证用户ID
     */
    private void validateUserId(String userId) {
        if (!SecurityUtils.isValidUserId(userId)) {
            throw new IllegalArgumentException("无效的用户ID");
        }
    }

    /**
     * 验证上传频率限制
     */
    private void validateUploadRateLimit(String userId) {
        // 简单的频率限制：每分钟最多10个文件
        boolean rateLimited = SecurityUtils.isRateLimited(userId, 10, 60000);
        
        if (rateLimited) {
            throw new FileUploadException("上传频率过快，请稍后再试");
        }
    }

    /**
     * 检查用户是否为文件所有者
     */
    private boolean isFileOwner(String fileId, String userId) {
        // 这里应该查询文件元数据来检查所有者
        // 为了避免循环依赖，暂时返回false，在实际实现中需要优化
        return false;
    }

    /**
     * 验证IP白名单（如果配置了）
     */
    public boolean validateClientIP(String clientIP, Set<String> allowedIPs) {
        return SecurityUtils.isAllowedIP(clientIP, allowedIPs);
    }

    /**
     * 清理安全相关的缓存
     */
    public void cleanupSecurityCache() {
        try {
            SecurityUtils.cleanupRateLimitCache();
            logger.debug("安全缓存清理完成");
        } catch (Exception e) {
            logger.error("清理安全缓存失败", e);
        }
    }

    /**
     * 获取支持的文件类型
     */
    public Set<String> getSupportedFileTypes() {
        return SecurityUtils.getSupportedImageExtensions();
    }

    /**
     * 验证访问令牌
     */
    public boolean validateAccessToken(String token) {
        return SecurityUtils.isValidAccessToken(token);
    }

    /**
     * 检查下载次数限制
     */
    public boolean checkDownloadLimit(String userId, int currentDownloads) {
        return currentDownloads < maxDownloadCount;
    }

    /**
     * 记录安全事件
     */
    private void logSecurityEvent(String event, String userId, String details) {
        logger.warn("安全事件: event={}, userId={}, details={}", event, userId, details);
    }
}