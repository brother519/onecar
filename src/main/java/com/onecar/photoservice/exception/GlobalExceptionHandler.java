package com.onecar.photoservice.exception;

import com.onecar.photoservice.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 全局异常处理器
 * 统一处理系统中的各种异常，返回标准化的错误响应
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理文件服务相关异常
     */
    @ExceptionHandler(FileServiceException.class)
    public ResponseEntity<ApiResponse<Void>> handleFileServiceException(
            FileServiceException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("文件服务异常 [{}]: {}", traceId, ex.getMessage(), ex);

        HttpStatus status = getHttpStatusByErrorCode(ex.getErrorCode());
        ApiResponse<Void> response = ApiResponse.<Void>error(status.value(), ex.getMessage())
                                               .traceId(traceId);

        return ResponseEntity.status(status).body(response);
    }

    /**
     * 处理文件上传大小超限异常
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("文件上传大小超限 [{}]: {}", traceId, ex.getMessage(), ex);

        ApiResponse<Void> response = ApiResponse.<Void>payloadTooLarge("上传文件大小超出限制")
                                               .traceId(traceId);

        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
    }

    /**
     * 处理文件上传相关异常
     */
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiResponse<Void>> handleMultipartException(
            MultipartException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("文件上传异常 [{}]: {}", traceId, ex.getMessage(), ex);

        String message = "文件上传失败";
        if (ex.getCause() instanceof MaxUploadSizeExceededException) {
            message = "上传文件大小超出限制";
        }

        ApiResponse<Void> response = ApiResponse.<Void>badRequest(message)
                                               .traceId(traceId);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理参数验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("参数验证异常 [{}]: {}", traceId, ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Map<String, String>> response = 
            ApiResponse.<Map<String, String>>badRequest("参数验证失败", errors)
                      .traceId(traceId);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理绑定异常
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleBindException(
            BindException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("参数绑定异常 [{}]: {}", traceId, ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Map<String, String>> response = 
            ApiResponse.<Map<String, String>>badRequest("参数绑定失败", errors)
                      .traceId(traceId);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理约束违反异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolationException(
            ConstraintViolationException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("约束违反异常 [{}]: {}", traceId, ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String fieldName = violation.getPropertyPath().toString();
            String errorMessage = violation.getMessage();
            errors.put(fieldName, errorMessage);
        }

        ApiResponse<Map<String, String>> response = 
            ApiResponse.<Map<String, String>>badRequest("参数约束验证失败", errors)
                      .traceId(traceId);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理缺少请求参数异常
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingServletRequestParameter(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("缺少请求参数 [{}]: {}", traceId, ex.getMessage());

        String message = String.format("缺少必需参数: %s", ex.getParameterName());
        ApiResponse<Void> response = ApiResponse.<Void>badRequest(message)
                                               .traceId(traceId);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理HTTP请求方法不支持异常
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpRequestMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("HTTP请求方法不支持 [{}]: {}", traceId, ex.getMessage());

        String message = String.format("不支持的请求方法: %s", ex.getMethod());
        ApiResponse<Void> response = ApiResponse.<Void>error(405, message)
                                               .traceId(traceId);

        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
    }

    /**
     * 处理媒体类型不支持异常
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("媒体类型不支持 [{}]: {}", traceId, ex.getMessage());

        ApiResponse<Void> response = ApiResponse.<Void>unsupportedMediaType("不支持的媒体类型")
                                               .traceId(traceId);

        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(response);
    }

    /**
     * 处理HTTP消息不可读异常
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("HTTP消息不可读 [{}]: {}", traceId, ex.getMessage());

        ApiResponse<Void> response = ApiResponse.<Void>badRequest("请求消息格式错误")
                                               .traceId(traceId);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("非法参数异常 [{}]: {}", traceId, ex.getMessage(), ex);

        ApiResponse<Void> response = ApiResponse.<Void>badRequest(ex.getMessage())
                                               .traceId(traceId);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理所有未捕获的异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(
            Exception ex, HttpServletRequest request) {
        
        String traceId = generateTraceId();
        logger.error("系统异常 [{}]: {}", traceId, ex.getMessage(), ex);

        ApiResponse<Void> response = ApiResponse.<Void>internalServerError("系统内部错误")
                                               .traceId(traceId);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * 根据错误代码获取HTTP状态码
     */
    private HttpStatus getHttpStatusByErrorCode(String errorCode) {
        if (errorCode == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return switch (errorCode) {
            case "FILE_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "FILE_ACCESS_DENIED" -> HttpStatus.FORBIDDEN;
            case "UNSUPPORTED_FILE_TYPE" -> HttpStatus.UNSUPPORTED_MEDIA_TYPE;
            case "FILE_SIZE_EXCEEDED" -> HttpStatus.PAYLOAD_TOO_LARGE;
            case "DUPLICATE_FILE" -> HttpStatus.CONFLICT;
            case "INVALID_FILE", "FILE_UPLOAD_ERROR" -> HttpStatus.BAD_REQUEST;
            case "INSUFFICIENT_STORAGE" -> HttpStatus.INSUFFICIENT_STORAGE;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }

    /**
     * 生成请求追踪ID
     */
    private String generateTraceId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    /**
     * 记录请求信息（用于调试）
     */
    private void logRequestInfo(HttpServletRequest request, String traceId) {
        logger.debug("请求信息 [{}]: URI={}, Method={}, RemoteAddr={}, UserAgent={}", 
                    traceId,
                    request.getRequestURI(),
                    request.getMethod(),
                    request.getRemoteAddr(),
                    request.getHeader("User-Agent"));
    }
}