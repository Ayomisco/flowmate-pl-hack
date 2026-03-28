import ScheduledTransactions from 0xc26f3fa2883a46db

/// Get scheduled transactions for a given address
access(all) fun main(addr: Address): [ScheduledTransactions.Schedule] {
    let account = getAccount(addr)
    let managerCap = account.capabilities.borrow<&ScheduledTransactions.ScheduleManager>(/public/scheduleManager)

    if managerCap == nil {
        return []
    }

    return managerCap!.getAllSchedules(userId: addr.toString())
}
