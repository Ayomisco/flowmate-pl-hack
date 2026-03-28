-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('save', 'send', 'receive', 'swap', 'stake', 'dca', 'bill');
CREATE TYPE "RuleStatus" AS ENUM ('active', 'paused', 'completed');
CREATE TYPE "TransactionType" AS ENUM ('save', 'send', 'receive', 'swap', 'stake');
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE "VaultType" AS ENUM ('available', 'savings', 'emergency', 'staking');
CREATE TYPE "NotificationType" AS ENUM ('action_executed', 'payment_sent', 'goal_progress', 'alert');

-- CreateTable users
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "flowAddress" TEXT,
    "magicUserId" TEXT,
    "autonomyMode" TEXT NOT NULL DEFAULT 'assist',
    "dailyLimit" DECIMAL(65,8) NOT NULL DEFAULT 50000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_flowAddress_key" ON "User"("flowAddress");
CREATE UNIQUE INDEX "User_magicUserId_key" ON "User"("magicUserId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_flowAddress_idx" ON "User"("flowAddress");

-- CreateTable rules
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "config" JSONB NOT NULL,
    "nextExecution" TIMESTAMP(3),
    "lastExecution" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rule_userId_idx" ON "Rule"("userId");
CREATE INDEX "Rule_status_idx" ON "Rule"("status");
CREATE INDEX "Rule_nextExecution_idx" ON "Rule"("nextExecution");

-- CreateTable scheduled_transactions
CREATE TABLE "ScheduledTransaction" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "time" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "nextExecution" TIMESTAMP(3),
    "lastExecution" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledTransaction_scheduleId_key" ON "ScheduledTransaction"("scheduleId");
CREATE INDEX "ScheduledTransaction_ruleId_idx" ON "ScheduledTransaction"("ruleId");
CREATE INDEX "ScheduledTransaction_status_idx" ON "ScheduledTransaction"("status");
CREATE INDEX "ScheduledTransaction_nextExecution_idx" ON "ScheduledTransaction"("nextExecution");

-- CreateTable transactions
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT,
    "txHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "amount" DECIMAL(65,8) NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'FLOW',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "explorerUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_txHash_idx" ON "Transaction"("txHash");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateTable vaults
CREATE TABLE "Vault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL(65,8) NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vault_userId_type_key" ON "Vault"("userId", "type");
CREATE INDEX "Vault_userId_idx" ON "Vault"("userId");
CREATE INDEX "Vault_type_idx" ON "Vault"("type");

-- CreateTable goals
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(65,8) NOT NULL,
    "currentAmount" DECIMAL(65,8) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateTable chat_messages
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parsedIntent" JSONB,
    "confidenceScore" DECIMAL(65,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateTable notifications
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledTransaction" ADD CONSTRAINT "ScheduledTransaction_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Vault" ADD CONSTRAINT "Vault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
