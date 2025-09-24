package com.onecar.photoservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 文件访问权限实体类
 * 管理文件的访问控制，支持基于用户的细粒度权限管理
 */
@Entity
@Table(name = "file_permission", indexes = {
    @Index(name = "idx_file_id", columnList = "fileId"),
    @Index(name = "idx_user_id", columnList = "userId"),
    @Index(name = "idx_permission_type", columnList = "permissionType"),
    @Index(name = "idx_is_active", columnList = "isActive"),
    @Index(name = "idx_expiry_time", columnList = "expiryTime")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_file_user_permission", columnNames = {"fileId", "userId", "permissionType"})
})
public class FilePermission {

    /**
     * 权限记录唯一标识
     */
    @Id
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @GeneratedValue(generator = "uuid2")
    @Column(length = 36)
    private String id;

    /**
     * 文件ID（外键关联FileMetadata）
     */
    @NotBlank(message = "文件ID不能为空")
    @Column(name = "file_id", nullable = false, length = 36)
    private String fileId;

    /**
     * 用户ID
     */
    @NotBlank(message = "用户ID不能为空")
    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    /**
     * 权限类型
     */
    @NotNull(message = "权限类型不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "permission_type", nullable = false, length = 20)
    private PermissionType permissionType;

    /**
     * 授权时间
     */
    @NotNull(message = "授权时间不能为空")
    @Column(name = "grant_time", nullable = false)
    private LocalDateTime grantTime;

    /**
     * 过期时间（可空，表示永久有效）
     */
    @Column(name = "expiry_time")
    private LocalDateTime expiryTime;

    /**
     * 是否生效
     */
    @NotNull(message = "权限状态不能为空")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * 授权人ID
     */
    @Column(name = "granted_by", length = 50)
    private String grantedBy;

    /**
     * 权限描述
     */
    @Column(name = "description", length = 200)
    private String description;

    /**
     * 权限类型枚举
     */
    public enum PermissionType {
        /**
         * 读取权限 - 可以下载和查看文件
         */
        READ("读取"),
        
        /**
         * 写入权限 - 可以修改文件（暂未实现）
         */
        WRITE("写入"),
        
        /**
         * 删除权限 - 可以删除文件
         */
        DELETE("删除"),
        
        /**
         * 管理权限 - 可以管理文件的访问权限
         */
        MANAGE("管理");

        private final String description;

        PermissionType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 创建时间自动设置
     */
    @PrePersist
    protected void onCreate() {
        if (grantTime == null) {
            grantTime = LocalDateTime.now();
        }
    }

    /**
     * 检查权限是否有效
     */
    public boolean isValid() {
        if (!isActive) {
            return false;
        }
        if (expiryTime != null && expiryTime.isBefore(LocalDateTime.now())) {
            return false;
        }
        return true;
    }

    /**
     * 检查权限是否已过期
     */
    public boolean isExpired() {
        return expiryTime != null && expiryTime.isBefore(LocalDateTime.now());
    }

    /**
     * 撤销权限
     */
    public void revoke() {
        this.isActive = false;
    }

    /**
     * 激活权限
     */
    public void activate() {
        this.isActive = true;
    }

    /**
     * 延长权限有效期
     */
    public void extendExpiry(LocalDateTime newExpiryTime) {
        this.expiryTime = newExpiryTime;
    }

    /**
     * 设置永久有效
     */
    public void setPermanent() {
        this.expiryTime = null;
    }

    // Constructors
    public FilePermission() {
    }

    public FilePermission(String fileId, String userId, PermissionType permissionType) {
        this.fileId = fileId;
        this.userId = userId;
        this.permissionType = permissionType;
        this.grantTime = LocalDateTime.now();
        this.isActive = true;
    }

    public FilePermission(String fileId, String userId, PermissionType permissionType, 
                         LocalDateTime expiryTime, String grantedBy) {
        this.fileId = fileId;
        this.userId = userId;
        this.permissionType = permissionType;
        this.expiryTime = expiryTime;
        this.grantedBy = grantedBy;
        this.grantTime = LocalDateTime.now();
        this.isActive = true;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public PermissionType getPermissionType() {
        return permissionType;
    }

    public void setPermissionType(PermissionType permissionType) {
        this.permissionType = permissionType;
    }

    public LocalDateTime getGrantTime() {
        return grantTime;
    }

    public void setGrantTime(LocalDateTime grantTime) {
        this.grantTime = grantTime;
    }

    public LocalDateTime getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(LocalDateTime expiryTime) {
        this.expiryTime = expiryTime;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getGrantedBy() {
        return grantedBy;
    }

    public void setGrantedBy(String grantedBy) {
        this.grantedBy = grantedBy;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    // equals, hashCode and toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FilePermission that = (FilePermission) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "FilePermission{" +
                "id='" + id + '\'' +
                ", fileId='" + fileId + '\'' +
                ", userId='" + userId + '\'' +
                ", permissionType=" + permissionType +
                ", grantTime=" + grantTime +
                ", expiryTime=" + expiryTime +
                ", isActive=" + isActive +
                '}';
    }
}