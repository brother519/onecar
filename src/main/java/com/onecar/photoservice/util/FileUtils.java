package com.onecar.photoservice.util;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 文件工具类
 * 提供文件操作、路径管理、MD5计算等核心功能
 */
public class FileUtils {

    private static final Logger logger = LoggerFactory.getLogger(FileUtils.class);

    // 日期格式化器，用于生成存储路径
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    /**
     * 计算文件的MD5哈希值
     */
    public static String calculateMD5(InputStream inputStream) throws IOException {
        try {
            return DigestUtils.md5Hex(inputStream);
        } catch (IOException e) {
            logger.error("计算MD5失败", e);
            throw e;
        }
    }

    /**
     * 计算文件的MD5哈希值
     */
    public static String calculateMD5(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file)) {
            return calculateMD5(fis);
        }
    }

    /**
     * 计算字节数组的MD5哈希值
     */
    public static String calculateMD5(byte[] bytes) {
        return DigestUtils.md5Hex(bytes);
    }

    /**
     * 生成唯一的文件名
     */
    public static String generateUniqueFileName(String originalFileName) {
        String extension = getFileExtension(originalFileName);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        
        if (StringUtils.hasText(extension)) {
            return uuid + "." + extension.toLowerCase();
        }
        return uuid;
    }

    /**
     * 获取文件扩展名
     */
    public static String getFileExtension(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return null;
        }
        return FilenameUtils.getExtension(fileName);
    }

    /**
     * 获取不带扩展名的文件名
     */
    public static String getFileNameWithoutExtension(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return null;
        }
        return FilenameUtils.getBaseName(fileName);
    }

    /**
     * 生成按日期分层的存储路径
     */
    public static String generateDateBasedPath(String basePath) {
        LocalDateTime now = LocalDateTime.now();
        String datePath = now.format(DATE_FORMATTER);
        return Paths.get(basePath, datePath).toString();
    }

    /**
     * 生成完整的文件存储路径
     */
    public static String generateFullStoragePath(String basePath, String fileName) {
        String datePath = generateDateBasedPath(basePath);
        return Paths.get(datePath, fileName).toString();
    }

    /**
     * 确保目录存在，不存在则创建
     */
    public static void ensureDirectoryExists(String directoryPath) throws IOException {
        Path path = Paths.get(directoryPath);
        if (!Files.exists(path)) {
            try {
                Files.createDirectories(path);
                logger.debug("创建目录: {}", directoryPath);
            } catch (IOException e) {
                logger.error("创建目录失败: {}", directoryPath, e);
                throw e;
            }
        }
    }

    /**
     * 确保文件的父目录存在
     */
    public static void ensureParentDirectoryExists(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        Path parentPath = path.getParent();
        if (parentPath != null) {
            ensureDirectoryExists(parentPath.toString());
        }
    }

    /**
     * 安全地删除文件
     */
    public static boolean safeDeleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            if (Files.exists(path)) {
                Files.delete(path);
                logger.debug("删除文件: {}", filePath);
                return true;
            }
        } catch (IOException e) {
            logger.error("删除文件失败: {}", filePath, e);
        }
        return false;
    }

    /**
     * 移动文件
     */
    public static boolean moveFile(String sourcePath, String destinationPath) {
        try {
            Path source = Paths.get(sourcePath);
            Path destination = Paths.get(destinationPath);
            
            // 确保目标目录存在
            ensureParentDirectoryExists(destinationPath);
            
            Files.move(source, destination, StandardCopyOption.REPLACE_EXISTING);
            logger.debug("移动文件: {} -> {}", sourcePath, destinationPath);
            return true;
        } catch (IOException e) {
            logger.error("移动文件失败: {} -> {}", sourcePath, destinationPath, e);
            return false;
        }
    }

    /**
     * 复制文件
     */
    public static boolean copyFile(String sourcePath, String destinationPath) {
        try {
            Path source = Paths.get(sourcePath);
            Path destination = Paths.get(destinationPath);
            
            // 确保目标目录存在
            ensureParentDirectoryExists(destinationPath);
            
            Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
            logger.debug("复制文件: {} -> {}", sourcePath, destinationPath);
            return true;
        } catch (IOException e) {
            logger.error("复制文件失败: {} -> {}", sourcePath, destinationPath, e);
            return false;
        }
    }

    /**
     * 检查文件是否存在
     */
    public static boolean fileExists(String filePath) {
        return Files.exists(Paths.get(filePath));
    }

    /**
     * 获取文件大小
     */
    public static long getFileSize(String filePath) throws IOException {
        try {
            return Files.size(Paths.get(filePath));
        } catch (IOException e) {
            logger.error("获取文件大小失败: {}", filePath, e);
            throw e;
        }
    }

    /**
     * 格式化文件大小为人类可读格式
     */
    public static String formatFileSize(long sizeInBytes) {
        if (sizeInBytes < 1024) {
            return sizeInBytes + " B";
        } else if (sizeInBytes < 1024 * 1024) {
            return String.format("%.1f KB", sizeInBytes / 1024.0);
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", sizeInBytes / (1024.0 * 1024.0));
        } else {
            return String.format("%.1f GB", sizeInBytes / (1024.0 * 1024.0 * 1024.0));
        }
    }

    /**
     * 检查文件名是否有效（不包含非法字符）
     */
    public static boolean isValidFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return false;
        }
        
        // 检查非法字符
        String[] illegalChars = {"<", ">", ":", "\"", "|", "?", "*", "/", "\\"};
        for (String illegalChar : illegalChars) {
            if (fileName.contains(illegalChar)) {
                return false;
            }
        }
        
        // 检查长度
        return fileName.length() <= 255;
    }

    /**
     * 清理文件名，移除非法字符
     */
    public static String sanitizeFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return "unnamed";
        }
        
        // 替换非法字符为下划线
        String sanitized = fileName.replaceAll("[<>:\"|?*\\\\/]", "_");
        
        // 限制长度
        if (sanitized.length() > 255) {
            String extension = getFileExtension(sanitized);
            String baseName = getFileNameWithoutExtension(sanitized);
            int maxBaseLength = 255 - (extension != null ? extension.length() + 1 : 0);
            
            if (baseName.length() > maxBaseLength) {
                baseName = baseName.substring(0, maxBaseLength);
            }
            
            sanitized = extension != null ? baseName + "." + extension : baseName;
        }
        
        return sanitized;
    }

    /**
     * 写入字节数组到文件
     */
    public static void writeBytes(String filePath, byte[] bytes) throws IOException {
        try {
            ensureParentDirectoryExists(filePath);
            Files.write(Paths.get(filePath), bytes, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
            logger.debug("写入文件: {}, 大小: {} bytes", filePath, bytes.length);
        } catch (IOException e) {
            logger.error("写入文件失败: {}", filePath, e);
            throw e;
        }
    }

    /**
     * 读取文件为字节数组
     */
    public static byte[] readFileToBytes(String filePath) throws IOException {
        try {
            return Files.readAllBytes(Paths.get(filePath));
        } catch (IOException e) {
            logger.error("读取文件失败: {}", filePath, e);
            throw e;
        }
    }

    /**
     * 获取文件的最后修改时间
     */
    public static LocalDateTime getLastModifiedTime(String filePath) throws IOException {
        try {
            Path path = Paths.get(filePath);
            return Files.getLastModifiedTime(path).toInstant()
                    .atZone(java.time.ZoneId.systemDefault())
                    .toLocalDateTime();
        } catch (IOException e) {
            logger.error("获取文件最后修改时间失败: {}", filePath, e);
            throw e;
        }
    }

    /**
     * 创建临时文件
     */
    public static String createTempFile(String prefix, String suffix) throws IOException {
        try {
            Path tempFile = Files.createTempFile(prefix, suffix);
            return tempFile.toString();
        } catch (IOException e) {
            logger.error("创建临时文件失败: prefix={}, suffix={}", prefix, suffix, e);
            throw e;
        }
    }

    /**
     * 在指定目录创建临时文件
     */
    public static String createTempFile(String directory, String prefix, String suffix) throws IOException {
        try {
            Path tempDir = Paths.get(directory);
            ensureDirectoryExists(directory);
            
            Path tempFile = Files.createTempFile(tempDir, prefix, suffix);
            return tempFile.toString();
        } catch (IOException e) {
            logger.error("在目录 {} 创建临时文件失败: prefix={}, suffix={}", directory, prefix, suffix, e);
            throw e;
        }
    }

    /**
     * 获取系统临时目录
     */
    public static String getSystemTempDirectory() {
        return System.getProperty("java.io.tmpdir");
    }

    /**
     * 检查磁盘空间是否足够
     */
    public static boolean hasEnoughDiskSpace(String path, long requiredBytes) {
        try {
            Path targetPath = Paths.get(path);
            long usableSpace = Files.getFileStore(targetPath).getUsableSpace();
            return usableSpace >= requiredBytes;
        } catch (IOException e) {
            logger.error("检查磁盘空间失败: {}", path, e);
            return false;
        }
    }

    /**
     * 获取可用磁盘空间
     */
    public static long getUsableDiskSpace(String path) throws IOException {
        try {
            Path targetPath = Paths.get(path);
            return Files.getFileStore(targetPath).getUsableSpace();
        } catch (IOException e) {
            logger.error("获取可用磁盘空间失败: {}", path, e);
            throw e;
        }
    }

    /**
     * 递归删除目录及其内容
     */
    public static boolean deleteDirectoryRecursively(String directoryPath) {
        try {
            Path path = Paths.get(directoryPath);
            if (Files.exists(path)) {
                Files.walk(path)
                     .sorted((a, b) -> -a.compareTo(b)) // 先删除文件，再删除目录
                     .forEach(p -> {
                         try {
                             Files.delete(p);
                         } catch (IOException e) {
                             logger.warn("删除失败: {}", p, e);
                         }
                     });
                logger.debug("递归删除目录: {}", directoryPath);
                return true;
            }
        } catch (IOException e) {
            logger.error("递归删除目录失败: {}", directoryPath, e);
        }
        return false;
    }
}