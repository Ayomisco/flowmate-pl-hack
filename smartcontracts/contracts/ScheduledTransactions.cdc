/// ScheduledTransactions Contract
/// Integration with Flow Forte for autonomous, on-chain scheduled operations
///
/// Purpose: Enable FLowMate agents to execute recurring financial operations
/// autonomously via Flow Forte infrastructure, with full on-chain verification
///
/// Schedule Types:
/// - Daily: Execute every day at specified time
/// - Weekly: Execute on specific day of week
/// - BiWeekly: Execute every 2 weeks
/// - Monthly: Execute on specific day of month
/// - Custom: Execute every N days/weeks/months
///
/// Key Features:
/// - Flow Forte integration for scheduled execution
/// - Flexible frequency configuration
/// - Automatic next execution calculation
/// - Execution history with timestamps and results
/// - Pause/resume capability
/// - On-chain audit trail

pub contract ScheduledTransactions {

    // ===== Events =====
    pub event ScheduleCreated(scheduleId: String, frequency: String, nextExecution: UFix64)
    pub event ScheduleExecuted(scheduleId: String, success: Bool, message: String)
    pub event SchedulePaused(scheduleId: String)
    pub event ScheduleResumed(scheduleId: String)
    pub event ScheduleCanceled(scheduleId: String)

    // ===== Paths =====
    pub let UserSchedulesStoragePath: StoragePath
    pub let UserSchedulesPublicPath: PublicPath

    init() {
        self.UserSchedulesStoragePath = /storage/flowmateSchedules
        self.UserSchedulesPublicPath = /public/flowmateSchedules
    }

    // ===== Structures =====

    /// Schedule configuration
    pub struct Schedule {
        pub let scheduleId: String
        pub var frequency: String // "daily", "weekly", "biweekly", "monthly", "custom"
        pub var frequencyDays: Int? // For custom frequency
        pub var dayOfWeek: Int? // 0-6, nil if not weekly
        pub var dayOfMonth: Int? // 1-31, nil if not monthly
        pub var time: String? // HH:mm format, nil for immediate
        pub var status: String // "active", "paused", "completed", "canceled"
        pub var nextExecution: UFix64
        pub var executionCount: Int
        pub var lastExecution: UFix64?
        pub let createdAt: UFix64

        init(scheduleId: String, frequency: String, nextExecution: UFix64) {
            self.scheduleId = scheduleId
            self.frequency = frequency
            self.frequencyDays = nil
            self.dayOfWeek = nil
            self.dayOfMonth = nil
            self.time = nil
            self.status = "active"
            self.nextExecution = nextExecution
            self.executionCount = 0
            self.lastExecution = nil
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    /// Execution record for audit trail
    pub struct ExecutionRecord {
        pub let timestamp: UFix64
        pub let success: Bool
        pub let message: String
        pub let txHash: String?

        init(success: Bool, message: String, txHash: String?) {
            self.timestamp = getCurrentBlock().timestamp
            self.success = success
            self.message = message
            self.txHash = txHash
        }
    }

    // ===== Resources =====

    /// Resource to store user's schedules
    pub resource UserSchedules {
        pub var schedules: {String: Schedule}
        pub var executionHistory: [ExecutionRecord]

        init() {
            self.schedules = {}
            self.executionHistory = []
        }

        /// Create new schedule
        pub fun createSchedule(
            scheduleId: String,
            frequency: String,
            nextExecution: UFix64
        ) {
            pre {
                self.schedules[scheduleId] == nil : "Schedule already exists"
                nextExecution > getCurrentBlock().timestamp : "Next execution must be in the future"
            }

            let schedule = Schedule(scheduleId: scheduleId, frequency: frequency, nextExecution: nextExecution)
            self.schedules[scheduleId] = schedule

            emit ScheduleCreated(scheduleId: scheduleId, frequency: frequency, nextExecution: nextExecution)
        }

        /// Execute schedule (called by Flow Forte)
        pub fun executeSchedule(scheduleId: String, txHash: String): Bool {
            pre {
                self.schedules[scheduleId] != nil : "Schedule not found"
                self.schedules[scheduleId]!.status == "active" : "Schedule is not active"
            }

            let schedule = self.schedules[scheduleId]!

            // Update execution metrics
            schedule.executionCount = schedule.executionCount + 1
            schedule.lastExecution = getCurrentBlock().timestamp

            // Calculate next execution
            schedule.nextExecution = self.calculateNextExecution(schedule)

            // Record execution
            let record = ExecutionRecord(success: true, message: "Executed successfully", txHash: txHash)
            self.executionHistory.append(record)

            emit ScheduleExecuted(scheduleId: scheduleId, success: true, message: "Executed")

            return true
        }

        /// Pause schedule
        pub fun pauseSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil : "Schedule not found"
            }

            self.schedules[scheduleId]!.status = "paused"
            emit SchedulePaused(scheduleId: scheduleId)
        }

        /// Resume schedule
        pub fun resumeSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil : "Schedule not found"
            }

            self.schedules[scheduleId]!.status = "active"
            emit ScheduleResumed(scheduleId: scheduleId)
        }

        /// Cancel schedule
        pub fun cancelSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil : "Schedule not found"
            }

            self.schedules[scheduleId]!.status = "canceled"
            emit ScheduleCanceled(scheduleId: scheduleId)
        }

        /// Calculate next execution timestamp
        pub fun calculateNextExecution(_ schedule: Schedule): UFix64 {
            let now = getCurrentBlock().timestamp
            let secondsPerDay: UFix64 = 86400.0

            switch schedule.frequency {
            case "daily":
                return now + secondsPerDay
            case "weekly":
                return now + (secondsPerDay * 7.0)
            case "biweekly":
                return now + (secondsPerDay * 14.0)
            case "monthly":
                return now + (secondsPerDay * 30.0)
            case "custom":
                if let days = schedule.frequencyDays {
                    return now + (secondsPerDay * UFix64(days))
                }
                return now + secondsPerDay
            default:
                return now + secondsPerDay
            }
        }

        /// Get schedule by ID
        pub fun getSchedule(scheduleId: String): Schedule? {
            return self.schedules[scheduleId]
        }

        /// Get all user schedules
        pub fun getAllSchedules(): [Schedule] {
            let schedules: [Schedule] = []
            for scheduleId in self.schedules.keys {
                schedules.append(self.schedules[scheduleId]!)
            }
            return schedules
        }

        /// Get active schedules (ready to execute)
        pub fun getActiveSchedules(): [Schedule] {
            let active: [Schedule] = []
            let now = getCurrentBlock().timestamp

            for scheduleId in self.schedules.keys {
                let schedule = self.schedules[scheduleId]!
                if schedule.status == "active" && schedule.nextExecution <= now {
                    active.append(schedule)
                }
            }
            return active
        }
    }

    // ===== Contract Functions =====

    /// Initialize schedules for new user
    pub fun initializeSchedules(acct: AuthAccount) {
        let schedules <- create UserSchedules()
        acct.save(<- schedules, to: self.UserSchedulesStoragePath)
    }

    /// Get user's schedules (public read)
    pub fun getUserSchedules(address: Address): [Schedule] {
        let acct = getAccount(address)
        if let schedules = acct.getCapability(self.UserSchedulesPublicPath).borrow<&UserSchedules>() {
            return schedules.getAllSchedules()
        }
        return []
    }
}
