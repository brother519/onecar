/**
 * Tom cat
 * HelloDemo类用于演示基础的Java程序结构和输出功能
 * 该类展示了如何在控制台输出带有前缀的欢迎信息
 * 
 * 这是一个简单的Java应用程序示例，演示了：
 * - 基本的类结构定义
 * - main方法的正确声明和使用
 * - 控制台输出的标准方式
 * - Java文档注释的编写规范
 * 
 * 使用方法：
 * 1. 编译：javac HelloDemo.java
 * 2. 运行：java HelloDemo
 * 
 * @author onecar
 * @version 1.0
 * @since 2025-10-22
 */
public class HelloDemo {
    
    /**
     * 程序的主入口点
     * 
     * 此方法是Java应用程序的起始点，当程序启动时JVM会自动调用此方法。
     * 方法执行一个简单的操作：向控制台输出一条带有类名前缀的问候消息。
     * 
     * @param args 命令行参数数组，包含启动程序时传递的参数
     *             在此程序中未使用这些参数
     */
    public static void main(String[] args) {
        // 向标准输出流输出带有类名前缀的欢迎信息
        // 使用System.out.println()方法确保输出后自动换行
        System.out.println("HelloDemo: Hello, World!");
        
        // 程序执行完毕后将自动退出
    }
}