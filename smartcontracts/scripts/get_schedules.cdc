import ScheduledTransactions from 0xScheduledTransactions

/// Script to retrieve user's scheduled transactions
/// Read-only query - does not create a transaction

pub fun main(addr: Address): [ScheduledTransactions.Schedule] {
  return ScheduledTransactions.getUserSchedules(address: addr)
}
