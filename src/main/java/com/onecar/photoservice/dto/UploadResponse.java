package com.onecar.photoservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 文件上传响应DTO
 * 包含上传成功后的文件信息和相关链接
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "文件上传响应")
public class UploadResponse {

    @Schema(description = "文件ID", example = "abc123")
    private String fileId;

    @Schema(description = "原始文件名", example = "photo.jpg")
    private String fileName;

    @Schema(description = "文件大小（字节）", example = "1024000")
    private Long fileSize;

    @Schema(description = "文件类型", example = "image/jpeg")
    private String contentType;

    @Schema(description = "上传时间", example = "2024-01-01T12:00:00")
    private LocalDateTime uploadTime;

    @Schema(description = "下载链接", example = "/api/files/download/abc123")
    private String downloadUrl;

    @Schema(description = "缩略图链接", example = "/api/files/thumbnail/abc123")
    private String thumbnailUrl;

    @Schema(description = "文件MD5值", example = "d41d8cd98f00b204e9800998ecf8427e")
    private String md5Hash;

    @Schema(description = "图片宽度", example = "1920")
    private Integer imageWidth;

    @Schema(description = "图片高度", example = "1080")
    private Integer imageHeight;

    @Schema(description = "是否已压缩", example = "true")
    private Boolean compressed;

    @Schema(description = "原始文件大小（压缩前）", example = "2048000")
    private Long originalFileSize;

    @Schema(description = "压缩率", example = "50.0")
    private Double compressionRatio;

    @Schema(description = "可用的缩略图尺寸", example = "[\"150x150\", \"300x300\", \"600x600\"]")
    private List<String> thumbnailSizes;

    // Constructors
    public UploadResponse() {
    }

    public UploadResponse(String fileId, String fileName, Long fileSize, String contentType, LocalDateTime uploadTime) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.uploadTime = uploadTime;
    }

    /**
     * 计算压缩率
     */
    public void calculateCompressionRatio() {
        if (originalFileSize != null && fileSize != null && originalFileSize > 0) {
            this.compressionRatio = ((originalFileSize - fileSize) * 100.0) / originalFileSize;
        }
    }

    /**
     * 设置下载链接
     */
    public UploadResponse downloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
        return this;
    }

    /**
     * 设置缩略图链接
     */
    public UploadResponse thumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
        return this;
    }

    /**
     * 设置压缩信息
     */
    public UploadResponse compressionInfo(Long originalFileSize, Boolean compressed) {
        this.originalFileSize = originalFileSize;
        this.compressed = compressed;
        calculateCompressionRatio();
        return this;
    }

    /**
     * 设置图片尺寸信息
     */
    public UploadResponse imageSize(Integer width, Integer height) {
        this.imageWidth = width;
        this.imageHeight = height;
        return this;
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
     * 获取格式化的压缩率
     */
    public String getFormattedCompressionRatio() {
        if (compressionRatio == null) {
            return null;
        }
        return String.format("%.1f%%", compressionRatio);
    }

    /**
     * 检查是否为图片文件
     */
    public boolean isImage() {
        return contentType != null && contentType.startsWith("image/");
    }

    // Getters and Setters
    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
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

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getMd5Hash() {
        return md5Hash;
    }

    public void setMd5Hash(String md5Hash) {
        this.md5Hash = md5Hash;
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

    public Boolean getCompressed() {
        return compressed;
    }

    public void setCompressed(Boolean compressed) {
        this.compressed = compressed;
    }

    public Long getOriginalFileSize() {
        return originalFileSize;
    }

    public void setOriginalFileSize(Long originalFileSize) {
        this.originalFileSize = originalFileSize;
    }

    public Double getCompressionRatio() {
        return compressionRatio;
    }

    public void setCompressionRatio(Double compressionRatio) {
        this.compressionRatio = compressionRatio;
    }

    public List<String> getThumbnailSizes() {
        return thumbnailSizes;
    }

    public void setThumbnailSizes(List<String> thumbnailSizes) {
        this.thumbnailSizes = thumbnailSizes;
    }

    @Override
    public String toString() {
        return "UploadResponse{" +
                "fileId='" + fileId + '\'' +
                ", fileName='" + fileName + '\'' +
                ", fileSize=" + fileSize +
                ", contentType='" + contentType + '\'' +
                ", uploadTime=" + uploadTime +
                ", downloadUrl='" + downloadUrl + '\'' +
                ", compressed=" + compressed +
                ", compressionRatio=" + compressionRatio +
                '}';
    }
}