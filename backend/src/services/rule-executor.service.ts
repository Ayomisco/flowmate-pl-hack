import Queue from 'bull';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { sendFlowFromAdmin } from './flow-transfer.service.js';

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
 * Execute save rule — vault-to-vault transfer (DB only, custodial model)
 */
async function executeSaveRule(
  userAddress: string,
  amount: number,
  toVault: string,
  userId: string,
): Promise<void> {
  try {
    const [avail, dest] = await Promise.all([
      prisma.vault.findFirst({ where: { userId, type: 'available' } }),
      prisma.vault.findFirst({ where: { userId, type: toVault } }),
    ]);

    if (!avail || Number(avail.balance) < amount) throw new Error('Insufficient balance for automated save');
    if (!dest) throw new Error(`Vault ${toVault} not found`);

    const txHash = `internal:${randomBytes(16).toString('hex')}`;

    await prisma.$transaction([
      prisma.vault.update({ where: { id: avail.id }, data: { balance: { decrement: amount } } }),
      prisma.vault.update({ where: { id: dest.id }, data: { balance: { increment: amount } } }),
    ]);

    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'save',
        fromAddress: userAddress,
        toAddress: `vault:${toVault}`,
        amount,
        token: 'FLOW',
        status: 'confirmed',
        metadata: { automated: true, ruleType: 'save' },
        confirmedAt: new Date(),
      },
    });

    logger.info('Automated save executed', { userId, amount, toVault });
  } catch (err) {
    logger.error('Save rule execution failed', { userId, error: (err as Error).message });
    throw err;
  }
}

/**
 * Execute send rule — sends FLOW from admin account to recipient (custodial)
 */
async function executeSendRule(
  userAddress: string,
  amount: number,
  recipient: string,
  userId: string,
): Promise<void> {
  try {
    const vault = await prisma.vault.findFirst({ where: { userId, type: 'available' } });
    if (!vault || Number(vault.balance) < amount) throw new Error('Insufficient balance for automated send');

    const realTxId = await sendFlowFromAdmin(recipient, amount);
    const txHash = realTxId || `internal:${randomBytes(16).toString('hex')}`;
    const explorerUrl = realTxId ? `https://testnet.flowscan.io/tx/${realTxId}` : undefined;

    await prisma.vault.update({ where: { id: vault.id }, data: { balance: { decrement: amount } } });

    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'send',
        fromAddress: userAddress,
        toAddress: recipient,
        amount,
        token: 'FLOW',
        status: realTxId ? 'confirmed' : 'pending',
        explorerUrl,
        metadata: { automated: true, ruleType: 'send' },
        confirmedAt: realTxId ? new Date() : undefined,
      },
    });

    logger.info('Automated send executed', { userId, amount, recipient, txHash });
  } catch (err) {
    logger.error('Send rule execution failed', { userId, error: (err as Error).message });
    throw err;
  }
}

/**
 * Execute stake rule — vault-to-staking transfer (DB only, custodial model)
 */
async function executeStakeRule(userAddress: string, amount: number, userId: string): Promise<void> {
  try {
    const [avail, staking] = await Promise.all([
      prisma.vault.findFirst({ where: { userId, type: 'available' } }),
      prisma.vault.findFirst({ where: { userId, type: 'staking' } }),
    ]);

    if (!avail || Number(avail.balance) < amount) throw new Error('Insufficient balance for automated stake');
    if (!staking) throw new Error('Staking vault not found');

    const txHash = `internal:${randomBytes(16).toString('hex')}`;

    await prisma.$transaction([
      prisma.vault.update({ where: { id: avail.id }, data: { balance: { decrement: amount } } }),
      prisma.vault.update({ where: { id: staking.id }, data: { balance: { increment: amount } } }),
    ]);

    await prisma.transaction.create({
      data: {
        userId,
        txHash,
        type: 'stake',
        fromAddress: userAddress,
        toAddress: 'vault:staking',
        amount,
        token: 'FLOW',
        status: 'confirmed',
        metadata: { automated: true, ruleType: 'stake', apy: '8.5%' },
        confirmedAt: new Date(),
      },
    });

    logger.info('Automated stake executed', { userId, amount });
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
