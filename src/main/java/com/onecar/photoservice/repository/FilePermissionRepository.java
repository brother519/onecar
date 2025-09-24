package com.onecar.photoservice.repository;

import com.onecar.photoservice.entity.FilePermission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 文件权限数据访问层
 * 提供文件访问权限的CRUD操作和权限查询功能
 */
@Repository
public interface FilePermissionRepository extends JpaRepository<FilePermission, String> {

    /**
     * 查找用户对指定文件的特定权限
     */
    Optional<FilePermission> findByFileIdAndUserIdAndPermissionTypeAndIsActiveTrue(
            String fileId, String userId, FilePermission.PermissionType permissionType);

    /**
     * 查找用户对指定文件的所有有效权限
     */
    List<FilePermission> findByFileIdAndUserIdAndIsActiveTrue(String fileId, String userId);

    /**
     * 查找指定文件的所有有效权限
     */
    List<FilePermission> findByFileIdAndIsActiveTrue(String fileId);

    /**
     * 查找用户拥有的所有有效权限
     */
    Page<FilePermission> findByUserIdAndIsActiveTrue(String userId, Pageable pageable);

    /**
     * 查找用户拥有的指定类型权限
     */
    Page<FilePermission> findByUserIdAndPermissionTypeAndIsActiveTrue(
            String userId, FilePermission.PermissionType permissionType, Pageable pageable);

    /**
     * 检查用户是否有指定文件的特定权限（包括未过期检查）
     */
    @Query("SELECT COUNT(p) > 0 FROM FilePermission p WHERE p.fileId = :fileId AND p.userId = :userId " +
           "AND p.permissionType = :permissionType AND p.isActive = true " +
           "AND (p.expiryTime IS NULL OR p.expiryTime > :currentTime)")
    boolean hasValidPermission(@Param("fileId") String fileId, 
                              @Param("userId") String userId, 
                              @Param("permissionType") FilePermission.PermissionType permissionType,
                              @Param("currentTime") LocalDateTime currentTime);

    /**
     * 检查用户是否有指定文件的任意权限
     */
    @Query("SELECT COUNT(p) > 0 FROM FilePermission p WHERE p.fileId = :fileId AND p.userId = :userId " +
           "AND p.isActive = true AND (p.expiryTime IS NULL OR p.expiryTime > :currentTime)")
    boolean hasAnyValidPermission(@Param("fileId") String fileId, 
                                 @Param("userId") String userId,
                                 @Param("currentTime") LocalDateTime currentTime);

    /**
     * 查找已过期的权限
     */
    @Query("SELECT p FROM FilePermission p WHERE p.isActive = true AND p.expiryTime IS NOT NULL AND p.expiryTime <= :currentTime")
    List<FilePermission> findExpiredPermissions(@Param("currentTime") LocalDateTime currentTime);

    /**
     * 查找即将过期的权限（指定天数内）
     */
    @Query("SELECT p FROM FilePermission p WHERE p.isActive = true AND p.expiryTime IS NOT NULL " +
           "AND p.expiryTime > :currentTime AND p.expiryTime <= :expiryThreshold")
    List<FilePermission> findPermissionsExpiringWithin(@Param("currentTime") LocalDateTime currentTime,
                                                       @Param("expiryThreshold") LocalDateTime expiryThreshold);

    /**
     * 查找用户授予的权限
     */
    Page<FilePermission> findByGrantedByAndIsActiveTrue(String grantedBy, Pageable pageable);

    /**
     * 批量撤销权限
     */
    @Modifying
    @Query("UPDATE FilePermission p SET p.isActive = false WHERE p.id IN :permissionIds")
    int revokePermissions(@Param("permissionIds") List<String> permissionIds);

    /**
     * 撤销用户对指定文件的所有权限
     */
    @Modifying
    @Query("UPDATE FilePermission p SET p.isActive = false WHERE p.fileId = :fileId AND p.userId = :userId")
    int revokeAllUserPermissions(@Param("fileId") String fileId, @Param("userId") String userId);

    /**
     * 撤销指定文件的所有权限
     */
    @Modifying
    @Query("UPDATE FilePermission p SET p.isActive = false WHERE p.fileId = :fileId")
    int revokeAllFilePermissions(@Param("fileId") String fileId);

    /**
     * 自动撤销过期权限
     */
    @Modifying
    @Query("UPDATE FilePermission p SET p.isActive = false WHERE p.isActive = true " +
           "AND p.expiryTime IS NOT NULL AND p.expiryTime <= :currentTime")
    int deactivateExpiredPermissions(@Param("currentTime") LocalDateTime currentTime);

    /**
     * 延长权限有效期
     */
    @Modifying
    @Query("UPDATE FilePermission p SET p.expiryTime = :newExpiryTime WHERE p.id = :permissionId")
    int extendPermissionExpiry(@Param("permissionId") String permissionId, 
                              @Param("newExpiryTime") LocalDateTime newExpiryTime);

    /**
     * 设置权限为永久有效
     */
    @Modifying
    @Query("UPDATE FilePermission p SET p.expiryTime = NULL WHERE p.id = :permissionId")
    int makePermanentPermission(@Param("permissionId") String permissionId);

    /**
     * 统计用户拥有的有效权限数量
     */
    @Query("SELECT COUNT(p) FROM FilePermission p WHERE p.userId = :userId AND p.isActive = true " +
           "AND (p.expiryTime IS NULL OR p.expiryTime > :currentTime)")
    long countValidPermissionsByUser(@Param("userId") String userId, @Param("currentTime") LocalDateTime currentTime);

    /**
     * 统计指定文件的有效权限数量
     */
    @Query("SELECT COUNT(p) FROM FilePermission p WHERE p.fileId = :fileId AND p.isActive = true " +
           "AND (p.expiryTime IS NULL OR p.expiryTime > :currentTime)")
    long countValidPermissionsByFile(@Param("fileId") String fileId, @Param("currentTime") LocalDateTime currentTime);

    /**
     * 查找具有指定权限类型的用户列表
     */
    @Query("SELECT DISTINCT p.userId FROM FilePermission p WHERE p.fileId = :fileId " +
           "AND p.permissionType = :permissionType AND p.isActive = true " +
           "AND (p.expiryTime IS NULL OR p.expiryTime > :currentTime)")
    List<String> findUsersWithPermission(@Param("fileId") String fileId, 
                                        @Param("permissionType") FilePermission.PermissionType permissionType,
                                        @Param("currentTime") LocalDateTime currentTime);

    /**
     * 查找可以访问指定文件的所有用户
     */
    @Query("SELECT DISTINCT p.userId FROM FilePermission p WHERE p.fileId = :fileId AND p.isActive = true " +
           "AND (p.expiryTime IS NULL OR p.expiryTime > :currentTime)")
    List<String> findUsersWithAnyPermission(@Param("fileId") String fileId, 
                                           @Param("currentTime") LocalDateTime currentTime);

    /**
     * 查找用户可以访问的文件ID列表
     */
    @Query("SELECT DISTINCT p.fileId FROM FilePermission p WHERE p.userId = :userId " +
           "AND p.permissionType = :permissionType AND p.isActive = true " +
           "AND (p.expiryTime IS NULL OR p.expiryTime > :currentTime)")
    List<String> findAccessibleFileIds(@Param("userId") String userId, 
                                      @Param("permissionType") FilePermission.PermissionType permissionType,
                                      @Param("currentTime") LocalDateTime currentTime);

    /**
     * 检查权限是否存在（包括非活跃的）
     */
    boolean existsByFileIdAndUserIdAndPermissionType(String fileId, String userId, FilePermission.PermissionType permissionType);

    /**
     * 检查活跃权限是否存在
     */
    boolean existsByFileIdAndUserIdAndPermissionTypeAndIsActiveTrue(String fileId, String userId, FilePermission.PermissionType permissionType);

    /**
     * 删除指定文件的所有权限记录（物理删除，用于文件删除时的清理）
     */
    @Modifying
    void deleteByFileId(String fileId);

    /**
     * 删除用户的所有权限记录（物理删除，用于用户删除时的清理）
     */
    @Modifying
    void deleteByUserId(String userId);

    /**
     * 查找权限统计信息按权限类型分组
     */
    @Query("SELECT p.permissionType, COUNT(p) as permissionCount FROM FilePermission p " +
           "WHERE p.isActive = true AND (p.expiryTime IS NULL OR p.expiryTime > :currentTime) " +
           "GROUP BY p.permissionType ORDER BY permissionCount DESC")
    List<Object[]> getPermissionStatsByType(@Param("currentTime") LocalDateTime currentTime);

    /**
     * 查找在指定时间范围内创建的权限
     */
    List<FilePermission> findByGrantTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 查找由指定用户授予的权限
     */
    @Query("SELECT p FROM FilePermission p WHERE p.grantedBy = :grantedBy AND p.grantTime BETWEEN :startTime AND :endTime ORDER BY p.grantTime DESC")
    List<FilePermission> findPermissionsGrantedByUserInTimeRange(@Param("grantedBy") String grantedBy,
                                                                 @Param("startTime") LocalDateTime startTime,
                                                                 @Param("endTime") LocalDateTime endTime);
}