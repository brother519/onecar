package com.onecar.photoservice.service;

import com.onecar.photoservice.entity.FileMetadata;
import com.onecar.photoservice.repository.FileMetadataRepository;
import com.onecar.photoservice.util.FileUtils;
import com.onecar.photoservice.util.ImageUtils;
import com.onecar.photoservice.exception.FileCompressionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * 图片压缩服务类
 * 提供异步图片压缩、缩略图生成等功能
 */
@Service
public class CompressionService {

    private static final Logger logger = LoggerFactory.getLogger(CompressionService.class);

    @Autowired
    private FileMetadataRepository fileMetadataRepository;

    @Value("${app.file.cache-path}")
    private String cachePath;

    @Value("${app.file.auto-compress-threshold}")
    private long autoCompressThreshold;

    @Value("${app.file.compression-quality}")
    private double compressionQuality;

    @Value("${app.file.max-image-width}")
    private int maxImageWidth;

    @Value("${app.file.max-image-height}")
    private int maxImageHeight;

    @Value("${app.file.thumbnail-sizes}")
    private String thumbnailSizes;

    /**
     * 异步压缩图片
     */
    @Async
    public CompletableFuture<Void> compressImageAsync(String fileId, String originalPath) {
        return CompletableFuture.runAsync(() -> {
            try {
                compressImage(fileId, originalPath);
            } catch (Exception e) {
                logger.error("异步压缩图片失败: fileId={}, path={}", fileId, originalPath, e);
            }
        });
    }

    /**
     * 异步生成缩略图
     */
    @Async
    public CompletableFuture<Void> generateThumbnailsAsync(String fileId, String originalPath) {
        return CompletableFuture.runAsync(() -> {
            try {
                generateThumbnails(fileId, originalPath);
            } catch (Exception e) {
                logger.error("异步生成缩略图失败: fileId={}, path={}", fileId, originalPath, e);
            }
        });
    }

    /**
     * 压缩图片
     */
    public ImageUtils.CompressionResult compressImage(String fileId, String originalPath) {
        try {
            logger.info("开始压缩图片: fileId={}, path={}", fileId, originalPath);

            // 检查是否需要压缩
            if (!ImageUtils.needsCompression(originalPath, autoCompressThreshold)) {
                logger.debug("图片无需压缩: fileId={}", fileId);
                return null;
            }

            // 生成压缩后的文件路径
            String compressedPath = generateCompressedPath(originalPath, fileId);

            // 执行压缩
            ImageUtils.CompressionResult result = ImageUtils.compressImage(
                originalPath, compressedPath, compressionQuality, maxImageWidth, maxImageHeight
            );

            // 更新文件元数据
            updateFileMetadataAfterCompression(fileId, result);

            logger.info("图片压缩完成: fileId={}, 原始大小={}, 压缩后大小={}, 压缩率={:.1f}%",
                       fileId, result.getOriginalSize(), result.getCompressedSize(), result.getCompressionRatio());

            return result;

        } catch (IOException e) {
            logger.error("压缩图片失败: fileId={}, path={}", fileId, originalPath, e);
            throw new FileCompressionException("图片压缩失败: " + e.getMessage(), e);
        }
    }

    /**
     * 生成缩略图
     */
    public List<String> generateThumbnails(String fileId, String originalPath) {
        try {
            logger.info("开始生成缩略图: fileId={}, path={}", fileId, originalPath);

            // 解析缩略图尺寸配置
            List<ImageUtils.ImageDimension> dimensions = parseThumbnailSizes();

            // 生成缩略图目录
            String thumbnailDir = generateThumbnailDirectory(fileId);

            // 生成多种尺寸的缩略图
            List<String> thumbnailPaths = ImageUtils.generateMultipleThumbnails(
                originalPath, thumbnailDir, dimensions
            );

            // 更新文件元数据
            updateFileMetadataWithThumbnails(fileId, thumbnailPaths);

            logger.info("缩略图生成完成: fileId={}, 数量={}", fileId, thumbnailPaths.size());

            return thumbnailPaths;

        } catch (IOException e) {
            logger.error("生成缩略图失败: fileId={}, path={}", fileId, originalPath, e);
            throw new FileCompressionException("缩略图生成失败: " + e.getMessage(), e);
        }
    }

    /**
     * 生成指定尺寸的缩略图
     */
    public String generateThumbnail(String fileId, String originalPath, int width, int height) {
        try {
            logger.debug("生成指定尺寸缩略图: fileId={}, size={}x{}", fileId, width, height);

            String thumbnailDir = generateThumbnailDirectory(fileId);
            String thumbnailName = String.format("thumb_%dx%d.jpg", width, height);
            String thumbnailPath = Paths.get(thumbnailDir, thumbnailName).toString();

            return ImageUtils.generateThumbnail(originalPath, thumbnailPath, width, height);

        } catch (IOException e) {
            logger.error("生成指定尺寸缩略图失败: fileId={}, size={}x{}", fileId, width, height, e);
            throw new FileCompressionException("缩略图生成失败: " + e.getMessage(), e);
        }
    }

    /**
     * 批量压缩图片
     */
    @Async
    public CompletableFuture<Void> batchCompressImagesAsync(List<String> fileIds) {
        return CompletableFuture.runAsync(() -> {
            logger.info("开始批量压缩图片，数量: {}", fileIds.size());

            int successCount = 0;
            int failureCount = 0;

            for (String fileId : fileIds) {
                try {
                    Optional<FileMetadata> metadataOpt = fileMetadataRepository.findById(fileId);
                    if (metadataOpt.isPresent() && metadataOpt.get().isImage()) {
                        FileMetadata metadata = metadataOpt.get();
                        compressImage(fileId, metadata.getFilePath());
                        successCount++;
                    }
                } catch (Exception e) {
                    logger.error("批量压缩中文件 {} 失败", fileId, e);
                    failureCount++;
                }
            }

            logger.info("批量压缩完成: 成功={}, 失败={}", successCount, failureCount);
        });
    }

    /**
     * 优化图片格式
     */
    public String optimizeImageFormat(String fileId, String originalPath) {
        try {
            logger.debug("优化图片格式: fileId={}", fileId);

            // 检查是否有透明度
            boolean hasTransparency = ImageUtils.hasTransparency(originalPath);
            
            // 获取原始格式
            String originalFormat = FileUtils.getFileExtension(originalPath);
            
            // 确定最优输出格式
            String optimalFormat = ImageUtils.getOptimalOutputFormat(originalFormat, hasTransparency);

            // 如果格式相同，不需要转换
            if (optimalFormat.equalsIgnoreCase(originalFormat)) {
                return originalPath;
            }

            // 生成转换后的文件路径
            String optimizedPath = generateOptimizedPath(originalPath, fileId, optimalFormat);

            // 执行格式转换
            return ImageUtils.convertImageFormat(originalPath, optimizedPath, optimalFormat);

        } catch (IOException e) {
            logger.error("优化图片格式失败: fileId={}", fileId, e);
            throw new FileCompressionException("图片格式优化失败: " + e.getMessage(), e);
        }
    }

    /**
     * 清理过期的压缩文件和缓存
     */
    public void cleanupExpiredFiles() {
        try {
            logger.info("开始清理过期的压缩文件和缓存");

            // 清理压缩文件（这里实现清理逻辑）
            // 可以根据最后访问时间来决定是否删除

            logger.info("过期文件清理完成");

        } catch (Exception e) {
            logger.error("清理过期文件失败", e);
        }
    }

    /**
     * 获取图片压缩统计信息
     */
    public CompressionStats getCompressionStats() {
        try {
            // 查询压缩相关统计信息（需要根据实际需求实现）
            long totalCompressed = 0; // 实际实现中查询数据库
            long totalSizeSaved = 0;
            double avgCompressionRatio = 0.0;

            return new CompressionStats(totalCompressed, totalSizeSaved, avgCompressionRatio);

        } catch (Exception e) {
            logger.error("获取压缩统计信息失败", e);
            return new CompressionStats(0, 0, 0.0);
        }
    }

    /**
     * 生成压缩后的文件路径
     */
    private String generateCompressedPath(String originalPath, String fileId) {
        String fileName = FileUtils.getFileNameWithoutExtension(originalPath);
        String extension = FileUtils.getFileExtension(originalPath);
        String compressedDir = Paths.get(cachePath, "compressed", fileId).toString();
        
        try {
            FileUtils.ensureDirectoryExists(compressedDir);
        } catch (IOException e) {
            logger.error("创建压缩目录失败: {}", compressedDir, e);
        }

        return Paths.get(compressedDir, fileName + "_compressed." + extension).toString();
    }

    /**
     * 生成缩略图目录
     */
    private String generateThumbnailDirectory(String fileId) {
        String thumbnailDir = Paths.get(cachePath, "thumbnails", fileId).toString();
        
        try {
            FileUtils.ensureDirectoryExists(thumbnailDir);
        } catch (IOException e) {
            logger.error("创建缩略图目录失败: {}", thumbnailDir, e);
        }

        return thumbnailDir;
    }

    /**
     * 生成优化后的文件路径
     */
    private String generateOptimizedPath(String originalPath, String fileId, String newFormat) {
        String fileName = FileUtils.getFileNameWithoutExtension(originalPath);
        String optimizedDir = Paths.get(cachePath, "optimized", fileId).toString();
        
        try {
            FileUtils.ensureDirectoryExists(optimizedDir);
        } catch (IOException e) {
            logger.error("创建优化目录失败: {}", optimizedDir, e);
        }

        return Paths.get(optimizedDir, fileName + "_optimized." + newFormat).toString();
    }

    /**
     * 解析缩略图尺寸配置
     */
    private List<ImageUtils.ImageDimension> parseThumbnailSizes() {
        try {
            return Arrays.stream(thumbnailSizes.split(","))
                         .map(String::trim)
                         .map(this::parseDimension)
                         .toList();
        } catch (Exception e) {
            logger.warn("解析缩略图尺寸配置失败，使用默认尺寸", e);
            return List.of(
                new ImageUtils.ImageDimension(150, 150),
                new ImageUtils.ImageDimension(300, 300),
                new ImageUtils.ImageDimension(600, 600)
            );
        }
    }

    /**
     * 解析单个尺寸字符串
     */
    private ImageUtils.ImageDimension parseDimension(String sizeStr) {
        String[] parts = sizeStr.split("x");
        if (parts.length != 2) {
            throw new IllegalArgumentException("无效的尺寸格式: " + sizeStr);
        }
        
        int width = Integer.parseInt(parts[0]);
        int height = Integer.parseInt(parts[1]);
        
        return new ImageUtils.ImageDimension(width, height);
    }

    /**
     * 更新文件元数据（压缩后）
     */
    private void updateFileMetadataAfterCompression(String fileId, ImageUtils.CompressionResult result) {
        try {
            Optional<FileMetadata> metadataOpt = fileMetadataRepository.findById(fileId);
            if (metadataOpt.isPresent()) {
                FileMetadata metadata = metadataOpt.get();
                
                // 更新文件路径和大小（如果选择替换原文件）
                // metadata.setFilePath(result.getOutputPath());
                // metadata.setFileSize(result.getCompressedSize());
                
                // 更新图片尺寸
                ImageUtils.ImageDimension compressedDimension = result.getCompressedDimension();
                metadata.setImageWidth(compressedDimension.getWidth());
                metadata.setImageHeight(compressedDimension.getHeight());
                
                fileMetadataRepository.save(metadata);
            }
        } catch (Exception e) {
            logger.error("更新文件元数据失败: fileId={}", fileId, e);
        }
    }

    /**
     * 更新文件元数据（添加缩略图信息）
     */
    private void updateFileMetadataWithThumbnails(String fileId, List<String> thumbnailPaths) {
        try {
            Optional<FileMetadata> metadataOpt = fileMetadataRepository.findById(fileId);
            if (metadataOpt.isPresent() && !thumbnailPaths.isEmpty()) {
                FileMetadata metadata = metadataOpt.get();
                
                // 保存主缩略图路径
                metadata.setThumbnailPath(thumbnailPaths.get(0));
                
                fileMetadataRepository.save(metadata);
            }
        } catch (Exception e) {
            logger.error("更新缩略图元数据失败: fileId={}", fileId, e);
        }
    }

    /**
     * 压缩统计信息
     */
    public static class CompressionStats {
        private final long totalCompressed;
        private final long totalSizeSaved;
        private final double avgCompressionRatio;

        public CompressionStats(long totalCompressed, long totalSizeSaved, double avgCompressionRatio) {
            this.totalCompressed = totalCompressed;
            this.totalSizeSaved = totalSizeSaved;
            this.avgCompressionRatio = avgCompressionRatio;
        }

        public long getTotalCompressed() { return totalCompressed; }
        public long getTotalSizeSaved() { return totalSizeSaved; }
        public double getAvgCompressionRatio() { return avgCompressionRatio; }
    }
}