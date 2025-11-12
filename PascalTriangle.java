import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

/**
 * 控制台打印 n 行金字塔居中的杨辉三角。
 * 用法：
 *   java PascalTriangle [n]
 * 若未提供 n，默认使用 5；n 合法范围：1..60。
 */
public class PascalTriangle {
    public static void main(String[] args) {
        int n = 5; // 默认值
        if (args.length > 0) {
            try {
                n = Integer.parseInt(args[0]);
            } catch (NumberFormatException ex) {
                System.err.println("[错误] n 必须是整数。例如：java PascalTriangle 10");
                System.exit(1);
            }
        }

        // 上限保护，避免 64 位整数溢出
        final int MAX_N = 60;
        if (n < 1 || n > MAX_N) {
            System.err.println("[错误] n 范围应为 1.." + MAX_N + "。当前 n=" + n);
            System.exit(1);
        }

        // 计算单元格宽度（基于最大值位数 + 缓冲）
        int cellWidth = computeCellWidth(n);

        // 逐行生成与打印（滚动数组）
        List<Long> prev = new ArrayList<>();
        prev.add(1L); // 第 0 行

        for (int r = 0; r < n; r++) {
            // 左侧前置空格，近似居中
            int leftPad = (int) ((n - 1 - r) * (cellWidth / 2.0));
            printSpaces(leftPad);

            // 打印当前行（右对齐的等宽列）
            for (int i = 0; i < prev.size(); i++) {
                System.out.print(String.format("%" + cellWidth + "d", prev.get(i)));
            }
            System.out.println();

            // 构造下一行
            List<Long> curr = new ArrayList<>();
            curr.add(1L);
            for (int i = 1; i < prev.size(); i++) {
                long sum = prev.get(i - 1) + prev.get(i);
                curr.add(sum);
            }
            curr.add(1L);
            prev = curr;
        }
    }

    // 估算单元格宽度：取第 (n-1) 行的中间组合数的位数 + 2 缓冲
    private static int computeCellWidth(int n) {
        if (n <= 1) return 3; // 对于 n=1，宽度给个保守值
        int row = n - 1;
        int k = row / 2;
        BigInteger maxVal = binomial(row, k);
        int digits = maxVal.toString().length();
        return digits + 2; // 预留缓冲空格
    }

    // 精确计算组合数 C(n, k)
    private static BigInteger binomial(int n, int k) {
        if (k < 0 || k > n) return BigInteger.ZERO;
        if (k == 0 || k == n) return BigInteger.ONE;
        k = Math.min(k, n - k);
        BigInteger result = BigInteger.ONE;
        for (int i = 1; i <= k; i++) {
            result = result.multiply(BigInteger.valueOf(n - k + i));
            result = result.divide(BigInteger.valueOf(i));
        }
        return result;
    }

    private static void printSpaces(int count) {
        for (int i = 0; i < count; i++) {
            System.out.print(" ");
        }
    }
}
