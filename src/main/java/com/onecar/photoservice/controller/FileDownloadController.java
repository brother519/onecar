package com.onecar.photoservice.controller;

import com.onecar.photoservice.dto.ApiResponse;
import com.onecar.photoservice.dto.FileInfo;
import com.onecar.photoservice.service.FileService;
import com.onecar.photoservice.service.SecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 文件下载控制器
 * 处理文件下载、预览、信息查询等HTTP请求
 */
@RestController
@RequestMapping("/api/files")
@Tag(name = "文件下载", description = "文件下载和查询相关接口")
@Validated
public class FileDownloadController {

    private static final Logger logger = LoggerFactory.getLogger(FileDownloadController.class);

    // Range请求的正则表达式
    private static final Pattern RANGE_PATTERN = Pattern.compile("bytes=(?<start>\\d+)-(?<end>\\d*)");

    @Autowired
    private FileService fileService;

    @Autowired
    private SecurityService securityService;

    /**
     * 文件下载
     */
    @GetMapping("/download/{fileId}")
    @Operation(summary = "文件下载", description = "下载指定的文件，支持断点续传")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "下载成功"),
        @ApiResponse(responseCode = "206", description = "部分内容下载成功（断点续传）"),
        @ApiResponse(responseCode = "404", description = "文件不存在"),
        @ApiResponse(responseCode = "403", description = "访问被拒绝"),
        @ApiResponse(responseCode = "416", description = "请求范围无效"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<Resource> downloadFile(
            @Parameter(description = "文件ID", required = true)
            @PathVariable("fileId") String fileId,
            
            @Parameter(description = "用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId,
            
            @Parameter(description = "是否内联显示", example = "false")
            @RequestParam(value = "inline", defaultValue = "false") Boolean inline,
            
            @Parameter(description = "防盗链令牌")
            @RequestParam(value = "token", required = false) String token,
            
            HttpServletRequest request,
            HttpServletResponse response) {

        logger.info("文件下载请求: fileId={}, userId={}, inline={}, clientIP={}", 
                   fileId, userId, inline, getClientIP(request));

        try {
            // 防盗链验证
            if (StringUtils.hasText(token)) {
                String userAgent = request.getHeader("User-Agent");
                if (!securityService.validateAntiHotlinkToken(token, fileId, userAgent)) {
                    logger.warn("防盗链验证失败: fileId={}, token={}", fileId, token);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }

            // 获取文件下载信息
            FileService.FileDownloadInfo downloadInfo = fileService.getFileForDownload(fileId, userId);
            
            Path filePath = Paths.get(downloadInfo.getFilePath());
            if (!Files.exists(filePath)) {
                logger.error("物理文件不存在: {}", downloadInfo.getFilePath());
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(filePath);
            long fileLength = downloadInfo.getFileSize();

            // 处理Range请求（断点续传）
            String rangeHeader = request.getHeader(HttpHeaders.RANGE);
            if (StringUtils.hasText(rangeHeader)) {
                return handleRangeRequest(resource, rangeHeader, fileLength, downloadInfo, inline, response);
            }

            // 普通下载
            return buildDownloadResponse(resource, downloadInfo, inline, fileLength);

        } catch (Exception e) {
            logger.error("文件下载失败: fileId={}, userId={}", fileId, userId, e);
            throw e; // 由全局异常处理器处理
        }
    }

    /**
     * 缩略图下载
     */
    @GetMapping("/thumbnail/{fileId}")
    @Operation(summary = "缩略图下载", description = "下载文件的缩略图")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "下载成功"),
        @ApiResponse(responseCode = "404", description = "缩略图不存在"),
        @ApiResponse(responseCode = "403", description = "访问被拒绝"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<Resource> downloadThumbnail(
            @Parameter(description = "文件ID", required = true)
            @PathVariable("fileId") String fileId,
            
            @Parameter(description = "用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId,
            
            @Parameter(description = "缩略图尺寸", example = "300x300")
            @RequestParam(value = "size", defaultValue = "300x300") String size,
            
            HttpServletRequest request) {

        logger.debug("缩略图下载请求: fileId={}, userId={}, size={}", fileId, userId, size);

        try {
            // 权限检查
            if (!securityService.hasReadPermission(fileId, userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // 构建缩略图路径（简化实现）
            String thumbnailPath = buildThumbnailPath(fileId, size);
            
            Path filePath = Paths.get(thumbnailPath);
            if (!Files.exists(filePath)) {
                logger.warn("缩略图不存在: {}", thumbnailPath);
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(filePath);
            long fileLength = Files.size(filePath);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG);
            headers.setContentLength(fileLength);
            headers.setCacheControl("public, max-age=86400"); // 缓存1天

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            logger.error("缩略图下载失败: fileId={}, userId={}, size={}", fileId, userId, size, e);
            throw e;
        }
    }

    /**
     * 获取文件信息
     */
    @GetMapping("/{fileId}/info")
    @Operation(summary = "获取文件信息", description = "获取文件的详细信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "获取成功", 
                    content = @Content(schema = @Schema(implementation = FileInfo.class))),
        @ApiResponse(responseCode = "404", description = "文件不存在"),
        @ApiResponse(responseCode = "403", description = "访问被拒绝"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<ApiResponse<FileInfo>> getFileInfo(
            @Parameter(description = "文件ID", required = true)
            @PathVariable("fileId") String fileId,
            
            @Parameter(description = "用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId) {

        logger.debug("获取文件信息: fileId={}, userId={}", fileId, userId);

        try {
            FileInfo fileInfo = fileService.getFileInfo(fileId, userId);
            return ResponseEntity.ok(ApiResponse.success(fileInfo));

        } catch (Exception e) {
            logger.error("获取文件信息失败: fileId={}, userId={}", fileId, userId, e);
            throw e;
        }
    }

    /**
     * 分页查询用户文件
     */
    @GetMapping("/list")
    @Operation(summary = "分页查询用户文件", description = "分页获取用户上传的文件列表")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "查询成功"),
        @ApiResponse(responseCode = "400", description = "请求参数错误"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<ApiResponse<Page<FileInfo>>> getUserFiles(
            @Parameter(description = "用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId,
            
            @Parameter(description = "文件分类")
            @RequestParam(value = "category", required = false) String category,
            
            @PageableDefault(size = 20) Pageable pageable) {

        logger.debug("查询用户文件: userId={}, category={}, page={}", userId, category, pageable.getPageNumber());

        try {
            Page<FileInfo> files = fileService.getUserFiles(userId, category, pageable);
            return ResponseEntity.ok(ApiResponse.success(files));

        } catch (Exception e) {
            logger.error("查询用户文件失败: userId={}, category={}", userId, category, e);
            throw e;
        }
    }

    /**
     * 搜索文件
     */
    @GetMapping("/search")
    @Operation(summary = "搜索文件", description = "根据关键词搜索文件")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "搜索成功"),
        @ApiResponse(responseCode = "400", description = "请求参数错误"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<ApiResponse<Page<FileInfo>>> searchFiles(
            @Parameter(description = "用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId,
            
            @Parameter(description = "搜索关键词", required = true)
            @RequestParam("keyword")
            @NotBlank(message = "搜索关键词不能为空")
            String keyword,
            
            @PageableDefault(size = 20) Pageable pageable) {

        logger.debug("搜索文件: userId={}, keyword={}, page={}", userId, keyword, pageable.getPageNumber());

        try {
            Page<FileInfo> files = fileService.searchFiles(userId, keyword, pageable);
            return ResponseEntity.ok(ApiResponse.success(files));

        } catch (Exception e) {
            logger.error("搜索文件失败: userId={}, keyword={}", userId, keyword, e);
            throw e;
        }
    }

    /**
     * 删除文件
     */
    @DeleteMapping("/{fileId}")
    @Operation(summary = "删除文件", description = "删除指定的文件（软删除）")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "删除成功"),
        @ApiResponse(responseCode = "404", description = "文件不存在"),
        @ApiResponse(responseCode = "403", description = "无删除权限"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @Parameter(description = "文件ID", required = true)
            @PathVariable("fileId") String fileId,
            
            @Parameter(description = "用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId) {

        logger.info("删除文件请求: fileId={}, userId={}", fileId, userId);

        try {
            fileService.deleteFile(fileId, userId);
            return ResponseEntity.ok(ApiResponse.success());

        } catch (Exception e) {
            logger.error("删除文件失败: fileId={}, userId={}", fileId, userId, e);
            throw e;
        }
    }

    /**
     * 获取文件统计信息
     */
    @GetMapping("/stats")
    @Operation(summary = "获取文件统计信息", description = "获取用户的文件统计信息")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "获取成功"),
        @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public ResponseEntity<ApiResponse<FileService.FileStatsInfo>> getFileStats(
            @Parameter(description = "用户ID", required = true)
            @RequestParam("userId")
            @NotBlank(message = "用户ID不能为空")
            String userId) {

        logger.debug("获取文件统计: userId={}", userId);

        try {
            FileService.FileStatsInfo stats = fileService.getUserFileStats(userId);
            return ResponseEntity.ok(ApiResponse.success(stats));

        } catch (Exception e) {
            logger.error("获取文件统计失败: userId={}", userId, e);
            throw e;
        }
    }

    /**
     * 处理Range请求（断点续传）
     */
    private ResponseEntity<Resource> handleRangeRequest(Resource resource, String rangeHeader, 
                                                       long fileLength, FileService.FileDownloadInfo downloadInfo,
                                                       boolean inline, HttpServletResponse response) throws IOException {
        
        Matcher matcher = RANGE_PATTERN.matcher(rangeHeader);
        if (!matcher.matches()) {
            response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength);
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).build();
        }

        long start = Long.parseLong(matcher.group("start"));
        String endGroup = matcher.group("end");
        long end = StringUtils.hasText(endGroup) ? Long.parseLong(endGroup) : fileLength - 1;

        if (start >= fileLength || end >= fileLength || start > end) {
            response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength);
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).build();
        }

        long contentLength = end - start + 1;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(downloadInfo.getContentType()));
        headers.setContentLength(contentLength);
        headers.set(HttpHeaders.CONTENT_RANGE, String.format("bytes %d-%d/%d", start, end, fileLength));
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        
        if (!inline) {
            headers.setContentDispositionFormData("attachment", downloadInfo.getFileName());
        }

        // 创建部分内容的资源
        PartialResource partialResource = new PartialResource(resource, start, contentLength);

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .headers(headers)
                .body(partialResource);
    }

    /**
     * 构建下载响应
     */
    private ResponseEntity<Resource> buildDownloadResponse(Resource resource, 
                                                          FileService.FileDownloadInfo downloadInfo,
                                                          boolean inline, long fileLength) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(downloadInfo.getContentType()));
        headers.setContentLength(fileLength);
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        
        if (!inline) {
            headers.setContentDispositionFormData("attachment", downloadInfo.getFileName());
        }

        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }

    /**
     * 构建缩略图路径
     */
    private String buildThumbnailPath(String fileId, String size) {
        // 简化实现，实际应该从配置或服务中获取
        return String.format("./storage/cache/thumbnails/%s/thumb_%s.jpg", fileId, size);
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
     * 部分内容资源类（用于断点续传）
     */
    private static class PartialResource extends FileSystemResource {
        private final long start;
        private final long length;

        public PartialResource(Resource resource, long start, long length) {
            super(resource.getFile());
            this.start = start;
            this.length = length;
        }

        @Override
        public InputStream getInputStream() throws IOException {
            InputStream inputStream = super.getInputStream();
            inputStream.skip(start);
            return new LimitedInputStream(inputStream, length);
        }

        @Override
        public long contentLength() {
            return length;
        }
    }

    /**
     * 限制长度的输入流
     */
    private static class LimitedInputStream extends InputStream {
        private final InputStream inputStream;
        private long remaining;

        public LimitedInputStream(InputStream inputStream, long limit) {
            this.inputStream = inputStream;
            this.remaining = limit;
        }

        @Override
        public int read() throws IOException {
            if (remaining <= 0) {
                return -1;
            }
            int result = inputStream.read();
            if (result != -1) {
                remaining--;
            }
            return result;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (remaining <= 0) {
                return -1;
            }
            int toRead = (int) Math.min(len, remaining);
            int result = inputStream.read(b, off, toRead);
            if (result != -1) {
                remaining -= result;
            }
            return result;
        }

        @Override
        public void close() throws IOException {
            inputStream.close();
        }
    }
}