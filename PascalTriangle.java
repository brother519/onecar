/**
 * Pascal's Triangle Class
 * Used to generate and print n-order Pascal's triangle
 */
public class PascalTriangle {
    /**
     * Print n-order Pascal's triangle
     * @param n The order of Pascal's triangle
     */
    public static void printPascalTriangle(int n) {
        // Iterate through each row
        for (int i = 0; i < n; i++) {
            // Print spaces before each row to center the triangle
            for (int j = 0; j < n - i - 1; j++) {
                System.out.print(" ");
            }
            
            // Print the values of the current row
            for (int j = 0; j <= i; j++) {
                System.out.print(calculateValue(i, j) + " ");
            }
            
            System.out.println();
        }
    }
    
    /**
     * Calculate the value at a specified position in Pascal's triangle
     * @param row Row number (starting from 0)
     * @param col Column number (starting from 0)
     * @return The value at that position
     */
    public static int calculateValue(int row, int col) {
        // The first and last numbers in each row are 1
        if (col == 0 || col == row) {
            return 1;
        }
        // The value at other positions equals the sum of two adjacent numbers in the previous row
        return calculateValue(row - 1, col - 1) + calculateValue(row - 1, col);
    }
    
    /**
     * Main method
     * @param args Command line arguments
     */
    public static void main(String[] args) {
        // Set the order of Pascal's triangle
        int n = 10;
        System.out.println("Print " + n + "-order Pascal's triangle:");
        // Call the method to print Pascal's triangle
        printPascalTriangle(n);
    }
}
