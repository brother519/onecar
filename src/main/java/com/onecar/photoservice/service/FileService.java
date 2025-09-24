package com.onecar.photoservice.service;

import com.onecar.photoservice.dto.*;
import com.onecar.photoservice.entity.FileMetadata;
import com.onecar.photoservice.exception.*;
import com.onecar.photoservice.repository.FileMetadataRepository;
import com.onecar.photoservice.util.FileUtils;
import com.onecar.photoservice.util.ImageUtils;
import com.onecar.photoservice.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 文件服务核心业务类
 * 提供文件上传、下载、管理等核心功能
 */
@Service
@Transactional
public class FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileService.class);

    @Autowired
    private FileMetadataRepository fileMetadataRepository;

    @Autowired
    private SecurityService securityService;

    @Autowired
    private CompressionService compressionService;

    @Value("${app.file.upload-path}")
    private String uploadPath;

    @Value("${app.file.temp-path}")
    private String tempPath;

    @Value("${app.file.max-file-size}")
    private long maxFileSize;

    @Value("${app.file.auto-compress-threshold}")
    private long autoCompressThreshold;

    /**
     * 单文件上传
     */
    public UploadResponse uploadFile(MultipartFile file, String category, 
                                   String description, String uploaderId) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("上传文件不能为空");
        }

        // 安全验证
        securityService.validateFile(file, uploaderId);

        try {
            // 生成文件元数据
            FileMetadata metadata = createFileMetadata(file, category, description, uploaderId);
            
            // 检查重复文件
            Optional<FileMetadata> existingFile = fileMetadataRepository
                .findByMd5HashAndIsDeletedFalse(metadata.getMd5Hash());
            
            if (existingFile.isPresent()) {
                logger.info("发现重复文件，返回已存在文件信息: {}", existingFile.get().getId());
                return buildUploadResponse(existingFile.get());
            }

            // 存储文件
            String storedPath = storeFile(file, metadata);
            metadata.setFilePath(storedPath);

            // 处理图片压缩和缩略图
            if (metadata.isImage()) {
                processImageFile(metadata, storedPath);
            }

            // 保存元数据
            metadata = fileMetadataRepository.save(metadata);
            
            logger.info("文件上传成功: fileId={}, originalName={}, size={}", 
                       metadata.getId(), metadata.getOriginalName(), metadata.getFileSize());

            return buildUploadResponse(metadata);

        } catch (IOException e) {
            logger.error("文件上传失败: {}", file.getOriginalFilename(), e);
            throw new FileUploadException("文件上传失败: " + e.getMessage(), e);
        }
    }

    /**
     * 批量文件上传
     */
    public BatchUploadResponse batchUploadFiles(MultipartFile[] files, String category, String uploaderId) {
        String batchId = "batch_" + UUID.randomUUID().toString().substring(0, 8);
        BatchUploadResponse response = new BatchUploadResponse(batchId, files.length);

        for (MultipartFile file : files) {
            try {
                UploadResponse uploadResponse = uploadFile(file, category, null, uploaderId);
                response.addSuccessFile(uploadResponse);
            } catch (Exception e) {
                logger.error("批量上传中文件 {} 失败", file.getOriginalFilename(), e);
                String errorCode = getErrorCodeFromException(e);
                String errorMessage = e.getMessage();
                response.addFailureFile(file.getOriginalFilename(), errorCode, errorMessage, file.getSize());
            }
        }

        logger.info("批量上传完成: batchId={}, 总数={}, 成功={}, 失败={}", 
                   batchId, files.length, response.getSuccessCount(), response.getFailureCount());

        return response;
    }

    /**
     * 获取文件信息
     */
    @Cacheable(value = "fileMetadata", key = "#fileId")
    public FileInfo getFileInfo(String fileId, String userId) {
        FileMetadata metadata = getFileMetadataWithPermissionCheck(fileId, userId);
        return FileInfo.fromEntity(metadata);
    }

    /**
     * 获取文件下载流
     */
    public FileDownloadInfo getFileForDownload(String fileId, String userId) {
        FileMetadata metadata = getFileMetadataWithPermissionCheck(fileId, userId);
        
        // 更新访问统计
        updateFileAccessStats(metadata);

        String filePath = metadata.getFilePath();
        if (!FileUtils.fileExists(filePath)) {
            throw new FileNotFoundException(fileId);
        }

        return new FileDownloadInfo(filePath, metadata.getOriginalName(), 
                                   metadata.getContentType(), metadata.getFileSize());
    }

    /**
     * 删除文件（软删除）
     */
    @CacheEvict(value = "fileMetadata", key = "#fileId")
    public void deleteFile(String fileId, String userId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow(() -> new FileNotFoundException(fileId));

        // 权限检查：只有文件所有者可以删除
        if (!metadata.getUploaderId().equals(userId)) {
            throw new FileAccessDeniedException(fileId, userId);
        }

        metadata.markAsDeleted();
        fileMetadataRepository.save(metadata);

        logger.info("文件已标记为删除: fileId={}, userId={}", fileId, userId);
    }

    /**
     * 恢复已删除的文件
     */
    @CacheEvict(value = "fileMetadata", key = "#fileId")
    public void restoreFile(String fileId, String userId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow(() -> new FileNotFoundException(fileId));

        // 权限检查
        if (!metadata.getUploaderId().equals(userId)) {
            throw new FileAccessDeniedException(fileId, userId);
        }

        if (!metadata.getIsDeleted()) {
            throw new InvalidFileException("文件未被删除，无需恢复");
        }

        metadata.restore();
        fileMetadataRepository.save(metadata);

        logger.info("文件已恢复: fileId={}, userId={}", fileId, userId);
    }

    /**
     * 分页查询用户文件
     */
    public Page<FileInfo> getUserFiles(String userId, String category, Pageable pageable) {
        Page<FileMetadata> metadataPage;
        
        if (StringUtils.hasText(category)) {
            metadataPage = fileMetadataRepository
                .findByUploaderIdAndCategoryAndIsDeletedFalse(userId, category, pageable);
        } else {
            metadataPage = fileMetadataRepository
                .findByUploaderIdAndIsDeletedFalse(userId, pageable);
        }

        return metadataPage.map(FileInfo::fromEntity);
    }

    /**
     * 搜索文件
     */
    public Page<FileInfo> searchFiles(String userId, String keyword, Pageable pageable) {
        if (!StringUtils.hasText(keyword)) {
            return getUserFiles(userId, null, pageable);
        }

        Page<FileMetadata> metadataPage = fileMetadataRepository
            .findByOriginalNameContainingIgnoreCaseAndIsDeletedFalse(keyword, pageable);

        return metadataPage.map(FileInfo::fromEntity);
    }

    /**
     * 获取文件统计信息
     */
    public FileStatsInfo getUserFileStats(String userId) {
        long totalFiles = fileMetadataRepository.countByUploaderIdAndIsDeletedFalse(userId);
        Long totalSize = fileMetadataRepository.sumFileSizeByUploaderId(userId);
        long imageFiles = fileMetadataRepository
            .countByContentTypeStartingWithAndIsDeletedFalse("image/");

        return new FileStatsInfo(totalFiles, totalSize != null ? totalSize : 0L, imageFiles);
    }

    /**
     * 创建文件元数据
     */
    private FileMetadata createFileMetadata(MultipartFile file, String category, 
                                          String description, String uploaderId) throws IOException {
        String originalName = file.getOriginalFilename();
        String contentType = file.getContentType();
        long fileSize = file.getSize();

        // 计算MD5
        String md5Hash;
        try (InputStream inputStream = file.getInputStream()) {
            md5Hash = FileUtils.calculateMD5(inputStream);
        }

        // 生成存储文件名
        String storedName = FileUtils.generateUniqueFileName(originalName);

        FileMetadata metadata = new FileMetadata(originalName, storedName, null, 
                                               fileSize, contentType, md5Hash, uploaderId);
        metadata.setCategory(category);
        metadata.setDescription(description);

        return metadata;
    }

    /**
     * 存储文件到磁盘
     */
    private String storeFile(MultipartFile file, FileMetadata metadata) throws IOException {
        String storedPath = FileUtils.generateFullStoragePath(uploadPath, metadata.getStoredName());
        
        // 检查磁盘空间
        if (!FileUtils.hasEnoughDiskSpace(uploadPath, file.getSize() * 2)) {
            throw new InsufficientStorageException("磁盘空间不足");
        }

        // 确保目录存在
        FileUtils.ensureParentDirectoryExists(storedPath);

        // 保存文件
        file.transferTo(new java.io.File(storedPath));

        return storedPath;
    }

    /**
     * 处理图片文件（压缩和缩略图）
     */
    private void processImageFile(FileMetadata metadata, String filePath) {
        try {
            // 获取图片尺寸
            ImageUtils.ImageDimension dimension = ImageUtils.getImageDimension(filePath);
            metadata.setImageWidth(dimension.getWidth());
            metadata.setImageHeight(dimension.getHeight());

            // 压缩处理
            if (metadata.getFileSize() > autoCompressThreshold) {
                compressionService.compressImageAsync(metadata.getId(), filePath);
            }

            // 生成缩略图
            compressionService.generateThumbnailsAsync(metadata.getId(), filePath);

        } catch (Exception e) {
            logger.error("处理图片文件失败: {}", filePath, e);
            // 不抛出异常，允许文件上传成功但没有缩略图
        }
    }

    /**
     * 构建上传响应
     */
    private UploadResponse buildUploadResponse(FileMetadata metadata) {
        UploadResponse response = new UploadResponse(
            metadata.getId(),
            metadata.getOriginalName(),
            metadata.getFileSize(),
            metadata.getContentType(),
            metadata.getUploadTime()
        );

        response.setMd5Hash(metadata.getMd5Hash());
        response.downloadUrl("/api/files/download/" + metadata.getId());

        if (metadata.isImage()) {
            response.imageSize(metadata.getImageWidth(), metadata.getImageHeight());
            if (metadata.getThumbnailPath() != null) {
                response.thumbnailUrl("/api/files/thumbnail/" + metadata.getId());
            }
        }

        return response;
    }

    /**
     * 获取文件元数据并检查权限
     */
    private FileMetadata getFileMetadataWithPermissionCheck(String fileId, String userId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow(() -> new FileNotFoundException(fileId));

        if (metadata.getIsDeleted()) {
            throw new FileNotFoundException(fileId);
        }

        // 权限检查
        if (!securityService.hasReadPermission(fileId, userId)) {
            throw new FileAccessDeniedException(fileId, userId);
        }

        return metadata;
    }

    /**
     * 更新文件访问统计
     */
    private void updateFileAccessStats(FileMetadata metadata) {
        try {
            fileMetadataRepository.incrementDownloadCount(metadata.getId(), LocalDateTime.now());
        } catch (Exception e) {
            logger.warn("更新文件访问统计失败: fileId={}", metadata.getId(), e);
        }
    }

    /**
     * 从异常中提取错误代码
     */
    private String getErrorCodeFromException(Exception e) {
        if (e instanceof FileServiceException) {
            return ((FileServiceException) e).getErrorCode();
        }
        return "UNKNOWN_ERROR";
    }

    /**
     * 文件下载信息
     */
    public static class FileDownloadInfo {
        private final String filePath;
        private final String fileName;
        private final String contentType;
        private final long fileSize;

        public FileDownloadInfo(String filePath, String fileName, String contentType, long fileSize) {
            this.filePath = filePath;
            this.fileName = fileName;
            this.contentType = contentType;
            this.fileSize = fileSize;
        }

        public String getFilePath() { return filePath; }
        public String getFileName() { return fileName; }
        public String getContentType() { return contentType; }
        public long getFileSize() { return fileSize; }
    }

    /**
     * 文件统计信息
     */
    public static class FileStatsInfo {
        private final long totalFiles;
        private final long totalSize;
        private final long imageFiles;

        public FileStatsInfo(long totalFiles, long totalSize, long imageFiles) {
            this.totalFiles = totalFiles;
            this.totalSize = totalSize;
            this.imageFiles = imageFiles;
        }

        public long getTotalFiles() { return totalFiles; }
        public long getTotalSize() { return totalSize; }
        public long getImageFiles() { return imageFiles; }
    }
}
