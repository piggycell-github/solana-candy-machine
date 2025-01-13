import fs from "fs/promises";
import path from "path";
import { TransactionCategory, TransactionData } from "../types/transaction";

export class TransactionLogger {
  private readonly csvPath: string;
  private readonly jsonPath: string;
  private static instance: TransactionLogger;

  private constructor() {
    const logPath = process.env.TRANSACTION_LOG_PATH || "./logs";
    this.csvPath = path.join(logPath, "transactions.csv");
    this.jsonPath = path.join(logPath, "transactions.json");
    this.initializeLogFiles();
  }

  public static getInstance(): TransactionLogger {
    if (!TransactionLogger.instance) {
      TransactionLogger.instance = new TransactionLogger();
    }
    return TransactionLogger.instance;
  }

  private async initializeLogFiles() {
    try {
      await fs.mkdir(path.dirname(this.csvPath), { recursive: true });

      // CSV 파일 초기화
      if (!(await this.fileExists(this.csvPath))) {
        await fs.writeFile(
          this.csvPath,
          "timestamp,category,transaction_hash,amount_sol,status\n"
        );
      }

      // JSON 파일 초기화
      if (!(await this.fileExists(this.jsonPath))) {
        await fs.writeFile(
          this.jsonPath,
          JSON.stringify({ transactions: [] }, null, 2)
        );
      }
    } catch (error) {
      console.error("Failed to initialize log files:", error);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  public async logTransaction(transaction: TransactionData): Promise<void> {
    try {
      await Promise.all([
        this.logToCSV(transaction),
        this.logToJSON(transaction),
      ]);
    } catch (error) {
      console.error("Failed to log transaction:", error);
    }
  }

  private async logToCSV(transaction: TransactionData): Promise<void> {
    const csvLine = `${transaction.timestamp},${transaction.category},${transaction.transaction_hash},${transaction.amount_sol},${transaction.status}\n`;
    await fs.appendFile(this.csvPath, csvLine);
  }

  private async logToJSON(transaction: TransactionData): Promise<void> {
    const fileContent = await fs.readFile(this.jsonPath, "utf-8");
    const data = JSON.parse(fileContent);
    data.transactions.push(transaction);
    await fs.writeFile(this.jsonPath, JSON.stringify(data, null, 2));
  }

  public async calculateTotalCostByCategory(): Promise<
    Record<TransactionCategory, number>
  > {
    const fileContent = await fs.readFile(this.jsonPath, "utf-8");
    const data = JSON.parse(fileContent);

    return data.transactions.reduce(
      (acc: Record<TransactionCategory, number>, tx: TransactionData) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount_sol;
        return acc;
      },
      {} as Record<TransactionCategory, number>
    );
  }

  public async printTotalCosts(): Promise<void> {
    const costs = await this.calculateTotalCostByCategory();
    const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    console.log("\n=== Transaction Cost Summary ===");
    Object.entries(costs).forEach(([category, cost]) => {
      console.log(`${category}: ${cost.toFixed(9)} SOL`);
    });
    console.log("------------------------");
    console.log(`Total Cost: ${total.toFixed(9)} SOL`);
  }
}
