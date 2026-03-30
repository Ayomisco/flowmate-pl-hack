import logger from "../config/logger.js";
import { prisma } from "../config/database.js";

/**
 * Transaction Service
 * Handles transaction tracking and history
 *
 * NOTE: Actual transaction execution is handled in routes via Flow SDK
 * This service focused on data persistence and retrieval
 */

export class TransactionService {
  /**
   * Track transaction in database
   */
  async trackTransaction(
    userId: string,
    transactionData: {
      type: string;
      amount: number;
      fromVault?: string;
      toVault?: string;
      txHash: string;
      explorerUrl?: string;
      status?: string;
    }
  ) {
    try {
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type: transactionData.type,
          amount: transactionData.amount,
          fromVault: transactionData.fromVault,
          toVault: transactionData.toVault,
          txHash: transactionData.txHash,
          explorerUrl: transactionData.explorerUrl,
          status: transactionData.status || "pending",
        },
      });

      logger.info("Transaction tracked", { userId, txHash: transactionData.txHash, transactionId: transaction.id });
      return transaction;
    } catch (error) {
      logger.error("Transaction tracking failed", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get transaction history for user
   */
  async getTransactionHistory(userId: string, limit: number = 20) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      logger.info("Fetched transaction history", { userId, count: transactions.length });
      return transactions;
    } catch (error) {
      logger.error("Failed to fetch transaction history", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransactionByHash(txHash: string) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { txHash },
      });

      return transaction;
    } catch (error) {
      logger.error("Failed to fetch transaction by hash", {
        error: (error as Error).message,
        txHash,
      });
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(txHash: string, status: string) {
    try {
      const transaction = await prisma.transaction.update({
        where: { txHash },
        data: { status },
      });

      logger.info("Transaction status updated", { txHash, status });
      return transaction;
    } catch (error) {
      logger.error("Failed to update transaction status", {
        error: (error as Error).message,
        txHash,
      });
      throw error;
    }
  }
}

export default new TransactionService();
