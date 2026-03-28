import { executeFlow, queryFlow } from "../config/flow";
import logger from "../config/logger";

/**
 * Flow Blockchain Service
 * Handles all blockchain interactions
 */

export class FlowService {
  /**
   * Register new user on-chain
   */
  async registerUser(userAddress: string, autonomyMode: "manual" | "assist" | "autopilot") {
    try {
      logger.info("Registering user on Flow", { userAddress, autonomyMode });

      const txId = await executeFlow(
        `
        import FlowMateAgent from 0xFlowMateAgent

        transaction(autonomyMode: String) {
          let authAccount: AuthAccount

          prepare(signer: AuthAccount) {
            self.authAccount = signer
          }

          execute {
            FlowMateAgent.registerUser(
              acct: self.authAccount,
              initialMode: autonomyMode
            )
          }
        }
        `,
        [autonomyMode]
      );

      return { success: true, txId };
    } catch (error) {
      logger.error("User registration failed", { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get user config from on-chain
   */
  async getUserConfig(userAddress: string) {
    try {
      const config = await queryFlow(
        `
        import FlowMateAgent from 0xFlowMateAgent

        pub fun main(addr: Address): FlowMateAgent.UserConfig {
          return FlowMateAgent.getUserConfig(address: addr) ?? panic("User not registered")
        }
        `,
        [userAddress]
      );

      return config;
    } catch (error) {
      logger.error("Failed to fetch user config", { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get user vaults from on-chain
   */
  async getUserVaults(userAddress: string) {
    try {
      const vaults = await queryFlow(
        `
        import VaultManager from 0xVaultManager

        pub fun main(addr: Address): {String: UFix64} {
          return VaultManager.getUserVaultBalances(address: addr)
        }
        `,
        [userAddress]
      );

      return vaults;
    } catch (error) {
      logger.error("Failed to fetch vaults", { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Execute transfer between vaults
   */
  async transferBetweenVaults(
    userAddress: string,
    fromVault: string,
    toVault: string,
    amount: number
  ) {
    try {
      logger.info("Executing vault transfer", { userAddress, fromVault, toVault, amount });

      const txId = await executeFlow(
        `
        import VaultManager from 0xVaultManager

        transaction(from: String, to: String, amount: UFix64) {
          let authAccount: AuthAccount

          prepare(signer: AuthAccount) {
            self.authAccount = signer
          }

          execute {
            VaultManager.transferBetweenVaults(
              acct: self.authAccount,
              fromType: from,
              toType: to,
              amount: amount
            )
          }
        }
        `,
        [fromVault, toVault, amount]
      );

      return { success: true, txId };
    } catch (error) {
      logger.error("Vault transfer failed", { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Create scheduled transaction
   */
  async createSchedule(userAddress: string, ruleId: string, frequency: string, nextExecution: Date) {
    try {
      logger.info("Creating schedule", { userAddress, ruleId, frequency });

      const txId = await executeFlow(
        `
        import ScheduledTransactions from 0xScheduledTransactions

        transaction(frequency: String, nextExecution: UFix64) {
          let authAccount: AuthAccount

          prepare(signer: AuthAccount) {
            self.authAccount = signer
          }

          execute {
            ScheduledTransactions.createSchedule(
              acct: self.authAccount,
              frequency: frequency,
              nextExecution: nextExecution
            )
          }
        }
        `,
        [frequency, nextExecution.getTime() / 1000]
      );

      return { success: true, txId };
    } catch (error) {
      logger.error("Schedule creation failed", { error: (error as Error).message });
      throw error;
    }
  }
}

export default new FlowService();
