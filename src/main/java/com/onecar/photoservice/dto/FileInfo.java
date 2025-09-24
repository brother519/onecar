package com.onecar.photoservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.onecar.photoservice.entity.FileMetadata;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 文件信息DTO
 * 用于返回文件的基本信息，隐藏敏感字段
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "文件信息")
public class FileInfo {

    @Schema(description = "文件ID", example = "abc123")
    private String fileId;

    @Schema(description = "原始文件名", example = "photo.jpg")
    private String originalName;

    @Schema(description = "文件大小（字节）", example = "1024000")
    private Long fileSize;

    @Schema(description = "文件类型", example = "image/jpeg")
    private String contentType;

    @Schema(description = "文件分类", example = "avatar")
    private String category;

    @Schema(description = "文件描述", example = "用户头像")
    private String description;

    @Schema(description = "上传时间", example = "2024-01-01T12:00:00")
    private LocalDateTime uploadTime;

    @Schema(description = "最后访问时间", example = "2024-01-01T12:00:00")
    private LocalDateTime lastAccessTime;

    @Schema(description = "下载次数", example = "10")
    private Integer downloadCount;

    @Schema(description = "下载链接", example = "/api/files/download/abc123")
    private String downloadUrl;

    @Schema(description = "图片宽度", example = "1920")
    private Integer imageWidth;

    @Schema(description = "图片高度", example = "1080")
    private Integer imageHeight;

    @Schema(description = "缩略图链接", example = "/api/files/thumbnail/abc123")
    private String thumbnailUrl;

    @Schema(description = "是否为图片文件", example = "true")
    private Boolean isImage;

    // Constructors
    public FileInfo() {
    }

    public FileInfo(String fileId, String originalName, Long fileSize, String contentType) {
        this.fileId = fileId;
        this.originalName = originalName;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.isImage = contentType != null && contentType.startsWith("image/");
    }

    /**
     * 从FileMetadata实体转换为DTO
     */
    public static FileInfo fromEntity(FileMetadata metadata) {
        if (metadata == null) {
            return null;
        }

        FileInfo fileInfo = new FileInfo();
        fileInfo.setFileId(metadata.getId());
        fileInfo.setOriginalName(metadata.getOriginalName());
        fileInfo.setFileSize(metadata.getFileSize());
        fileInfo.setContentType(metadata.getContentType());
        fileInfo.setCategory(metadata.getCategory());
        fileInfo.setDescription(metadata.getDescription());
        fileInfo.setUploadTime(metadata.getUploadTime());
        fileInfo.setLastAccessTime(metadata.getLastAccessTime());
        fileInfo.setDownloadCount(metadata.getDownloadCount());
        fileInfo.setImageWidth(metadata.getImageWidth());
        fileInfo.setImageHeight(metadata.getImageHeight());
        fileInfo.setIsImage(metadata.isImage());

        // 构建下载链接
        fileInfo.setDownloadUrl("/api/files/download/" + metadata.getId());
        
        // 如果有缩略图，构建缩略图链接
        if (metadata.getThumbnailPath() != null) {
            fileInfo.setThumbnailUrl("/api/files/thumbnail/" + metadata.getId());
        }

        return fileInfo;
    }

    /**
     * 从FileMetadata实体转换为DTO（带基础URL）
     */
    public static FileInfo fromEntity(FileMetadata metadata, String baseUrl) {
        FileInfo fileInfo = fromEntity(metadata);
        if (fileInfo != null && baseUrl != null) {
            fileInfo.setDownloadUrl(baseUrl + "/api/files/download/" + metadata.getId());
            if (metadata.getThumbnailPath() != null) {
                fileInfo.setThumbnailUrl(baseUrl + "/api/files/thumbnail/" + metadata.getId());
            }
        }
        return fileInfo;
    }

    /**
     * 获取格式化的文件大小
     */
    public String getFormattedFileSize() {
        if (fileSize == null) {
            return "未知";
        }

        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else if (fileSize < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        } else {
            return String.format("%.1f GB", fileSize / (1024.0 * 1024.0 * 1024.0));
        }
    }

    /**
     * 获取文件扩展名
     */
    public String getFileExtension() {
        if (originalName == null) {
            return null;
        }
        int lastDotIndex = originalName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < originalName.length() - 1) {
            return originalName.substring(lastDotIndex + 1).toLowerCase();
        }
        return null;
    }

    // Getters and Setters
    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }

    public LocalDateTime getLastAccessTime() {
        return lastAccessTime;
    }

    public void setLastAccessTime(LocalDateTime lastAccessTime) {
        this.lastAccessTime = lastAccessTime;
    }

    public Integer getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(Integer downloadCount) {
        this.downloadCount = downloadCount;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public Integer getImageWidth() {
        return imageWidth;
    }

    public void setImageWidth(Integer imageWidth) {
        this.imageWidth = imageWidth;
    }

    public Integer getImageHeight() {
        return imageHeight;
    }

    public void setImageHeight(Integer imageHeight) {
        this.imageHeight = imageHeight;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public Boolean getIsImage() {
        return isImage;
    }

    public void setIsImage(Boolean isImage) {
        this.isImage = isImage;
    }

    @Override
    public String toString() {
        return "FileInfo{" +
                "fileId='" + fileId + '\'' +
                ", originalName='" + originalName + '\'' +
                ", fileSize=" + fileSize +
                ", contentType='" + contentType + '\'' +
                ", category='" + category + '\'' +
                ", uploadTime=" + uploadTime +
                ", downloadCount=" + downloadCount +
                ", isImage=" + isImage +
                '}';
    }
}