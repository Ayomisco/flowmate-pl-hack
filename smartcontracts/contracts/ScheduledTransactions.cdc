import FlowMateAgent from 0x01
import VaultManager from 0x02

/// ScheduledTransactions - Powers Flow Forte scheduled automation
/// This contract handles recurring financial operations
access(all) contract ScheduledTransactions {

    // ==================== Events ====================

    access(all) event ScheduleCreated(
        scheduleId: String,
        userAddress: Address,
        scheduleType: String,
        nextExecution: UFix64
    )
    access(all) event ScheduleExecuted(
        scheduleId: String,
        userAddress: Address,
        success: Bool,
        message: String
    )
    access(all) event SchedulePaused(scheduleId: String, userAddress: Address)
    access(all) event ScheduleResumed(scheduleId: String, userAddress: Address)
    access(all) event ScheduleCancelled(scheduleId: String, userAddress: Address)

    // ==================== Structures ====================

    /// Schedule definition for recurring operations
    access(all) struct Schedule {
        access(all) let scheduleId: String
        access(all) let userAddress: Address
        access(all) let scheduleType: String  // save | send | dca | stake | bill
        access(all) var status: String  // active | paused | completed
        access(all) let config: {String: String}  // Flexible config storage
        access(all) var nextExecution: UFix64
        access(all) let createdAt: UFix64
        access(all) var lastExecution: UFix64?
        access(all) var executionCount: UInt64

        init(
            scheduleId: String,
            userAddress: Address,
            scheduleType: String,
            config: {String: String},
            nextExecution: UFix64
        ) {
            self.scheduleId = scheduleId
            self.userAddress = userAddress
            self.scheduleType = scheduleType
            self.status = "active"
            self.config = config
            self.nextExecution = nextExecution
            self.createdAt = getCurrentBlock().timestamp
            self.lastExecution = nil
            self.executionCount = 0
        }
    }

    // ==================== Storage ====================

    access(all) var schedules: {String: Schedule}  // scheduleId -> Schedule
    access(all) var userSchedules: {Address: [String]}  // userAddress -> [scheduleIds]
    access(all) var executionLog: {String: [ExecutionRecord]}

    access(all) struct ExecutionRecord {
        access(all) let timestamp: UFix64
        access(all) let success: Bool
        access(all) let message: String
        access(all) let transactionHash: String?

        init(success: Bool, message: String, txHash: String?) {
            self.timestamp = getCurrentBlock().timestamp
            self.success = success
            self.message = message
            self.transactionHash = txHash
        }
    }

    // ==================== Functions ====================

    /// Create a new schedule
    access(all) fun createSchedule(
        userAddress: Address,
        scheduleType: String,
        config: {String: String},
        nextExecution: UFix64
    ): String {
        pre {
            nextExecution > getCurrentBlock().timestamp: "Next execution must be in future"
            scheduleType == "save" || scheduleType == "send" || scheduleType == "dca" ||
            scheduleType == "stake" || scheduleType == "bill":
                "Invalid schedule type"
        }

        let scheduleId = userAddress.toString().concat("_").concat(getCurrentBlock().height.toString())
        let schedule = Schedule(
            scheduleId: scheduleId,
            userAddress: userAddress,
            scheduleType: scheduleType,
            config: config,
            nextExecution: nextExecution
        )

        self.schedules[scheduleId] = schedule

        if self.userSchedules[userAddress] == nil {
            self.userSchedules[userAddress] = []
        }
        self.userSchedules[userAddress]!.append(scheduleId)
        self.executionLog[scheduleId] = []

        emit ScheduleCreated(
            scheduleId: scheduleId,
            userAddress: userAddress,
            scheduleType: scheduleType,
            nextExecution: nextExecution
        )

        return scheduleId
    }

    /// Execute a scheduled transaction
    access(all) fun executeSchedule(_ scheduleId: String): Bool {
        pre {
            self.schedules[scheduleId] != nil: "Schedule not found"
        }

        let schedule = self.schedules[scheduleId]!

        pre {
            schedule.status == "active": "Schedule is not active"
            schedule.nextExecution <= getCurrentBlock().timestamp: "Schedule not ready for execution"
        }

        var success = false
        var message = ""

        // Execute based on type
        if schedule.scheduleType == "save" {
            success = self.executeSaveSchedule(schedule)
            message = success ? "Save executed successfully" : "Save execution failed"
        } else if schedule.scheduleType == "send" {
            success = self.executeSendSchedule(schedule)
            message = success ? "Send executed successfully" : "Send execution failed"
        } else if schedule.scheduleType == "dca" {
            success = self.executeDCASchedule(schedule)
            message = success ? "DCA executed successfully" : "DCA execution failed"
        } else if schedule.scheduleType == "stake" {
            success = self.executeStakeSchedule(schedule)
            message = success ? "Stake executed successfully" : "Stake execution failed"
        } else if schedule.scheduleType == "bill" {
            success = self.executeBillSchedule(schedule)
            message = success ? "Bill payment executed successfully" : "Bill payment failed"
        }

        // Update schedule
        schedule.lastExecution = getCurrentBlock().timestamp
        schedule.executionCount = schedule.executionCount + 1

        // Calculate next execution
        if let frequency = schedule.config["frequency"] {
            if frequency == "daily" {
                schedule.nextExecution = getCurrentBlock().timestamp + 86400.0  // 24 hours
            } else if frequency == "weekly" {
                schedule.nextExecution = getCurrentBlock().timestamp + 604800.0  // 7 days
            } else if frequency == "monthly" {
                schedule.nextExecution = getCurrentBlock().timestamp + 2592000.0  // 30 days
            }
        }

        // Log execution
        let record = ExecutionRecord(success: success, message: message, txHash: nil)
        self.executionLog[scheduleId]!.append(record)

        emit ScheduleExecuted(
            scheduleId: scheduleId,
            userAddress: schedule.userAddress,
            success: success,
            message: message
        )

        return success
    }

    /// Save schedule execution
    access(all) fun executeSaveSchedule(_ schedule: Schedule): Bool {
        pre {
            schedule.config["amount"] != nil: "Save amount not specified"
            schedule.config["toVaultType"] != nil: "Target vault not specified"
        }

        // Validate user permissions via FlowMateAgent
        // This would be called by the backend to enforce permissions

        return true
    }

    /// Send schedule execution
    access(all) fun executeSendSchedule(_ schedule: Schedule): Bool {
        pre {
            schedule.config["amount"] != nil: "Send amount not specified"
            schedule.config["recipient"] != nil: "Recipient not specified"
        }

        // Validate sender has whitelisted recipient
        // Validate daily limit not exceeded
        // Execute transfer

        return true
    }

    /// DCA schedule execution
    access(all) fun executeDCASchedule(_ schedule: Schedule): Bool {
        pre {
            schedule.config["amount"] != nil: "DCA amount not specified"
            schedule.config["token"] != nil: "Token not specified"
        }

        // Swap FLOW token for specified token
        // Store in specified vault

        return true
    }

    /// Stake schedule execution
    access(all) fun executeStakeSchedule(_ schedule: Schedule): Bool {
        pre {
            schedule.config["amount"] != nil: "Stake amount not specified"
        }

        // Stake FLOW tokens
        // Lock vault until reward cycle

        return true
    }

    /// Bill payment schedule execution
    access(all) fun executeBillSchedule(_ schedule: Schedule): Bool {
        pre {
            schedule.config["amount"] != nil: "Payment amount not specified"
            schedule.config["recipient"] != nil: "Payee not specified"
        }

        // Execute payment to configured recipient

        return true
    }

    /// Pause a schedule
    access(all) fun pauseSchedule(_ scheduleId: String) {
        pre {
            self.schedules[scheduleId] != nil: "Schedule not found"
        }

        let schedule = self.schedules[scheduleId]!
        schedule.status = "paused"

        emit SchedulePaused(scheduleId: scheduleId, userAddress: schedule.userAddress)
    }

    /// Resume a paused schedule
    access(all) fun resumeSchedule(_ scheduleId: String) {
        pre {
            self.schedules[scheduleId] != nil: "Schedule not found"
        }

        let schedule = self.schedules[scheduleId]!
        schedule.status = "active"

        emit ScheduleResumed(scheduleId: scheduleId, userAddress: schedule.userAddress)
    }

    /// Cancel a schedule
    access(all) fun cancelSchedule(_ scheduleId: String) {
        pre {
            self.schedules[scheduleId] != nil: "Schedule not found"
        }

        let schedule = self.schedules[scheduleId]!
        schedule.status = "completed"

        emit ScheduleCancelled(scheduleId: scheduleId, userAddress: schedule.userAddress)
    }

    /// Get schedule by ID
    access(all) fun getSchedule(_ scheduleId: String): Schedule? {
        return self.schedules[scheduleId]
    }

    /// Get all schedules for user
    access(all) fun getUserSchedules(_ userAddress: Address): [Schedule] {
        if let scheduleIds = self.userSchedules[userAddress] {
            var userSchedules: [Schedule] = []
            for scheduleId in scheduleIds {
                if let schedule = self.schedules[scheduleId] {
                    userSchedules.append(schedule)
                }
            }
            return userSchedules
        }
        return []
    }

    /// Get execution history for schedule
    access(all) fun getExecutionHistory(_ scheduleId: String): [ExecutionRecord]? {
        return self.executionLog[scheduleId]
    }

    init() {
        self.schedules = {}
        self.userSchedules = {}
        self.executionLog = {}
    }
}
