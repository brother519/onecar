package com.onecar.photoservice.util;

import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * 图片处理工具类
 * 提供图片压缩、缩略图生成、格式转换等功能
 */
public class ImageUtils {

    private static final Logger logger = LoggerFactory.getLogger(ImageUtils.class);

    // 默认压缩质量
    private static final double DEFAULT_COMPRESSION_QUALITY = 0.8;
    
    // 默认最大尺寸
    private static final int DEFAULT_MAX_WIDTH = 4096;
    private static final int DEFAULT_MAX_HEIGHT = 4096;
    
    // 支持的图片格式
    private static final String[] SUPPORTED_FORMATS = {"jpg", "jpeg", "png", "gif", "webp", "bmp"};

    /**
     * 图片尺寸信息
     */
    public static class ImageDimension {
        private final int width;
        private final int height;

        public ImageDimension(int width, int height) {
            this.width = width;
            this.height = height;
        }

        public int getWidth() { return width; }
        public int getHeight() { return height; }
        
        @Override
        public String toString() {
            return width + "x" + height;
        }
    }

    /**
     * 图片压缩结果
     */
    public static class CompressionResult {
        private final String outputPath;
        private final long originalSize;
        private final long compressedSize;
        private final ImageDimension originalDimension;
        private final ImageDimension compressedDimension;

        public CompressionResult(String outputPath, long originalSize, long compressedSize, 
                               ImageDimension originalDimension, ImageDimension compressedDimension) {
            this.outputPath = outputPath;
            this.originalSize = originalSize;
            this.compressedSize = compressedSize;
            this.originalDimension = originalDimension;
            this.compressedDimension = compressedDimension;
        }

        public String getOutputPath() { return outputPath; }
        public long getOriginalSize() { return originalSize; }
        public long getCompressedSize() { return compressedSize; }
        public ImageDimension getOriginalDimension() { return originalDimension; }
        public ImageDimension getCompressedDimension() { return compressedDimension; }
        
        public double getCompressionRatio() {
            if (originalSize == 0) return 0;
            return ((double) (originalSize - compressedSize) / originalSize) * 100;
        }
    }

    /**
     * 获取图片尺寸信息
     */
    public static ImageDimension getImageDimension(String imagePath) throws IOException {
        try {
            BufferedImage image = ImageIO.read(new File(imagePath));
            if (image == null) {
                throw new IOException("无法读取图片文件: " + imagePath);
            }
            return new ImageDimension(image.getWidth(), image.getHeight());
        } catch (IOException e) {
            logger.error("获取图片尺寸失败: {}", imagePath, e);
            throw e;
        }
    }

    /**
     * 获取图片尺寸信息（从输入流）
     */
    public static ImageDimension getImageDimension(InputStream inputStream) throws IOException {
        try {
            BufferedImage image = ImageIO.read(inputStream);
            if (image == null) {
                throw new IOException("无法从输入流读取图片");
            }
            return new ImageDimension(image.getWidth(), image.getHeight());
        } catch (IOException e) {
            logger.error("从输入流获取图片尺寸失败", e);
            throw e;
        }
    }

    /**
     * 检查是否需要压缩
     */
    public static boolean needsCompression(String imagePath, long sizeThreshold) throws IOException {
        long fileSize = Files.size(Paths.get(imagePath));
        if (fileSize > sizeThreshold) {
            return true;
        }

        ImageDimension dimension = getImageDimension(imagePath);
        return dimension.getWidth() > DEFAULT_MAX_WIDTH || dimension.getHeight() > DEFAULT_MAX_HEIGHT;
    }

    /**
     * 压缩图片（自动选择最佳参数）
     */
    public static CompressionResult compressImage(String inputPath, String outputPath, 
                                                 long sizeThreshold) throws IOException {
        ImageDimension originalDimension = getImageDimension(inputPath);
        long originalSize = Files.size(Paths.get(inputPath));

        if (!needsCompression(inputPath, sizeThreshold)) {
            // 不需要压缩，直接复制文件
            FileUtils.copyFile(inputPath, outputPath);
            return new CompressionResult(outputPath, originalSize, originalSize, 
                                       originalDimension, originalDimension);
        }

        return compressImage(inputPath, outputPath, DEFAULT_COMPRESSION_QUALITY, 
                           DEFAULT_MAX_WIDTH, DEFAULT_MAX_HEIGHT);
    }

    /**
     * 压缩图片（指定参数）
     */
    public static CompressionResult compressImage(String inputPath, String outputPath, 
                                                 double quality, int maxWidth, int maxHeight) throws IOException {
        try {
            ImageDimension originalDimension = getImageDimension(inputPath);
            long originalSize = Files.size(Paths.get(inputPath));

            FileUtils.ensureParentDirectoryExists(outputPath);

            // 计算新尺寸（保持宽高比）
            ImageDimension newDimension = calculateNewDimension(originalDimension, maxWidth, maxHeight);

            // 执行压缩
            Thumbnails.of(inputPath)
                     .size(newDimension.getWidth(), newDimension.getHeight())
                     .outputQuality(quality)
                     .toFile(outputPath);

            long compressedSize = Files.size(Paths.get(outputPath));

            logger.debug("图片压缩完成: {} -> {}, 原始大小: {}bytes, 压缩后: {}bytes, 压缩率: {:.1f}%",
                        inputPath, outputPath, originalSize, compressedSize,
                        ((double)(originalSize - compressedSize) / originalSize) * 100);

            return new CompressionResult(outputPath, originalSize, compressedSize, 
                                       originalDimension, newDimension);

        } catch (IOException e) {
            logger.error("图片压缩失败: {} -> {}", inputPath, outputPath, e);
            throw e;
        }
    }

    /**
     * 生成缩略图
     */
    public static String generateThumbnail(String inputPath, String outputPath, 
                                         int width, int height) throws IOException {
        try {
            FileUtils.ensureParentDirectoryExists(outputPath);

            Thumbnails.of(inputPath)
                     .size(width, height)
                     .outputQuality(DEFAULT_COMPRESSION_QUALITY)
                     .toFile(outputPath);

            logger.debug("缩略图生成完成: {} -> {} ({}x{})", inputPath, outputPath, width, height);
            return outputPath;

        } catch (IOException e) {
            logger.error("生成缩略图失败: {} -> {} ({}x{})", inputPath, outputPath, width, height, e);
            throw e;
        }
    }

    /**
     * 批量生成多种尺寸的缩略图
     */
    public static List<String> generateMultipleThumbnails(String inputPath, String outputDir, 
                                                         List<ImageDimension> sizes) throws IOException {
        List<String> thumbnailPaths = new ArrayList<>();
        String baseName = FileUtils.getFileNameWithoutExtension(new File(inputPath).getName());
        String extension = FileUtils.getFileExtension(new File(inputPath).getName());

        for (ImageDimension size : sizes) {
            String thumbnailName = String.format("%s_%dx%d.%s", baseName, 
                                                size.getWidth(), size.getHeight(), extension);
            String thumbnailPath = Paths.get(outputDir, thumbnailName).toString();

            generateThumbnail(inputPath, thumbnailPath, size.getWidth(), size.getHeight());
            thumbnailPaths.add(thumbnailPath);
        }

        return thumbnailPaths;
    }

    /**
     * 生成默认尺寸的缩略图
     */
    public static List<String> generateDefaultThumbnails(String inputPath, String outputDir) throws IOException {
        List<ImageDimension> defaultSizes = List.of(
            new ImageDimension(150, 150),
            new ImageDimension(300, 300),
            new ImageDimension(600, 600)
        );

        return generateMultipleThumbnails(inputPath, outputDir, defaultSizes);
    }

    /**
     * 转换图片格式
     */
    public static String convertImageFormat(String inputPath, String outputPath, 
                                          String targetFormat) throws IOException {
        try {
            FileUtils.ensureParentDirectoryExists(outputPath);

            Thumbnails.of(inputPath)
                     .scale(1.0)
                     .outputFormat(targetFormat)
                     .toFile(outputPath);

            logger.debug("图片格式转换完成: {} -> {} (格式: {})", inputPath, outputPath, targetFormat);
            return outputPath;

        } catch (IOException e) {
            logger.error("图片格式转换失败: {} -> {} (格式: {})", inputPath, outputPath, targetFormat, e);
            throw e;
        }
    }

    /**
     * 添加水印
     */
    public static String addWatermark(String inputPath, String watermarkPath, String outputPath, 
                                    float opacity) throws IOException {
        try {
            FileUtils.ensureParentDirectoryExists(outputPath);

            BufferedImage watermark = ImageIO.read(new File(watermarkPath));

            Thumbnails.of(inputPath)
                     .scale(1.0)
                     .watermark(Positions.BOTTOM_RIGHT, watermark, opacity)
                     .toFile(outputPath);

            logger.debug("添加水印完成: {} -> {}", inputPath, outputPath);
            return outputPath;

        } catch (IOException e) {
            logger.error("添加水印失败: {} -> {}", inputPath, outputPath, e);
            throw e;
        }
    }

    /**
     * 裁剪图片
     */
    public static String cropImage(String inputPath, String outputPath, 
                                 int x, int y, int width, int height) throws IOException {
        try {
            FileUtils.ensureParentDirectoryExists(outputPath);

            BufferedImage originalImage = ImageIO.read(new File(inputPath));
            if (originalImage == null) {
                throw new IOException("无法读取原始图片");
            }

            // 检查裁剪区域是否有效
            if (x < 0 || y < 0 || x + width > originalImage.getWidth() || 
                y + height > originalImage.getHeight()) {
                throw new IllegalArgumentException("裁剪区域超出图片边界");
            }

            Thumbnails.of(inputPath)
                     .sourceRegion(x, y, width, height)
                     .size(width, height)
                     .toFile(outputPath);

            logger.debug("图片裁剪完成: {} -> {} (区域: {},{},{},{})", 
                        inputPath, outputPath, x, y, width, height);
            return outputPath;

        } catch (IOException e) {
            logger.error("图片裁剪失败: {} -> {}", inputPath, outputPath, e);
            throw e;
        }
    }

    /**
     * 旋转图片
     */
    public static String rotateImage(String inputPath, String outputPath, double angle) throws IOException {
        try {
            FileUtils.ensureParentDirectoryExists(outputPath);

            Thumbnails.of(inputPath)
                     .scale(1.0)
                     .rotate(angle)
                     .toFile(outputPath);

            logger.debug("图片旋转完成: {} -> {} (角度: {}°)", inputPath, outputPath, angle);
            return outputPath;

        } catch (IOException e) {
            logger.error("图片旋转失败: {} -> {}", inputPath, outputPath, e);
            throw e;
        }
    }

    /**
     * 计算新的图片尺寸（保持宽高比）
     */
    private static ImageDimension calculateNewDimension(ImageDimension original, int maxWidth, int maxHeight) {
        int originalWidth = original.getWidth();
        int originalHeight = original.getHeight();

        // 如果原始尺寸已经小于等于最大尺寸，则不改变
        if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
            return original;
        }

        // 计算缩放比例
        double widthRatio = (double) maxWidth / originalWidth;
        double heightRatio = (double) maxHeight / originalHeight;
        double ratio = Math.min(widthRatio, heightRatio);

        int newWidth = (int) (originalWidth * ratio);
        int newHeight = (int) (originalHeight * ratio);

        return new ImageDimension(newWidth, newHeight);
    }

    /**
     * 检查是否为支持的图片格式
     */
    public static boolean isSupportedImageFormat(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return false;
        }

        String extension = FileUtils.getFileExtension(fileName);
        if (extension == null) {
            return false;
        }

        for (String format : SUPPORTED_FORMATS) {
            if (format.equalsIgnoreCase(extension)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 获取最优的输出格式
     */
    public static String getOptimalOutputFormat(String inputFormat, boolean hasTransparency) {
        if (inputFormat == null) {
            return "jpg";
        }

        String format = inputFormat.toLowerCase();
        
        // PNG适合有透明度的图片
        if (hasTransparency || "png".equals(format)) {
            return "png";
        }
        
        // GIF保持原格式
        if ("gif".equals(format)) {
            return "gif";
        }
        
        // 其他格式转换为JPEG以获得更好的压缩率
        return "jpg";
    }

    /**
     * 检查图片是否有透明度
     */
    public static boolean hasTransparency(String imagePath) throws IOException {
        try {
            BufferedImage image = ImageIO.read(new File(imagePath));
            if (image == null) {
                return false;
            }

            return image.getColorModel().hasAlpha();
        } catch (IOException e) {
            logger.error("检查图片透明度失败: {}", imagePath, e);
            throw e;
        }
    }

    /**
     * 获取图片文件的颜色深度
     */
    public static int getColorDepth(String imagePath) throws IOException {
        try {
            BufferedImage image = ImageIO.read(new File(imagePath));
            if (image == null) {
                throw new IOException("无法读取图片文件");
            }

            return image.getColorModel().getPixelSize();
        } catch (IOException e) {
            logger.error("获取图片颜色深度失败: {}", imagePath, e);
            throw e;
        }
    }

    /**
     * 清理生成的临时文件
     */
    public static void cleanupTempFiles(List<String> tempFilePaths) {
        if (tempFilePaths == null || tempFilePaths.isEmpty()) {
            return;
        }

        for (String path : tempFilePaths) {
            try {
                if (FileUtils.fileExists(path)) {
                    FileUtils.safeDeleteFile(path);
                }
            } catch (Exception e) {
                logger.warn("清理临时文件失败: {}", path, e);
            }
        }
    }
}