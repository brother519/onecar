package com.onecar.photoservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 统一API响应格式
 * 提供标准化的接口响应结构，包含状态码、消息和数据载荷
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "统一API响应格式")
public class ApiResponse<T> {

    /**
     * 响应状态码
     */
    @Schema(description = "响应状态码", example = "200")
    private Integer code;

    /**
     * 响应消息
     */
    @Schema(description = "响应消息", example = "操作成功")
    private String message;

    /**
     * 响应数据
     */
    @Schema(description = "响应数据")
    private T data;

    /**
     * 响应时间戳
     */
    @Schema(description = "响应时间戳", example = "2024-01-01T12:00:00")
    private LocalDateTime timestamp;

    /**
     * 请求追踪ID（用于问题排查）
     */
    @Schema(description = "请求追踪ID", example = "abc123")
    private String traceId;

    // 常用状态码常量
    public static final int SUCCESS_CODE = 200;
    public static final int CREATED_CODE = 201;
    public static final int BAD_REQUEST_CODE = 400;
    public static final int UNAUTHORIZED_CODE = 401;
    public static final int FORBIDDEN_CODE = 403;
    public static final int NOT_FOUND_CODE = 404;
    public static final int CONFLICT_CODE = 409;
    public static final int PAYLOAD_TOO_LARGE_CODE = 413;
    public static final int UNSUPPORTED_MEDIA_TYPE_CODE = 415;
    public static final int INTERNAL_SERVER_ERROR_CODE = 500;

    // 常用响应消息
    public static final String SUCCESS_MESSAGE = "操作成功";
    public static final String CREATED_MESSAGE = "创建成功";
    public static final String BAD_REQUEST_MESSAGE = "请求参数错误";
    public static final String UNAUTHORIZED_MESSAGE = "未授权访问";
    public static final String FORBIDDEN_MESSAGE = "访问被禁止";
    public static final String NOT_FOUND_MESSAGE = "资源不存在";
    public static final String CONFLICT_MESSAGE = "资源冲突";
    public static final String PAYLOAD_TOO_LARGE_MESSAGE = "文件大小超出限制";
    public static final String UNSUPPORTED_MEDIA_TYPE_MESSAGE = "不支持的文件类型";
    public static final String INTERNAL_SERVER_ERROR_MESSAGE = "服务器内部错误";

    // Constructors
    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiResponse(Integer code, String message) {
        this();
        this.code = code;
        this.message = message;
    }

    public ApiResponse(Integer code, String message, T data) {
        this(code, message);
        this.data = data;
    }

    // 静态工厂方法 - 成功响应
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(SUCCESS_CODE, SUCCESS_MESSAGE);
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(SUCCESS_CODE, SUCCESS_MESSAGE, data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(SUCCESS_CODE, message, data);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(CREATED_CODE, CREATED_MESSAGE, data);
    }

    // 静态工厂方法 - 错误响应
    public static <T> ApiResponse<T> error(Integer code, String message) {
        return new ApiResponse<>(code, message);
    }

    public static <T> ApiResponse<T> badRequest(String message) {
        return new ApiResponse<>(BAD_REQUEST_CODE, message);
    }

    public static <T> ApiResponse<T> unauthorized() {
        return new ApiResponse<>(UNAUTHORIZED_CODE, UNAUTHORIZED_MESSAGE);
    }

    public static <T> ApiResponse<T> unauthorized(String message) {
        return new ApiResponse<>(UNAUTHORIZED_CODE, message);
    }

    public static <T> ApiResponse<T> forbidden() {
        return new ApiResponse<>(FORBIDDEN_CODE, FORBIDDEN_MESSAGE);
    }

    public static <T> ApiResponse<T> forbidden(String message) {
        return new ApiResponse<>(FORBIDDEN_CODE, message);
    }

    public static <T> ApiResponse<T> notFound() {
        return new ApiResponse<>(NOT_FOUND_CODE, NOT_FOUND_MESSAGE);
    }

    public static <T> ApiResponse<T> notFound(String message) {
        return new ApiResponse<>(NOT_FOUND_CODE, message);
    }

    public static <T> ApiResponse<T> conflict(String message) {
        return new ApiResponse<>(CONFLICT_CODE, message);
    }

    public static <T> ApiResponse<T> payloadTooLarge() {
        return new ApiResponse<>(PAYLOAD_TOO_LARGE_CODE, PAYLOAD_TOO_LARGE_MESSAGE);
    }

    public static <T> ApiResponse<T> payloadTooLarge(String message) {
        return new ApiResponse<>(PAYLOAD_TOO_LARGE_CODE, message);
    }

    public static <T> ApiResponse<T> unsupportedMediaType() {
        return new ApiResponse<>(UNSUPPORTED_MEDIA_TYPE_CODE, UNSUPPORTED_MEDIA_TYPE_MESSAGE);
    }

    public static <T> ApiResponse<T> unsupportedMediaType(String message) {
        return new ApiResponse<>(UNSUPPORTED_MEDIA_TYPE_CODE, message);
    }

    public static <T> ApiResponse<T> internalServerError() {
        return new ApiResponse<>(INTERNAL_SERVER_ERROR_CODE, INTERNAL_SERVER_ERROR_MESSAGE);
    }

    public static <T> ApiResponse<T> internalServerError(String message) {
        return new ApiResponse<>(INTERNAL_SERVER_ERROR_CODE, message);
    }

    // 工具方法
    public boolean isSuccess() {
        return code != null && code >= 200 && code < 300;
    }

    public boolean isError() {
        return !isSuccess();
    }

    public ApiResponse<T> traceId(String traceId) {
        this.traceId = traceId;
        return this;
    }

    // Getters and Setters
    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    @Override
    public String toString() {
        return "ApiResponse{" +
                "code=" + code +
                ", message='" + message + '\'' +
                ", data=" + data +
                ", timestamp=" + timestamp +
                ", traceId='" + traceId + '\'' +
                '}';
    }
}