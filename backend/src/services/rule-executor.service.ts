import Queue from 'bull';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { executeFlow, CONTRACT_ADDRESS } from '../config/flow.js';

const prisma = new PrismaClient();

// Create rule execution queue
const ruleQueue = new Queue('automation-rules', env.redisUrl || 'redis://localhost:6379');

// Process rule jobs
ruleQueue.process(async (job) => {
  const { ruleId, userId } = job.data;

  try {
    const rule = await prisma.rule.findFirst({
      where: { id: ruleId, userId },
      include: { scheduledTransaction: true },
    });

    if (!rule || rule.status !== 'active') {
      logger.info('Rule skipped (inactive or not found)', { ruleId });
      return;
    }

    // Execute the rule based on type
    await executeRule(rule, userId);

    // Calculate and schedule next execution
    if (rule.scheduledTransaction) {
      const nextExecution = calculateNextExecution(
        rule.scheduledTransaction.frequency,
        rule.scheduledTransaction.dayOfWeek ?? 5,
        rule.scheduledTransaction.time || '09:00',
      );

      await prisma.rule.update({
        where: { id: ruleId },
        data: { nextExecution },
      });

      // Schedule next execution
      const delayMs = nextExecution.getTime() - Date.now();
      if (delayMs > 0) {
        await ruleQueue.add({ ruleId, userId }, { delay: delayMs, removeOnComplete: true });
      }
    }

    return { success: true, ruleId };
  } catch (err) {
    logger.error('Rule execution failed', { ruleId, error: (err as Error).message, attempt: job.attemptsMade });
    throw err; // Retry on failure
  }
});

// Event handlers
ruleQueue.on('completed', (job) => {
  logger.info('Rule job completed', { jobId: job.id, ruleId: job.data.ruleId });
});

ruleQueue.on('failed', (job, err) => {
  logger.error('Rule job failed permanently', { jobId: job.id, ruleId: job.data.ruleId, error: err.message });
});

/**
 * Execute a single rule
 */
async function executeRule(rule: any, userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { flowAddress: true },
  });

  if (!user?.flowAddress) {
    throw new Error('User flow address not found');
  }

  const { type, config } = rule;
  const amount = parseFloat(config.amount);

  switch (type) {
    case 'save':
      await executeSaveRule(user.flowAddress, amount, config.toVault, userId);
      break;
    case 'send':
      await executeSendRule(user.flowAddress, amount, config.recipient, userId);
      break;
    case 'stake':
      await executeStakeRule(user.flowAddress, amount, userId);
      break;
    case 'dca':
      await executeDCARule(user.flowAddress, amount, userId);
      break;
    default:
      throw new Error(`Unknown rule type: ${type}`);
  }
}

/**
 * Execute save rule
 */
async function executeSaveRule(
  userAddress: string,
  amount: number,
  toVault: string,
  userId: string,
): Promise<void> {
  const cadenceScript = `
    import VaultManager from ${CONTRACT_ADDRESS}

    transaction(amount: UFix64, toVault: String) {
      let vaults: &VaultManager.UserVaults

      prepare(signer: AuthAccount) {
        if signer.borrow<&VaultManager.UserVaults>(from: /storage/flowmateVaults) == nil {
          signer.save(<- VaultManager.createUserVaults(), to: /storage/flowmateVaults)
          signer.link<&VaultManager.UserVaults>(/public/flowmateVaults, target: /storage/flowmateVaults)
        }

        self.vaults = signer.borrow<&VaultManager.UserVaults>(from: /storage/flowmateVaults)
          ?? panic("Could not borrow vaults")
      }

      execute {
        self.vaults.transferBetweenVaults(from: "available", to: toVault, amount: amount)
      }
    }
  `;

  try {
    const result = await executeFlow(
      cadenceScript,
      (arg: any, t: any) => [
        arg(amount.toFixed(8), t.UFix64),
        arg(toVault, t.String),
      ],
    );

    const txHash = result.transactionId || 'pending';
    const txRecord = await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'save',
        fromAddress: userAddress,
        toAddress: `vault:${toVault}`,
        amount,
        token: 'FLOW',
        status: 'pending',
        metadata: { automated: true, ruleType: 'save' },
      },
    });

    logger.info('Automated save executed', { userId, amount, txHash });
  } catch (err) {
    logger.error('Save rule execution failed', { userId, error: (err as Error).message });
    throw err;
  }
}

/**
 * Execute send rule
 */
async function executeSendRule(
  userAddress: string,
  amount: number,
  recipient: string,
  userId: string,
): Promise<void> {
  const cadenceScript = `
    import FungibleToken from 0x9a0766d93b6608b7
    import FlowToken from 0x7e60df042a9c0868

    transaction(amount: UFix64, to: Address) {
      let sentVault: @FungibleToken.Vault

      prepare(signer: AuthAccount) {
        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
          ?? panic("Could not borrow reference to the owner's Vault!")

        self.sentVault <- vaultRef.withdraw(amount: amount)
      }

      execute {
        let recipient = getAccount(to)
        let receiverRef = recipient.getCapability(/public/flowTokenReceiver)
          .borrow<&{FungibleToken.Receiver}>()
          ?? panic("Could not borrow receiver reference to the recipient's Vault")

        receiverRef.deposit(from: <- self.sentVault)
      }
    }
  `;

  try {
    const result = await executeFlow(
      cadenceScript,
      (arg: any, t: any) => [
        arg(amount.toFixed(8), t.UFix64),
        arg(recipient, t.Address),
      ],
    );

    const txHash = result.transactionId || 'pending';
    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'send',
        fromAddress: userAddress,
        toAddress: recipient,
        amount,
        token: 'FLOW',
        status: 'pending',
        metadata: { automated: true, ruleType: 'send' },
      },
    });

    logger.info('Automated send executed', { userId, amount, recipient, txHash });
  } catch (err) {
    logger.error('Send rule execution failed', { userId, error: (err as Error).message });
    throw err;
  }
}

/**
 * Execute stake rule
 */
async function executeStakeRule(userAddress: string, amount: number, userId: string): Promise<void> {
  const cadenceScript = `
    import VaultManager from ${CONTRACT_ADDRESS}

    transaction(amount: UFix64) {
      let vaults: &VaultManager.UserVaults

      prepare(signer: AuthAccount) {
        if signer.borrow<&VaultManager.UserVaults>(from: /storage/flowmateVaults) == nil {
          signer.save(<- VaultManager.createUserVaults(), to: /storage/flowmateVaults)
          signer.link<&VaultManager.UserVaults>(/public/flowmateVaults, target: /storage/flowmateVaults)
        }

        self.vaults = signer.borrow<&VaultManager.UserVaults>(from: /storage/flowmateVaults)
          ?? panic("Could not borrow vaults")
      }

      execute {
        self.vaults.transferBetweenVaults(from: "available", to: "staking", amount: amount)
      }
    }
  `;

  try {
    const result = await executeFlow(
      cadenceScript,
      (arg: any, t: any) => [arg(amount.toFixed(8), t.UFix64)],
    );

    const txHash = result.transactionId || 'pending';
    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'stake',
        fromAddress: userAddress,
        toAddress: 'flow-staking-contract',
        amount,
        token: 'FLOW',
        status: 'pending',
        metadata: { automated: true, ruleType: 'stake', apy: '8.5%' },
      },
    });

    logger.info('Automated stake executed', { userId, amount, txHash });
  } catch (err) {
    logger.error('Stake rule execution failed', { userId, error: (err as Error).message });
    throw err;
  }
}

/**
 * Execute DCA rule
 */
async function executeDCARule(userAddress: string, amount: number, userId: string): Promise<void> {
  logger.info('DCA rule execution - placeholder', { userId, amount });
  // DCA logic would go here
}

/**
 * Calculate next execution time
 */
function calculateNextExecution(frequency: string, dayOfWeek: number, time: string): Date {
  const [hours, minutes] = (time || '09:00').split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (frequency === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === 'weekly') {
    const currentDay = now.getDay();
    const targetDay = dayOfWeek ?? 5;
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setDate(next.getDate() + daysUntil);
  } else if (frequency === 'biweekly') {
    const currentDay = now.getDay();
    const targetDay = dayOfWeek ?? 5;
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 14;
    next.setDate(next.getDate() + daysUntil);
  } else if (frequency === 'monthly') {
    next.setDate(1);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
    }
  }

  return next;
}

/**
 * Initialize all active rules into the queue
 */
export async function initializeRules(): Promise<void> {
  try {
    const activeRules = await prisma.rule.findMany({
      where: { status: 'active' },
      include: { scheduledTransaction: true },
    });

    for (const rule of activeRules) {
      const delayMs = rule.nextExecution?.getTime() ? rule.nextExecution.getTime() - Date.now() : 0;
      if (delayMs > 0) {
        await ruleQueue.add(
          { ruleId: rule.id, userId: rule.userId },
          { delay: delayMs, removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
        );
        logger.info('Rule scheduled', { ruleId: rule.id, nextExecution: rule.nextExecution });
      }
    }

    logger.info('Rules initialized', { count: activeRules.length });
  } catch (err) {
    logger.error('Failed to initialize rules', { error: (err as Error).message });
  }
}

/**
 * Schedule a new rule
 */
export async function scheduleRule(ruleId: string, userId: string, nextExecution: Date | null): Promise<void> {
  if (!nextExecution) {
    logger.warn('Cannot schedule rule with null nextExecution', { ruleId });
    return;
  }
  const delayMs = nextExecution.getTime() - Date.now();
  if (delayMs > 0) {
    await ruleQueue.add(
      { ruleId, userId },
      { delay: delayMs, removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );
  }
}

export default ruleQueue;
