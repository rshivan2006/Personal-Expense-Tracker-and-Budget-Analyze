
import java.util.*;

class Transaction {
    int id;
    String date;
    String category;
    String description;
    double amount;

    Transaction(int id, String date, String category,
                String description, double amount) {
        this.id = id;
        this.date = date;
        this.category = category;
        this.description = description;
        this.amount = amount;
    }

    public String toString() {
        return String.format(
            "%-5d %-12s %-18s %-25s Rs. %.2f",
            id, date, category, description, amount
        );
    }
}

public class PersonalExpenseTracker {

    static Scanner sc = new Scanner(System.in);
    static ArrayList<Transaction> transactions = new ArrayList<>();
    static HashMap<String, Double> categoryTotals = new HashMap<>();
    static HashMap<String, Double> budgets = new HashMap<>();
    static int nextId = 1;

    static void addExpense() {
        System.out.print("Enter date (YYYY-MM-DD): ");
        String date = sc.nextLine();

        System.out.print("Enter category: ");
        String category = sc.nextLine().trim();

        System.out.print("Enter description: ");
        String description = sc.nextLine();

        System.out.print("Enter amount: ");
        double amount = sc.nextDouble();
        sc.nextLine();

        if (amount <= 0) {
            System.out.println("Amount must be greater than zero.");
            return;
        }

        Transaction t = new Transaction(
            nextId++, date, category, description, amount
        );

        transactions.add(t);

        categoryTotals.put(
            category,
            categoryTotals.getOrDefault(category, 0.0) + amount
        );

        System.out.println("Expense added successfully.");
        checkBudget(category);
    }

    static void displayExpenses() {
        if (transactions.isEmpty()) {
            System.out.println("No expenses recorded.");
            return;
        }

        System.out.printf(
            "%-5s %-12s %-18s %-25s %s%n",
            "ID", "Date", "Category", "Description", "Amount"
        );

        for (Transaction t : transactions) {
            System.out.println(t);
        }
    }

    static void categoryWiseExpenses() {
        if (categoryTotals.isEmpty()) {
            System.out.println("No expenses available.");
            return;
        }

        System.out.println("\nCategory-wise Expenses:");

        for (Map.Entry<String, Double> entry :
                categoryTotals.entrySet()) {
            System.out.printf("%-20s Rs. %.2f%n",
                entry.getKey(), entry.getValue());
        }
    }

    static void highestSpendingCategories() {
        PriorityQueue<Map.Entry<String, Double>> heap =
            new PriorityQueue<>(
                (a, b) -> Double.compare(b.getValue(), a.getValue())
            );

        heap.addAll(categoryTotals.entrySet());

        System.out.println("\nHighest Spending Categories:");

        if (heap.isEmpty()) {
            System.out.println("No expenses available.");
            return;
        }

        int rank = 1;

        while (!heap.isEmpty()) {
            Map.Entry<String, Double> entry = heap.poll();

            System.out.printf("%d. %s - Rs. %.2f%n",
                rank++, entry.getKey(), entry.getValue());
        }
    }

    static void setBudget() {
        System.out.print("Enter category: ");
        String category = sc.nextLine().trim();

        System.out.print("Enter budget amount: ");
        double budget = sc.nextDouble();
        sc.nextLine();

        if (budget <= 0) {
            System.out.println("Budget must be greater than zero.");
            return;
        }

        budgets.put(category, budget);
        System.out.println("Budget set successfully.");

        checkBudget(category);
    }

    static void checkBudget(String category) {
        if (!budgets.containsKey(category)) {
            return;
        }

        double spent = categoryTotals.getOrDefault(category, 0.0);
        double budget = budgets.get(category);

        if (spent > budget) {
            System.out.printf(
                "BUDGET ALERT: %s exceeded its budget by Rs. %.2f%n",
                category, spent - budget
            );
        } else if (spent == budget) {
            System.out.println("Budget limit reached for " + category);
        } else {
            System.out.printf(
                "Remaining budget for %s: Rs. %.2f%n",
                category, budget - spent
            );
        }
    }

    static void monthlySummary() {
        System.out.print("Enter month (YYYY-MM): ");
        String month = sc.nextLine();

        double total = 0;
        int count = 0;
        HashMap<String, Double> monthlyCategories = new HashMap<>();

        for (Transaction t : transactions) {
            if (t.date.startsWith(month)) {
                total += t.amount;
                count++;

                monthlyCategories.put(
                    t.category,
                    monthlyCategories.getOrDefault(t.category, 0.0)
                        + t.amount
                );
            }
        }

        System.out.println("\nMonthly Summary: " + month);
        System.out.println("Number of transactions: " + count);
        System.out.printf("Total expenses: Rs. %.2f%n", total);

        if (monthlyCategories.isEmpty()) {
            System.out.println("No expenses recorded for this month.");
        } else {
            System.out.println("Category breakdown:");

            for (Map.Entry<String, Double> entry :
                    monthlyCategories.entrySet()) {
                System.out.printf("%s: Rs. %.2f%n",
                    entry.getKey(), entry.getValue());
            }
        }
    }

    static void sortExpenses() {
        if (transactions.isEmpty()) {
            System.out.println("No expenses to sort.");
            return;
        }

        ArrayList<Transaction> sorted =
            new ArrayList<>(transactions);

        sorted.sort((a, b) ->
            Double.compare(b.amount, a.amount)
        );

        System.out.println("\nExpenses sorted by amount (highest first):");

        for (Transaction t : sorted) {
            System.out.println(t);
        }
    }

    static void prefixSumAnalysis() {
        if (transactions.isEmpty()) {
            System.out.println("No expenses available.");
            return;
        }

        ArrayList<Transaction> sorted =
            new ArrayList<>(transactions);

        sorted.sort(Comparator.comparing(t -> t.date));

        double[] prefix = new double[sorted.size()];
        double sum = 0;

        for (int i = 0; i < sorted.size(); i++) {
            sum += sorted.get(i).amount;
            prefix[i] = sum;
        }

        System.out.println("\nCumulative Expense Analysis:");

        for (int i = 0; i < sorted.size(); i++) {
            System.out.printf(
                "%s | %s | Expense: Rs. %.2f | Cumulative: Rs. %.2f%n",
                sorted.get(i).date,
                sorted.get(i).category,
                sorted.get(i).amount,
                prefix[i]
            );
        }
    }

    static void binarySearchExpense() {
        if (transactions.isEmpty()) {
            System.out.println("No expenses available.");
            return;
        }

        ArrayList<Transaction> sorted =
            new ArrayList<>(transactions);

        sorted.sort(Comparator.comparingInt(t -> t.id));

        System.out.print("Enter transaction ID to search: ");
        int target = sc.nextInt();
        sc.nextLine();

        int low = 0;
        int high = sorted.size() - 1;

        while (low <= high) {
            int mid = low + (high - low) / 2;

            if (sorted.get(mid).id == target) {
                System.out.println("Transaction found:");
                System.out.println(sorted.get(mid));
                return;
            } else if (sorted.get(mid).id < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        System.out.println("Transaction not found.");
    }

    static void totalExpenses() {
        double total = 0;

        for (Transaction t : transactions) {
            total += t.amount;
        }

        System.out.printf("Total expenses: Rs. %.2f%n", total);
    }

    public static void main(String[] args) {
        int choice;

        do {
            System.out.println("\n==================================");
            System.out.println(" PERSONAL EXPENSE TRACKER");
            System.out.println("==================================");
            System.out.println("1. Add Expense");
            System.out.println("2. Display All Expenses");
            System.out.println("3. Category-wise Expenses");
            System.out.println("4. Highest Spending Categories");
            System.out.println("5. Set Category Budget");
            System.out.println("6. Monthly Summary");
            System.out.println("7. Sort Expenses by Amount");
            System.out.println("8. Cumulative Expense Analysis");
            System.out.println("9. Search Transaction by ID");
            System.out.println("10. View Total Expenses");
            System.out.println("0. Exit");
            System.out.print("Enter your choice: ");

            while (!sc.hasNextInt()) {
                System.out.print("Enter a valid menu number: ");
                sc.next();
            }

            choice = sc.nextInt();
            sc.nextLine();

            switch (choice) {
                case 1:
                    addExpense();
                    break;
                case 2:
                    displayExpenses();
                    break;
                case 3:
                    categoryWiseExpenses();
                    break;
                case 4:
                    highestSpendingCategories();
                    break;
                case 5:
                    setBudget();
                    break;
                case 6:
                    monthlySummary();
                    break;
                case 7:
                    sortExpenses();
                    break;
                case 8:
                    prefixSumAnalysis();
                    break;
                case 9:
                    binarySearchExpense();
                    break;
                case 10:
                    totalExpenses();
                    break;
                case 0:
                    System.out.println("Thank you for using Expense Tracker.");
                    break;
                default:
                    System.out.println("Invalid choice. Try again.");
            }

        } while (choice != 0);

        sc.close();
    }
}
