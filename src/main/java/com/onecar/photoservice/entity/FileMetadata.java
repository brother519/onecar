package com.onecar.photoservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 文件元数据实体类
 * 存储上传文件的所有元信息，包括存储路径、文件属性、访问统计等
 */
@Entity
@Table(name = "file_metadata", indexes = {
    @Index(name = "idx_uploader_id", columnList = "uploaderId"),
    @Index(name = "idx_upload_time", columnList = "uploadTime"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_md5_hash", columnList = "md5Hash"),
    @Index(name = "idx_is_deleted", columnList = "isDeleted")
})
public class FileMetadata {

    /**
     * 文件唯一标识符
     */
    @Id
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @GeneratedValue(generator = "uuid2")
    @Column(length = 36)
    private String id;

    /**
     * 原始文件名
     */
    @NotBlank(message = "原始文件名不能为空")
    @Size(max = 255, message = "文件名长度不能超过255个字符")
    @Column(name = "original_name", nullable = false)
    private String originalName;

    /**
     * 存储文件名（UUID生成，确保唯一性）
     */
    @NotBlank(message = "存储文件名不能为空")
    @Column(name = "stored_name", nullable = false, unique = true)
    private String storedName;

    /**
     * 文件存储路径
     */
    @NotBlank(message = "文件路径不能为空")
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    /**
     * 文件大小（字节）
     */
    @NotNull(message = "文件大小不能为空")
    @Min(value = 0, message = "文件大小不能为负数")
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * MIME类型
     */
    @NotBlank(message = "文件类型不能为空")
    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    /**
     * 文件MD5校验值
     */
    @NotBlank(message = "MD5校验值不能为空")
    @Size(min = 32, max = 32, message = "MD5校验值长度必须为32位")
    @Column(name = "md5_hash", nullable = false, length = 32)
    private String md5Hash;

    /**
     * 文件分类
     */
    @Size(max = 50, message = "文件分类长度不能超过50个字符")
    @Column(name = "category", length = 50)
    private String category;

    /**
     * 文件描述
     */
    @Size(max = 500, message = "文件描述长度不能超过500个字符")
    @Column(name = "description", length = 500)
    private String description;

    /**
     * 上传用户ID
     */
    @NotBlank(message = "上传用户ID不能为空")
    @Column(name = "uploader_id", nullable = false, length = 50)
    private String uploaderId;

    /**
     * 上传时间
     */
    @NotNull(message = "上传时间不能为空")
    @Column(name = "upload_time", nullable = false)
    private LocalDateTime uploadTime;

    /**
     * 最后访问时间
     */
    @NotNull(message = "最后访问时间不能为空")
    @Column(name = "last_access_time", nullable = false)
    private LocalDateTime lastAccessTime;

    /**
     * 下载次数
     */
    @NotNull(message = "下载次数不能为空")
    @Min(value = 0, message = "下载次数不能为负数")
    @Column(name = "download_count", nullable = false)
    private Integer downloadCount = 0;

    /**
     * 删除标记
     */
    @NotNull(message = "删除标记不能为空")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    /**
     * 删除时间
     */
    @Column(name = "delete_time")
    private LocalDateTime deleteTime;

    /**
     * 图片宽度（仅图片文件）
     */
    @Column(name = "image_width")
    private Integer imageWidth;

    /**
     * 图片高度（仅图片文件）
     */
    @Column(name = "image_height")
    private Integer imageHeight;

    /**
     * 缩略图路径
     */
    @Column(name = "thumbnail_path", length = 500)
    private String thumbnailPath;

    /**
     * 创建时间自动设置
     */
    @PrePersist
    protected void onCreate() {
        if (uploadTime == null) {
            uploadTime = LocalDateTime.now();
        }
        if (lastAccessTime == null) {
            lastAccessTime = LocalDateTime.now();
        }
    }

    /**
     * 更新最后访问时间
     */
    public void updateLastAccessTime() {
        this.lastAccessTime = LocalDateTime.now();
    }

    /**
     * 增加下载次数
     */
    public void incrementDownloadCount() {
        this.downloadCount++;
        updateLastAccessTime();
    }

    /**
     * 标记为已删除
     */
    public void markAsDeleted() {
        this.isDeleted = true;
        this.deleteTime = LocalDateTime.now();
    }

    /**
     * 恢复文件（取消删除标记）
     */
    public void restore() {
        this.isDeleted = false;
        this.deleteTime = null;
    }

    /**
     * 检查是否为图片文件
     */
    public boolean isImage() {
        return contentType != null && contentType.startsWith("image/");
    }

    // Constructors
    public FileMetadata() {
    }

    public FileMetadata(String originalName, String storedName, String filePath, 
                       Long fileSize, String contentType, String md5Hash, String uploaderId) {
        this.originalName = originalName;
        this.storedName = storedName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.md5Hash = md5Hash;
        this.uploaderId = uploaderId;
        this.uploadTime = LocalDateTime.now();
        this.lastAccessTime = LocalDateTime.now();
        this.downloadCount = 0;
        this.isDeleted = false;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getStoredName() {
        return storedName;
    }

    public void setStoredName(String storedName) {
        this.storedName = storedName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
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

    public String getMd5Hash() {
        return md5Hash;
    }

    public void setMd5Hash(String md5Hash) {
        this.md5Hash = md5Hash;
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

    public String getUploaderId() {
        return uploaderId;
    }

    public void setUploaderId(String uploaderId) {
        this.uploaderId = uploaderId;
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

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public LocalDateTime getDeleteTime() {
        return deleteTime;
    }

    public void setDeleteTime(LocalDateTime deleteTime) {
        this.deleteTime = deleteTime;
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

    public String getThumbnailPath() {
        return thumbnailPath;
    }

    public void setThumbnailPath(String thumbnailPath) {
        this.thumbnailPath = thumbnailPath;
    }

    // equals, hashCode and toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FileMetadata that = (FileMetadata) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "FileMetadata{" +
                "id='" + id + '\'' +
                ", originalName='" + originalName + '\'' +
                ", storedName='" + storedName + '\'' +
                ", fileSize=" + fileSize +
                ", contentType='" + contentType + '\'' +
                ", uploaderId='" + uploaderId + '\'' +
                ", uploadTime=" + uploadTime +
                ", isDeleted=" + isDeleted +
                '}';
    }
}