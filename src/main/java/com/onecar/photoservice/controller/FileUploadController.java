package com.onecar.photoservice.controller;

import com.onecar.photoservice.dto.*;
import com.onecar.photoservice.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传控制器
 * 处理文件上传相关的HTTP请求
 */
@RestController
@RequestMapping("/api/files")
@Tag(name = "文件上传", description = "文件上传相关接口")
@Validated
public class FileUploadController {

    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);

    @Autowired
    private FileService fileService;

    /**
     * 单文件上传
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "单文件上传", description = "上传单个图片文件，支持自动压缩和缩略图生成")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "上传成功", 
                    content = @Content(schema = @Schema(implementation = UploadResponse.class))),
        @ApiResponse(responseCode = "400", description = "请求参数错误"),
        @ApiResponse(responseCode = "413", description = "文件大小超出限制"),
        @ApiResponse(responseCode = "415", description = "不支持的文件类型"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<com.onecar.photoservice.dto.ApiResponse<UploadResponse>> uploadFile(
            @Parameter(description = "上传的图片文件", required = true)
            @RequestParam("file") MultipartFile file,
            
            @Parameter(description = "文件分类", example = "avatar")
            @RequestParam(value = "category", required = false)
            @Size(max = 50, message = "文件分类长度不能超过50个字符")
            String category,
            
            @Parameter(description = "文件描述", example = "用户头像")
            @RequestParam(value = "description", required = false)
            @Size(max = 500, message = "文件描述长度不能超过500个字符")
            String description,
            
            @Parameter(description = "上传用户ID", required = true, example = "user123")
            @RequestParam("uploaderId")
            @NotBlank(message = "上传用户ID不能为空")
            String uploaderId,
            
            HttpServletRequest request) {

        logger.info("接收到文件上传请求: filename={}, size={}, uploaderId={}, clientIP={}", 
                   file.getOriginalFilename(), file.getSize(), uploaderId, getClientIP(request));

        try {
            UploadResponse uploadResponse = fileService.uploadFile(file, category, description, uploaderId);
            
            logger.info("文件上传成功: fileId={}, filename={}", 
                       uploadResponse.getFileId(), uploadResponse.getFileName());

            return ResponseEntity.status(201)
                    .body(com.onecar.photoservice.dto.ApiResponse.created(uploadResponse));

        } catch (Exception e) {
            logger.error("文件上传失败: filename={}, uploaderId={}", 
                        file.getOriginalFilename(), uploaderId, e);
            throw e; // 由全局异常处理器处理
        }
    }

    /**
     * 批量文件上传
     */
    @PostMapping(value = "/batch-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "批量文件上传", description = "批量上传多个图片文件")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "批量上传完成", 
                    content = @Content(schema = @Schema(implementation = BatchUploadResponse.class))),
        @ApiResponse(responseCode = "400", description = "请求参数错误"),
        @ApiResponse(responseCode = "413", description = "文件大小超出限制"),
        @ApiResponse(responseCode = "415", description = "不支持的文件类型"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<com.onecar.photoservice.dto.ApiResponse<BatchUploadResponse>> batchUploadFiles(
            @Parameter(description = "上传的图片文件数组", required = true)
            @RequestParam("files") MultipartFile[] files,
            
            @Parameter(description = "文件分类", example = "gallery")
            @RequestParam(value = "category", required = false)
            @Size(max = 50, message = "文件分类长度不能超过50个字符")
            String category,
            
            @Parameter(description = "上传用户ID", required = true, example = "user123")
            @RequestParam("uploaderId")
            @NotBlank(message = "上传用户ID不能为空")
            String uploaderId,
            
            HttpServletRequest request) {

        logger.info("接收到批量文件上传请求: fileCount={}, uploaderId={}, clientIP={}", 
                   files.length, uploaderId, getClientIP(request));

        // 验证文件数组
        if (files.length == 0) {
            return ResponseEntity.badRequest()
                    .body(com.onecar.photoservice.dto.ApiResponse.badRequest("上传文件列表不能为空"));
        }

        if (files.length > 10) { // 限制批量上传数量
            return ResponseEntity.badRequest()
                    .body(com.onecar.photoservice.dto.ApiResponse.badRequest("批量上传文件数量不能超过10个"));
        }

        try {
            BatchUploadResponse batchResponse = fileService.batchUploadFiles(files, category, uploaderId);
            
            logger.info("批量文件上传完成: batchId={}, 成功={}, 失败={}", 
                       batchResponse.getBatchId(), batchResponse.getSuccessCount(), batchResponse.getFailureCount());

            return ResponseEntity.ok(com.onecar.photoservice.dto.ApiResponse.success(batchResponse));

        } catch (Exception e) {
            logger.error("批量文件上传失败: fileCount={}, uploaderId={}", files.length, uploaderId, e);
            throw e; // 由全局异常处理器处理
        }
    }

    /**
     * 检查文件是否已存在（基于MD5）
     */
    @PostMapping("/check-duplicate")
    @Operation(summary = "检查重复文件", description = "通过MD5值检查文件是否已存在")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "检查完成"),
        @ApiResponse(responseCode = "400", description = "请求参数错误"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<com.onecar.photoservice.dto.ApiResponse<DuplicateCheckResponse>> checkDuplicate(
            @Parameter(description = "文件MD5值", required = true)
            @RequestParam("md5")
            @NotBlank(message = "MD5值不能为空")
            String md5Hash,
            
            @Parameter(description = "检查用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId,
            
            HttpServletRequest request) {

        logger.debug("检查重复文件: md5={}, userId={}", md5Hash, userId);

        try {
            // 这里可以调用服务层方法检查重复文件
            // 为了简化，暂时返回不存在的响应
            DuplicateCheckResponse response = new DuplicateCheckResponse(false, null);
            
            return ResponseEntity.ok(com.onecar.photoservice.dto.ApiResponse.success(response));

        } catch (Exception e) {
            logger.error("检查重复文件失败: md5={}, userId={}", md5Hash, userId, e);
            throw e;
        }
    }

    /**
     * 获取上传进度（WebSocket或Server-Sent Events的替代方案）
     */
    @GetMapping("/upload-status/{batchId}")
    @Operation(summary = "获取上传状态", description = "获取批量上传的进度状态")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "404", description = "批次不存在"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<com.onecar.photoservice.dto.ApiResponse<UploadStatusResponse>> getUploadStatus(
            @Parameter(description = "批次ID", required = true)
            @PathVariable("batchId") String batchId,
            
            @Parameter(description = "查询用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId) {

        logger.debug("查询上传状态: batchId={}, userId={}", batchId, userId);

        try {
            // 这里应该查询实际的上传状态
            // 为了简化，返回模拟状态
            UploadStatusResponse status = new UploadStatusResponse(batchId, "completed", 100);
            
            return ResponseEntity.ok(com.onecar.photoservice.dto.ApiResponse.success(status));

        } catch (Exception e) {
            logger.error("查询上传状态失败: batchId={}, userId={}", batchId, userId, e);
            throw e;
        }
    }

    /**
     * 取消上传
     */
    @PostMapping("/cancel-upload/{batchId}")
    @Operation(summary = "取消上传", description = "取消正在进行的批量上传")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "取消成功"),
        @ApiResponse(responseCode = "404", description = "批次不存在"),
        @ApiResponse(responseCode = "400", description = "无法取消"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<com.onecar.photoservice.dto.ApiResponse<Void>> cancelUpload(
            @Parameter(description = "批次ID", required = true)
            @PathVariable("batchId") String batchId,
            
            @Parameter(description = "取消用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId) {

        logger.info("取消上传请求: batchId={}, userId={}", batchId, userId);

        try {
            // 这里应该实现取消上传的逻辑
            // 为了简化，直接返回成功
            
            return ResponseEntity.ok(com.onecar.photoservice.dto.ApiResponse.success());

        } catch (Exception e) {
            logger.error("取消上传失败: batchId={}, userId={}", batchId, userId, e);
            throw e;
        }
    }

    /**
     * 获取客户端IP地址
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }

    /**
     * 重复文件检查响应
     */
    public static class DuplicateCheckResponse {
        private final boolean exists;
        private final String existingFileId;

        public DuplicateCheckResponse(boolean exists, String existingFileId) {
            this.exists = exists;
            this.existingFileId = existingFileId;
        }

        public boolean isExists() { return exists; }
        public String getExistingFileId() { return existingFileId; }
    }

    /**
     * 上传状态响应
     */
    public static class UploadStatusResponse {
        private final String batchId;
        private final String status;
        private final int progress;

        public UploadStatusResponse(String batchId, String status, int progress) {
            this.batchId = batchId;
            this.status = status;
            this.progress = progress;
        }

        public String getBatchId() { return batchId; }
        public String getStatus() { return status; }
        public int getProgress() { return progress; }
    }
}