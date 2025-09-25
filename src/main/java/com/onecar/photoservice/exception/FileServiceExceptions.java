package com.onecar.photoservice.exception;

/**
 * 文件服务基础异常类
 * 所有业务异常的父类
 */
public class FileServiceException extends RuntimeException {

    private final String errorCode;

    public FileServiceException(String message) {
        super(message);
        this.errorCode = "FILE_SERVICE_ERROR";
    }

    public FileServiceException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public FileServiceException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "FILE_SERVICE_ERROR";
    }

    public FileServiceException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

/**
 * 文件不存在异常
 */
public class FileNotFoundException extends FileServiceException {
    public FileNotFoundException(String fileId) {
        super("FILE_NOT_FOUND", "文件不存在: " + fileId);
    }

    public FileNotFoundException(String fileId, Throwable cause) {
        super("FILE_NOT_FOUND", "文件不存在: " + fileId, cause);
    }
}

/**
 * 文件类型不支持异常
 */
public class UnsupportedFileTypeException extends FileServiceException {
    public UnsupportedFileTypeException(String fileType) {
        super("UNSUPPORTED_FILE_TYPE", "不支持的文件类型: " + fileType);
    }
}

/**
 * 文件大小超限异常
 */
public class FileSizeExceededException extends FileServiceException {
    public FileSizeExceededException(long fileSize, long maxSize) {
        super("FILE_SIZE_EXCEEDED", 
              String.format("文件大小超出限制: %d bytes (最大允许: %d bytes)", fileSize, maxSize));
    }
}

/**
 * 文件访问权限异常
 */
public class FileAccessDeniedException extends FileServiceException {
    public FileAccessDeniedException(String fileId, String userId) {
        super("FILE_ACCESS_DENIED", 
              String.format("用户 %s 没有访问文件 %s 的权限", userId, fileId));
    }
}

/**
 * 文件存储异常
 */
public class FileStorageException extends FileServiceException {
    public FileStorageException(String message) {
        super("FILE_STORAGE_ERROR", message);
    }

    public FileStorageException(String message, Throwable cause) {
        super("FILE_STORAGE_ERROR", message, cause);
    }
}

/**
 * 文件压缩异常
 */
public class FileCompressionException extends FileServiceException {
    public FileCompressionException(String message) {
        super("FILE_COMPRESSION_ERROR", message);
    }

    public FileCompressionException(String message, Throwable cause) {
        super("FILE_COMPRESSION_ERROR", message, cause);
    }
}

/**
 * 磁盘空间不足异常
 */
public class InsufficientStorageException extends FileServiceException {
    public InsufficientStorageException() {
        super("INSUFFICIENT_STORAGE", "磁盘空间不足");
    }

    public InsufficientStorageException(String message) {
        super("INSUFFICIENT_STORAGE", message);
    }
}

/**
 * 文件重复异常
 */
public class DuplicateFileException extends FileServiceException {
    private final String existingFileId;

    public DuplicateFileException(String existingFileId) {
        super("DUPLICATE_FILE", "文件已存在，ID: " + existingFileId);
        this.existingFileId = existingFileId;
    }

    public String getExistingFileId() {
        return existingFileId;
    }
}

/**
 * 无效文件异常
 */
public class InvalidFileException extends FileServiceException {
    public InvalidFileException(String message) {
        super("INVALID_FILE", message);
    }
}

/**
 * 文件处理异常
 */
public class FileProcessingException extends FileServiceException {
    public FileProcessingException(String message) {
        super("FILE_PROCESSING_ERROR", message);
    }

    public FileProcessingException(String message, Throwable cause) {
        super("FILE_PROCESSING_ERROR", message, cause);
    }
}

/**
 * 文件上传异常
 */
public class FileUploadException extends FileServiceException {
    public FileUploadException(String message) {
        super("FILE_UPLOAD_ERROR", message);
    }

    public FileUploadException(String message, Throwable cause) {
        super("FILE_UPLOAD_ERROR", message, cause);
    }
}

/**
 * 文件下载异常
 */
public class FileDownloadException extends FileServiceException {
    public FileDownloadException(String message) {
        super("FILE_DOWNLOAD_ERROR", message);
    }

    public FileDownloadException(String message, Throwable cause) {
        super("FILE_DOWNLOAD_ERROR", message, cause);
    }
}