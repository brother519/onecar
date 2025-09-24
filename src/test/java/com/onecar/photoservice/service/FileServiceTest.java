package com.onecar.photoservice.service;

import com.onecar.photoservice.dto.UploadResponse;
import com.onecar.photoservice.entity.FileMetadata;
import com.onecar.photoservice.exception.FileNotFoundException;
import com.onecar.photoservice.exception.InvalidFileException;
import com.onecar.photoservice.repository.FileMetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * FileService单元测试
 * 测试文件服务的核心业务逻辑
 */
@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private SecurityService securityService;

    @Mock
    private CompressionService compressionService;

    @InjectMocks
    private FileService fileService;

    private MockMultipartFile testImageFile;
    private FileMetadata testFileMetadata;

    @BeforeEach
    void setUp() {
        // 设置配置属性
        ReflectionTestUtils.setField(fileService, "uploadPath", "./test-storage");
        ReflectionTestUtils.setField(fileService, "maxFileSize", 10485760L); // 10MB
        ReflectionTestUtils.setField(fileService, "autoCompressThreshold", 2097152L); // 2MB

        // 创建测试文件
        testImageFile = new MockMultipartFile(
            "file",
            "test-image.jpg",
            "image/jpeg",
            "test image content".getBytes()
        );

        // 创建测试文件元数据
        testFileMetadata = new FileMetadata();
        testFileMetadata.setId("test-file-id");
        testFileMetadata.setOriginalName("test-image.jpg");
        testFileMetadata.setStoredName("stored-image.jpg");
        testFileMetadata.setFilePath("./test-storage/stored-image.jpg");
        testFileMetadata.setFileSize(testImageFile.getSize());
        testFileMetadata.setContentType("image/jpeg");
        testFileMetadata.setMd5Hash("test-md5-hash");
        testFileMetadata.setUploaderId("test-user");
        testFileMetadata.setUploadTime(LocalDateTime.now());
        testFileMetadata.setIsDeleted(false);
    }

    @Test
    void uploadFile_Success() {
        // Given
        String category = "test";
        String description = "test description";
        String uploaderId = "test-user";

        // Mock安全验证通过
        doNothing().when(securityService).validateFile(testImageFile, uploaderId);

        // Mock没有重复文件
        when(fileMetadataRepository.findByMd5HashAndIsDeletedFalse(anyString()))
            .thenReturn(Optional.empty());

        // Mock保存文件元数据
        when(fileMetadataRepository.save(any(FileMetadata.class)))
            .thenReturn(testFileMetadata);

        // When
        UploadResponse response = fileService.uploadFile(testImageFile, category, description, uploaderId);

        // Then
        assertNotNull(response);
        assertEquals(testFileMetadata.getId(), response.getFileId());
        assertEquals(testFileMetadata.getOriginalName(), response.getFileName());
        assertEquals(testFileMetadata.getFileSize(), response.getFileSize());
        assertEquals(testFileMetadata.getContentType(), response.getContentType());

        // Verify interactions
        verify(securityService).validateFile(testImageFile, uploaderId);
        verify(fileMetadataRepository).findByMd5HashAndIsDeletedFalse(anyString());
        verify(fileMetadataRepository).save(any(FileMetadata.class));
    }

    @Test
    void uploadFile_EmptyFile_ThrowsException() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]);

        // When & Then
        assertThrows(InvalidFileException.class, () -> {
            fileService.uploadFile(emptyFile, null, null, "test-user");
        });

        // Verify no interactions with repository
        verifyNoInteractions(fileMetadataRepository);
    }

    @Test
    void uploadFile_NullFile_ThrowsException() {
        // When & Then
        assertThrows(InvalidFileException.class, () -> {
            fileService.uploadFile(null, null, null, "test-user");
        });

        // Verify no interactions with repository
        verifyNoInteractions(fileMetadataRepository);
    }

    @Test
    void uploadFile_DuplicateFile_ReturnsExistingFile() {
        // Given
        String uploaderId = "test-user";

        // Mock安全验证通过
        doNothing().when(securityService).validateFile(testImageFile, uploaderId);

        // Mock找到重复文件
        when(fileMetadataRepository.findByMd5HashAndIsDeletedFalse(anyString()))
            .thenReturn(Optional.of(testFileMetadata));

        // When
        UploadResponse response = fileService.uploadFile(testImageFile, null, null, uploaderId);

        // Then
        assertNotNull(response);
        assertEquals(testFileMetadata.getId(), response.getFileId());

        // Verify save was not called (existing file returned)
        verify(fileMetadataRepository, never()).save(any(FileMetadata.class));
    }

    @Test
    void getFileInfo_Success() {
        // Given
        String fileId = "test-file-id";
        String userId = "test-user";

        when(fileMetadataRepository.findById(fileId))
            .thenReturn(Optional.of(testFileMetadata));
        when(securityService.hasReadPermission(fileId, userId))
            .thenReturn(true);

        // When
        var fileInfo = fileService.getFileInfo(fileId, userId);

        // Then
        assertNotNull(fileInfo);
        assertEquals(testFileMetadata.getId(), fileInfo.getFileId());
        assertEquals(testFileMetadata.getOriginalName(), fileInfo.getOriginalName());

        verify(fileMetadataRepository).findById(fileId);
        verify(securityService).hasReadPermission(fileId, userId);
    }

    @Test
    void getFileInfo_FileNotFound_ThrowsException() {
        // Given
        String fileId = "non-existent-file";
        String userId = "test-user";

        when(fileMetadataRepository.findById(fileId))
            .thenReturn(Optional.empty());

        // When & Then
        assertThrows(FileNotFoundException.class, () -> {
            fileService.getFileInfo(fileId, userId);
        });

        verify(fileMetadataRepository).findById(fileId);
    }

    @Test
    void deleteFile_Success() {
        // Given
        String fileId = "test-file-id";
        String userId = "test-user";

        when(fileMetadataRepository.findById(fileId))
            .thenReturn(Optional.of(testFileMetadata));
        when(fileMetadataRepository.save(any(FileMetadata.class)))
            .thenReturn(testFileMetadata);

        // 设置文件所有者
        testFileMetadata.setUploaderId(userId);

        // When
        fileService.deleteFile(fileId, userId);

        // Then
        assertTrue(testFileMetadata.getIsDeleted());
        assertNotNull(testFileMetadata.getDeleteTime());

        verify(fileMetadataRepository).findById(fileId);
        verify(fileMetadataRepository).save(testFileMetadata);
    }

    @Test
    void deleteFile_FileNotFound_ThrowsException() {
        // Given
        String fileId = "non-existent-file";
        String userId = "test-user";

        when(fileMetadataRepository.findById(fileId))
            .thenReturn(Optional.empty());

        // When & Then
        assertThrows(FileNotFoundException.class, () -> {
            fileService.deleteFile(fileId, userId);
        });

        verify(fileMetadataRepository).findById(fileId);
        verify(fileMetadataRepository, never()).save(any());
    }

    @Test
    void restoreFile_Success() {
        // Given
        String fileId = "test-file-id";
        String userId = "test-user";

        // 设置文件为已删除状态
        testFileMetadata.setIsDeleted(true);
        testFileMetadata.setDeleteTime(LocalDateTime.now());
        testFileMetadata.setUploaderId(userId);

        when(fileMetadataRepository.findById(fileId))
            .thenReturn(Optional.of(testFileMetadata));
        when(fileMetadataRepository.save(any(FileMetadata.class)))
            .thenReturn(testFileMetadata);

        // When
        fileService.restoreFile(fileId, userId);

        // Then
        assertFalse(testFileMetadata.getIsDeleted());
        assertNull(testFileMetadata.getDeleteTime());

        verify(fileMetadataRepository).findById(fileId);
        verify(fileMetadataRepository).save(testFileMetadata);
    }

    @Test
    void getUserFileStats_Success() {
        // Given
        String userId = "test-user";
        long expectedTotalFiles = 5L;
        long expectedTotalSize = 1000000L;
        long expectedImageFiles = 3L;

        when(fileMetadataRepository.countByUploaderIdAndIsDeletedFalse(userId))
            .thenReturn(expectedTotalFiles);
        when(fileMetadataRepository.sumFileSizeByUploaderId(userId))
            .thenReturn(expectedTotalSize);
        when(fileMetadataRepository.countByContentTypeStartingWithAndIsDeletedFalse("image/"))
            .thenReturn(expectedImageFiles);

        // When
        FileService.FileStatsInfo stats = fileService.getUserFileStats(userId);

        // Then
        assertNotNull(stats);
        assertEquals(expectedTotalFiles, stats.getTotalFiles());
        assertEquals(expectedTotalSize, stats.getTotalSize());
        assertEquals(expectedImageFiles, stats.getImageFiles());

        verify(fileMetadataRepository).countByUploaderIdAndIsDeletedFalse(userId);
        verify(fileMetadataRepository).sumFileSizeByUploaderId(userId);
        verify(fileMetadataRepository).countByContentTypeStartingWithAndIsDeletedFalse("image/");
    }

    @Test
    void getUserFileStats_NullTotalSize_HandlesGracefully() {
        // Given
        String userId = "test-user";
        long expectedTotalFiles = 0L;
        long expectedImageFiles = 0L;

        when(fileMetadataRepository.countByUploaderIdAndIsDeletedFalse(userId))
            .thenReturn(expectedTotalFiles);
        when(fileMetadataRepository.sumFileSizeByUploaderId(userId))
            .thenReturn(null); // 模拟数据库返回null
        when(fileMetadataRepository.countByContentTypeStartingWithAndIsDeletedFalse("image/"))
            .thenReturn(expectedImageFiles);

        // When
        FileService.FileStatsInfo stats = fileService.getUserFileStats(userId);

        // Then
        assertNotNull(stats);
        assertEquals(expectedTotalFiles, stats.getTotalFiles());
        assertEquals(0L, stats.getTotalSize()); // 应该处理null并返回0
        assertEquals(expectedImageFiles, stats.getImageFiles());
    }
}