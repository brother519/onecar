package com.onecar.photoservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onecar.photoservice.dto.ApiResponse;
import com.onecar.photoservice.dto.UploadResponse;
import com.onecar.photoservice.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * FileUploadController集成测试
 * 测试文件上传控制器的HTTP接口
 */
@WebMvcTest(FileUploadController.class)
class FileUploadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FileService fileService;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMultipartFile testImageFile;
    private UploadResponse mockUploadResponse;

    @BeforeEach
    void setUp() {
        // 创建测试文件
        testImageFile = new MockMultipartFile(
            "file",
            "test-image.jpg",
            "image/jpeg",
            "test image content".getBytes()
        );

        // 创建模拟上传响应
        mockUploadResponse = new UploadResponse(
            "test-file-id",
            "test-image.jpg",
            (long) testImageFile.getSize(),
            "image/jpeg",
            LocalDateTime.now()
        );
        mockUploadResponse.setDownloadUrl("/api/files/download/test-file-id");
        mockUploadResponse.setMd5Hash("test-md5-hash");
    }

    @Test
    void uploadFile_Success() throws Exception {
        // Given
        String uploaderId = "test-user";
        String category = "test";
        String description = "test description";

        when(fileService.uploadFile(any(), eq(category), eq(description), eq(uploaderId)))
            .thenReturn(mockUploadResponse);

        // When & Then
        MvcResult result = mockMvc.perform(multipart("/api/files/upload")
                .file(testImageFile)
                .param("uploaderId", uploaderId)
                .param("category", category)
                .param("description", description))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.message").value("创建成功"))
                .andExpect(jsonPath("$.data.fileId").value("test-file-id"))
                .andExpect(jsonPath("$.data.fileName").value("test-image.jpg"))
                .andExpect(jsonPath("$.data.fileSize").value(testImageFile.getSize()))
                .andExpect(jsonPath("$.data.contentType").value("image/jpeg"))
                .andExpect(jsonPath("$.data.downloadUrl").value("/api/files/download/test-file-id"))
                .andReturn();

        // Verify service was called
        verify(fileService).uploadFile(any(), eq(category), eq(description), eq(uploaderId));

        // Verify response structure
        String responseContent = result.getResponse().getContentAsString();
        ApiResponse<?> response = objectMapper.readValue(responseContent, ApiResponse.class);
        assertEquals(201, response.getCode());
        assertNotNull(response.getData());
    }

    @Test
    void uploadFile_MissingUploaderId_BadRequest() throws Exception {
        // When & Then
        mockMvc.perform(multipart("/api/files/upload")
                .file(testImageFile))
                .andExpect(status().isBadRequest());

        // Verify service was not called
        verifyNoInteractions(fileService);
    }

    @Test
    void uploadFile_EmptyUploaderId_BadRequest() throws Exception {
        // When & Then
        mockMvc.perform(multipart("/api/files/upload")
                .file(testImageFile)
                .param("uploaderId", ""))
                .andExpect(status().isBadRequest());

        // Verify service was not called
        verifyNoInteractions(fileService);
    }

    @Test
    void uploadFile_LongCategory_BadRequest() throws Exception {
        // Given
        String longCategory = "a".repeat(51); // 超过50字符限制

        // When & Then
        mockMvc.perform(multipart("/api/files/upload")
                .file(testImageFile)
                .param("uploaderId", "test-user")
                .param("category", longCategory))
                .andExpect(status().isBadRequest());

        // Verify service was not called
        verifyNoInteractions(fileService);
    }

    @Test
    void uploadFile_LongDescription_BadRequest() throws Exception {
        // Given
        String longDescription = "a".repeat(501); // 超过500字符限制

        // When & Then
        mockMvc.perform(multipart("/api/files/upload")
                .file(testImageFile)
                .param("uploaderId", "test-user")
                .param("description", longDescription))
                .andExpect(status().isBadRequest());

        // Verify service was not called
        verifyNoInteractions(fileService);
    }

    @Test
    void batchUploadFiles_Success() throws Exception {
        // Given
        MockMultipartFile file1 = new MockMultipartFile("files", "image1.jpg", "image/jpeg", "content1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "image2.jpg", "image/jpeg", "content2".getBytes());
        
        // 创建批量上传响应
        var batchResponse = new com.onecar.photoservice.dto.BatchUploadResponse("batch-123", 2);
        batchResponse.addSuccessFile(mockUploadResponse);
        batchResponse.addSuccessFile(mockUploadResponse);

        when(fileService.batchUploadFiles(any(), any(), eq("test-user")))
            .thenReturn(batchResponse);

        // When & Then
        mockMvc.perform(multipart("/api/files/batch-upload")
                .file(file1)
                .file(file2)
                .param("uploaderId", "test-user")
                .param("category", "gallery"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.batchId").value("batch-123"))
                .andExpect(jsonPath("$.data.totalFiles").value(2))
                .andExpect(jsonPath("$.data.successCount").value(2))
                .andExpected(jsonPath("$.data.failureCount").value(0));

        verify(fileService).batchUploadFiles(any(), eq("gallery"), eq("test-user"));
    }

    @Test
    void batchUploadFiles_EmptyFileArray_BadRequest() throws Exception {
        // When & Then
        mockMvc.perform(multipart("/api/files/batch-upload")
                .param("uploaderId", "test-user"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("上传文件列表不能为空"));

        verifyNoInteractions(fileService);
    }

    @Test
    void batchUploadFiles_TooManyFiles_BadRequest() throws Exception {
        // Given - 创建11个文件（超过限制）
        MockMultipartFile[] files = new MockMultipartFile[11];
        for (int i = 0; i < 11; i++) {
            files[i] = new MockMultipartFile("files", "image" + i + ".jpg", "image/jpeg", ("content" + i).getBytes());
        }

        // When & Then
        var requestBuilder = multipart("/api/files/batch-upload")
                .param("uploaderId", "test-user");
        
        for (MockMultipartFile file : files) {
            requestBuilder.file(file);
        }

        mockMvc.perform(requestBuilder)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("批量上传文件数量不能超过10个"));

        verifyNoInteractions(fileService);
    }

    @Test
    void checkDuplicate_Success() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/files/check-duplicate")
                .param("md5", "test-md5-hash")
                .param("userId", "test-user"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.exists").value(false))
                .andExpect(jsonPath("$.data.existingFileId").isEmpty());
    }

    @Test
    void checkDuplicate_MissingMd5_BadRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/files/check-duplicate")
                .param("userId", "test-user"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void checkDuplicate_EmptyMd5_BadRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/files/check-duplicate")
                .param("md5", "")
                .param("userId", "test-user"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getUploadStatus_Success() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/files/upload-status/batch-123")
                .param("userId", "test-user"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.batchId").value("batch-123"))
                .andExpect(jsonPath("$.data.status").value("completed"))
                .andExpect(jsonPath("$.data.progress").value(100));
    }

    @Test
    void getUploadStatus_MissingUserId_BadRequest() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/files/upload-status/batch-123"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancelUpload_Success() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/files/cancel-upload/batch-123")
                .param("userId", "test-user"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void cancelUpload_MissingUserId_BadRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/files/cancel-upload/batch-123"))
                .andExpect(status().isBadRequest());
    }
}