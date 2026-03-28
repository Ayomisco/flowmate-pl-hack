-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('save', 'send', 'receive', 'swap', 'stake', 'dca', 'bill');
CREATE TYPE "RuleStatus" AS ENUM ('active', 'paused', 'completed');
CREATE TYPE "VaultType" AS ENUM ('available', 'savings', 'emergency', 'staking');
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE "TransactionType" AS ENUM ('send', 'receive', 'transfer', 'swap', 'stake');
CREATE TYPE "AutonomyMode" AS ENUM ('manual', 'assist', 'autopilot');
CREATE TYPE "NotificationType" AS ENUM ('action_executed', 'payment_sent', 'goal_progress', 'alert');

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "flowAddress" TEXT NOT NULL,
    "magicUserId" TEXT,
    "autonomyMode" "AutonomyMode" NOT NULL DEFAULT 'manual',
    "dailyLimit" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "dailyUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_flowAddress_key" ON "User"("flowAddress");
CREATE UNIQUE INDEX "User_magicUserId_key" ON "User"("magicUserId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_flowAddress_idx" ON "User"("flowAddress");

-- CreateTable Rule
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RuleType" NOT NULL,
    "status" "RuleStatus" NOT NULL DEFAULT 'active',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "nextExecution" TIMESTAMP(3),
    "lastExecution" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Rule_userId_idx" ON "Rule"("userId");
CREATE INDEX "Rule_status_idx" ON "Rule"("status");
CREATE INDEX "Rule_type_idx" ON "Rule"("type");

-- CreateTable ScheduledTransaction
CREATE TABLE "ScheduledTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "time" TEXT,
    "status" "RuleStatus" NOT NULL DEFAULT 'active',
    "nextExecution" TIMESTAMP(3) NOT NULL,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecution" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ScheduledTransaction_scheduleId_key" ON "ScheduledTransaction"("scheduleId");
CREATE INDEX "ScheduledTransaction_ruleId_idx" ON "ScheduledTransaction"("ruleId");
CREATE INDEX "ScheduledTransaction_status_idx" ON "ScheduledTransaction"("status");
CREATE INDEX "ScheduledTransaction_nextExecution_idx" ON "ScheduledTransaction"("nextExecution");

-- CreateTable Vault
CREATE TABLE "Vault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VaultType" NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Vault_userId_type_key" ON "Vault"("userId", "type");
CREATE INDEX "Vault_userId_idx" ON "Vault"("userId");

-- CreateTable Goal
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "RuleStatus" NOT NULL DEFAULT 'active',
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateTable Transaction
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT,
    "txHash" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'FLOW',
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCost" DOUBLE PRECISION,
    "metadata" JSONB,
    "explorerUrl" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX "Transaction_txHash_idx" ON "Transaction"("txHash");
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateTable ChatMessage
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parsedIntent" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateTable WhitelistedRecipient
CREATE TABLE "WhitelistedRecipient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientAddr" TEXT NOT NULL,
    "alias" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhitelistedRecipient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WhitelistedRecipient_userId_recipientAddr_key" ON "WhitelistedRecipient"("userId", "recipientAddr");
CREATE INDEX "WhitelistedRecipient_userId_idx" ON "WhitelistedRecipient"("userId");

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledTransaction" ADD CONSTRAINT "ScheduledTransaction_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vault" ADD CONSTRAINT "Vault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
