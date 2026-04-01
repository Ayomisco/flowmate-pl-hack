import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🗑️  Cleaning database...');

  try {
    // Delete in order of dependencies
    await prisma.executionRecord.deleteMany({});
    console.log('✓ Deleted ExecutionRecords');

    await prisma.scheduledTransaction.deleteMany({});
    console.log('✓ Deleted ScheduledTransactions');

    await prisma.rule.deleteMany({});
    console.log('✓ Deleted Rules');

    await prisma.transaction.deleteMany({});
    console.log('✓ Deleted Transactions');

    await prisma.chatMessage.deleteMany({});
    console.log('✓ Deleted ChatMessages');

    await prisma.notification.deleteMany({});
    console.log('✓ Deleted Notifications');

    await prisma.goal.deleteMany({});
    console.log('✓ Deleted Goals');

    await prisma.vault.deleteMany({});
    console.log('✓ Deleted Vaults');

    await prisma.whitelistedRecipient.deleteMany({});
    console.log('✓ Deleted WhitelistedRecipients');

    // Delete Users
    await prisma.user.deleteMany({});
    console.log('✓ Deleted Users');

    console.log('\n✅ Database cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
