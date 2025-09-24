package com.onecar.photoservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 批量上传响应DTO
 * 包含批量上传的汇总信息和每个文件的详细结果
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "批量上传响应")
public class BatchUploadResponse {

    @Schema(description = "批次ID", example = "batch_abc123")
    private String batchId;

    @Schema(description = "上传时间", example = "2024-01-01T12:00:00")
    private LocalDateTime uploadTime;

    @Schema(description = "总文件数", example = "5")
    private Integer totalFiles;

    @Schema(description = "成功上传数", example = "4")
    private Integer successCount;

    @Schema(description = "失败上传数", example = "1")
    private Integer failureCount;

    @Schema(description = "总文件大小（字节）", example = "5120000")
    private Long totalSize;

    @Schema(description = "成功上传的文件列表")
    private List<UploadResponse> successFiles;

    @Schema(description = "失败上传的文件列表")
    private List<UploadError> failureFiles;

    @Schema(description = "批量操作是否完全成功", example = "false")
    private Boolean allSuccess;

    /**
     * 上传错误信息
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "上传错误信息")
    public static class UploadError {
        @Schema(description = "原始文件名", example = "invalid.txt")
        private String fileName;

        @Schema(description = "错误代码", example = "UNSUPPORTED_FILE_TYPE")
        private String errorCode;

        @Schema(description = "错误信息", example = "不支持的文件类型")
        private String errorMessage;

        @Schema(description = "文件大小", example = "1024")
        private Long fileSize;

        public UploadError() {
        }

        public UploadError(String fileName, String errorCode, String errorMessage) {
            this.fileName = fileName;
            this.errorCode = errorCode;
            this.errorMessage = errorMessage;
        }

        public UploadError(String fileName, String errorCode, String errorMessage, Long fileSize) {
            this.fileName = fileName;
            this.errorCode = errorCode;
            this.errorMessage = errorMessage;
            this.fileSize = fileSize;
        }

        // Getters and Setters
        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public void setErrorCode(String errorCode) {
            this.errorCode = errorCode;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public Long getFileSize() {
            return fileSize;
        }

        public void setFileSize(Long fileSize) {
            this.fileSize = fileSize;
        }

        @Override
        public String toString() {
            return "UploadError{" +
                    "fileName='" + fileName + '\'' +
                    ", errorCode='" + errorCode + '\'' +
                    ", errorMessage='" + errorMessage + '\'' +
                    ", fileSize=" + fileSize +
                    '}';
        }
    }

    // Constructors
    public BatchUploadResponse() {
        this.uploadTime = LocalDateTime.now();
        this.successFiles = new ArrayList<>();
        this.failureFiles = new ArrayList<>();
        this.successCount = 0;
        this.failureCount = 0;
        this.totalSize = 0L;
    }

    public BatchUploadResponse(String batchId, Integer totalFiles) {
        this();
        this.batchId = batchId;
        this.totalFiles = totalFiles;
    }

    /**
     * 添加成功上传的文件
     */
    public void addSuccessFile(UploadResponse uploadResponse) {
        if (successFiles == null) {
            successFiles = new ArrayList<>();
        }
        successFiles.add(uploadResponse);
        successCount++;
        if (uploadResponse.getFileSize() != null) {
            totalSize += uploadResponse.getFileSize();
        }
        updateAllSuccessStatus();
    }

    /**
     * 添加失败上传的文件
     */
    public void addFailureFile(String fileName, String errorCode, String errorMessage) {
        addFailureFile(new UploadError(fileName, errorCode, errorMessage));
    }

    /**
     * 添加失败上传的文件
     */
    public void addFailureFile(String fileName, String errorCode, String errorMessage, Long fileSize) {
        addFailureFile(new UploadError(fileName, errorCode, errorMessage, fileSize));
    }

    /**
     * 添加失败上传的文件
     */
    public void addFailureFile(UploadError uploadError) {
        if (failureFiles == null) {
            failureFiles = new ArrayList<>();
        }
        failureFiles.add(uploadError);
        failureCount++;
        updateAllSuccessStatus();
    }

    /**
     * 更新全部成功状态
     */
    private void updateAllSuccessStatus() {
        this.allSuccess = (failureCount == 0 && successCount > 0);
    }

    /**
     * 获取成功率
     */
    public double getSuccessRate() {
        if (totalFiles == null || totalFiles == 0) {
            return 0.0;
        }
        return (successCount * 100.0) / totalFiles;
    }

    /**
     * 获取格式化的成功率
     */
    public String getFormattedSuccessRate() {
        return String.format("%.1f%%", getSuccessRate());
    }

    /**
     * 获取格式化的总文件大小
     */
    public String getFormattedTotalSize() {
        if (totalSize == null || totalSize == 0) {
            return "0 B";
        }

        if (totalSize < 1024) {
            return totalSize + " B";
        } else if (totalSize < 1024 * 1024) {
            return String.format("%.1f KB", totalSize / 1024.0);
        } else if (totalSize < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", totalSize / (1024.0 * 1024.0));
        } else {
            return String.format("%.1f GB", totalSize / (1024.0 * 1024.0 * 1024.0));
        }
    }

    /**
     * 检查是否有失败的文件
     */
    public boolean hasFailures() {
        return failureCount != null && failureCount > 0;
    }

    /**
     * 检查是否所有文件都成功
     */
    public boolean isAllSuccess() {
        return allSuccess != null && allSuccess;
    }

    // Getters and Setters
    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public LocalDateTime getUploadTime() {
        return uploadTime;
    }

    public void setUploadTime(LocalDateTime uploadTime) {
        this.uploadTime = uploadTime;
    }

    public Integer getTotalFiles() {
        return totalFiles;
    }

    public void setTotalFiles(Integer totalFiles) {
        this.totalFiles = totalFiles;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(Integer failureCount) {
        this.failureCount = failureCount;
    }

    public Long getTotalSize() {
        return totalSize;
    }

    public void setTotalSize(Long totalSize) {
        this.totalSize = totalSize;
    }

    public List<UploadResponse> getSuccessFiles() {
        return successFiles;
    }

    public void setSuccessFiles(List<UploadResponse> successFiles) {
        this.successFiles = successFiles;
    }

    public List<UploadError> getFailureFiles() {
        return failureFiles;
    }

    public void setFailureFiles(List<UploadError> failureFiles) {
        this.failureFiles = failureFiles;
    }

    public Boolean getAllSuccess() {
        return allSuccess;
    }

    public void setAllSuccess(Boolean allSuccess) {
        this.allSuccess = allSuccess;
    }

    @Override
    public String toString() {
        return "BatchUploadResponse{" +
                "batchId='" + batchId + '\'' +
                ", uploadTime=" + uploadTime +
                ", totalFiles=" + totalFiles +
                ", successCount=" + successCount +
                ", failureCount=" + failureCount +
                ", totalSize=" + totalSize +
                ", allSuccess=" + allSuccess +
                '}';
    }
}