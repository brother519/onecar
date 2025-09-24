package com.onecar.photoservice.repository;

import com.onecar.photoservice.entity.FileMetadata;
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
 * 文件元数据数据访问层
 * 提供文件元数据的CRUD操作和复杂查询功能
 */
@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, String> {

    /**
     * 根据MD5哈希值查找文件（用于重复文件检测）
     */
    Optional<FileMetadata> findByMd5HashAndIsDeletedFalse(String md5Hash);

    /**
     * 根据存储文件名查找文件
     */
    Optional<FileMetadata> findByStoredNameAndIsDeletedFalse(String storedName);

    /**
     * 根据上传者ID查找文件列表
     */
    Page<FileMetadata> findByUploaderIdAndIsDeletedFalse(String uploaderId, Pageable pageable);

    /**
     * 根据文件分类查找文件列表
     */
    Page<FileMetadata> findByCategoryAndIsDeletedFalse(String category, Pageable pageable);

    /**
     * 根据上传者ID和分类查找文件列表
     */
    Page<FileMetadata> findByUploaderIdAndCategoryAndIsDeletedFalse(String uploaderId, String category, Pageable pageable);

    /**
     * 根据内容类型查找文件列表
     */
    Page<FileMetadata> findByContentTypeStartingWithAndIsDeletedFalse(String contentTypePrefix, Pageable pageable);

    /**
     * 查找指定时间范围内上传的文件
     */
    Page<FileMetadata> findByUploadTimeBetweenAndIsDeletedFalse(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * 查找大于指定大小的文件
     */
    Page<FileMetadata> findByFileSizeGreaterThanAndIsDeletedFalse(Long minSize, Pageable pageable);

    /**
     * 查找小于指定大小的文件
     */
    Page<FileMetadata> findByFileSizeLessThanAndIsDeletedFalse(Long maxSize, Pageable pageable);

    /**
     * 查找指定大小范围内的文件
     */
    Page<FileMetadata> findByFileSizeBetweenAndIsDeletedFalse(Long minSize, Long maxSize, Pageable pageable);

    /**
     * 根据原始文件名模糊查询
     */
    Page<FileMetadata> findByOriginalNameContainingIgnoreCaseAndIsDeletedFalse(String fileName, Pageable pageable);

    /**
     * 查找热门文件（按下载次数排序）
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.isDeleted = false ORDER BY f.downloadCount DESC")
    Page<FileMetadata> findPopularFiles(Pageable pageable);

    /**
     * 查找最近上传的文件
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.isDeleted = false ORDER BY f.uploadTime DESC")
    Page<FileMetadata> findRecentFiles(Pageable pageable);

    /**
     * 查找最近访问的文件
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.isDeleted = false ORDER BY f.lastAccessTime DESC")
    Page<FileMetadata> findRecentlyAccessedFiles(Pageable pageable);

    /**
     * 统计用户上传的文件总数
     */
    long countByUploaderIdAndIsDeletedFalse(String uploaderId);

    /**
     * 统计指定分类的文件总数
     */
    long countByCategoryAndIsDeletedFalse(String category);

    /**
     * 统计指定内容类型的文件总数
     */
    long countByContentTypeStartingWithAndIsDeletedFalse(String contentTypePrefix);

    /**
     * 计算用户上传的文件总大小
     */
    @Query("SELECT COALESCE(SUM(f.fileSize), 0) FROM FileMetadata f WHERE f.uploaderId = :uploaderId AND f.isDeleted = false")
    Long sumFileSizeByUploaderId(@Param("uploaderId") String uploaderId);

    /**
     * 计算所有文件的总大小
     */
    @Query("SELECT COALESCE(SUM(f.fileSize), 0) FROM FileMetadata f WHERE f.isDeleted = false")
    Long sumTotalFileSize();

    /**
     * 查找需要清理的临时文件（超过指定时间未访问）
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.isDeleted = false AND f.lastAccessTime < :cutoffTime")
    List<FileMetadata> findFilesForCleanup(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * 查找已删除但需要物理删除的文件
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.isDeleted = true AND f.deleteTime < :cutoffTime")
    List<FileMetadata> findDeletedFilesForCleanup(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * 批量更新最后访问时间
     */
    @Modifying
    @Query("UPDATE FileMetadata f SET f.lastAccessTime = :accessTime WHERE f.id IN :fileIds")
    int updateLastAccessTime(@Param("fileIds") List<String> fileIds, @Param("accessTime") LocalDateTime accessTime);

    /**
     * 增加下载次数
     */
    @Modifying
    @Query("UPDATE FileMetadata f SET f.downloadCount = f.downloadCount + 1, f.lastAccessTime = :accessTime WHERE f.id = :fileId")
    int incrementDownloadCount(@Param("fileId") String fileId, @Param("accessTime") LocalDateTime accessTime);

    /**
     * 批量标记文件为已删除
     */
    @Modifying
    @Query("UPDATE FileMetadata f SET f.isDeleted = true, f.deleteTime = :deleteTime WHERE f.id IN :fileIds")
    int markFilesAsDeleted(@Param("fileIds") List<String> fileIds, @Param("deleteTime") LocalDateTime deleteTime);

    /**
     * 恢复已删除的文件
     */
    @Modifying
    @Query("UPDATE FileMetadata f SET f.isDeleted = false, f.deleteTime = null WHERE f.id = :fileId")
    int restoreDeletedFile(@Param("fileId") String fileId);

    /**
     * 查找重复文件（相同MD5但不同ID）
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.md5Hash = :md5Hash AND f.id != :excludeId AND f.isDeleted = false")
    List<FileMetadata> findDuplicateFiles(@Param("md5Hash") String md5Hash, @Param("excludeId") String excludeId);

    /**
     * 查找孤儿文件（没有对应物理文件的记录，需要配合文件系统检查）
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.isDeleted = false")
    List<FileMetadata> findAllActiveFiles();

    /**
     * 根据文件路径前缀查找文件
     */
    List<FileMetadata> findByFilePathStartingWithAndIsDeletedFalse(String pathPrefix);

    /**
     * 查找指定用户在指定时间段内上传的文件
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.uploaderId = :uploaderId AND f.uploadTime BETWEEN :startTime AND :endTime AND f.isDeleted = false ORDER BY f.uploadTime DESC")
    List<FileMetadata> findUserFilesInTimeRange(@Param("uploaderId") String uploaderId, 
                                               @Param("startTime") LocalDateTime startTime, 
                                               @Param("endTime") LocalDateTime endTime);

    /**
     * 统计每日上传文件数量
     */
    @Query("SELECT DATE(f.uploadTime) as uploadDate, COUNT(f) as fileCount FROM FileMetadata f WHERE f.uploadTime BETWEEN :startTime AND :endTime AND f.isDeleted = false GROUP BY DATE(f.uploadTime) ORDER BY uploadDate DESC")
    List<Object[]> getUploadStatsByDate(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * 统计按文件类型分组的文件数量
     */
    @Query("SELECT f.contentType, COUNT(f) as fileCount, COALESCE(SUM(f.fileSize), 0) as totalSize FROM FileMetadata f WHERE f.isDeleted = false GROUP BY f.contentType ORDER BY fileCount DESC")
    List<Object[]> getFileStatsByContentType();

    /**
     * 统计按分类分组的文件数量
     */
    @Query("SELECT f.category, COUNT(f) as fileCount, COALESCE(SUM(f.fileSize), 0) as totalSize FROM FileMetadata f WHERE f.isDeleted = false GROUP BY f.category ORDER BY fileCount DESC")
    List<Object[]> getFileStatsByCategory();

    /**
     * 检查文件是否存在且未删除
     */
    boolean existsByIdAndIsDeletedFalse(String fileId);

    /**
     * 检查用户是否拥有该文件
     */
    boolean existsByIdAndUploaderIdAndIsDeletedFalse(String fileId, String uploaderId);
}