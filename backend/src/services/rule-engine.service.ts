import { getAIService } from "./ai.service.js";
import logger from "../config/logger.js";
import { ParsedIntent } from "../types/index.js";

/**
 * Rule Engine Service
 * Evaluates conditions and triggers financial actions
 */

export class RuleEngine {
  /**
   * Evaluate if a rule should execute
   */
  async shouldExecuteRule(rule: any, userContext: Record<string, any>): Promise<boolean> {
    try {
      const { config, type } = rule;

      switch (type) {
        case "save":
          return this.evaluateSaveRule(config, userContext);
        case "send":
          return this.evaluateSendRule(config, userContext);
        case "dca":
          return this.evaluateDCARule(config, userContext);
        case "stake":
          return this.evaluateStakeRule(config, userContext);
        default:
          return false;
      }
    } catch (error) {
      logger.error("Rule evaluation error", { error: (error as Error).message });
      return false;
    }
  }

  private evaluateSaveRule(config: any, context: Record<string, any>): boolean {
    const { minBalance, targetAmount } = config;
    const currentBalance = context.balance || 0;

    return currentBalance >= minBalance && targetAmount > 0;
  }

  private evaluateSendRule(config: any, context: Record<string, any>): boolean {
    const { recipient, amount } = config;
    const currentBalance = context.balance || 0;
    const dailyLimit = context.dailyLimit || 0;
    const dailyUsed = context.dailyUsed || 0;

    return (
      recipient &&
      amount > 0 &&
      currentBalance >= amount &&
      dailyUsed + amount <= dailyLimit
    );
  }

  private evaluateDCARule(config: any, context: Record<string, any>): boolean {
    const { amount, frequency } = config;
    return amount > 0 && frequency;
  }

  private evaluateStakeRule(config: any, context: Record<string, any>): boolean {
    const { amount } = config;
    const stakingVault = context.stakingVault || 0;
    return amount > 0 && stakingVault >= amount;
  }

  /**
   * Convert natural language to rule config
   */
  async parseRuleFromIntent(intent: ParsedIntent): Promise<Record<string, any>> {
    const { action, parameters } = intent;

    const ruleConfig = {
      action,
      parameters,
      createdAt: new Date(),
      lastEvaluated: null,
    };

    return ruleConfig;
  }
}

export default new RuleEngine();
