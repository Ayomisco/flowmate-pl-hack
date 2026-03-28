access(all) contract ScheduledTransactions {

    access(all) event ScheduleCreated(scheduleId: String, userId: String, frequency: String)
    access(all) event ScheduleExecuted(scheduleId: String, timestamp: UFix64, success: Bool, message: String?)
    access(all) event SchedulePaused(scheduleId: String)
    access(all) event ScheduleResumed(scheduleId: String)
    access(all) event ScheduleCancelled(scheduleId: String)

    access(all) struct Schedule {
        access(all) let scheduleId: String
        access(all) let userId: String
        access(all) let ruleType: String // save | send | dca | stake | bill
        access(all) let frequency: String // daily | weekly | monthly | biweekly
        access(all) let config: {String: String} // Flexible config based on rule type
        access(all) var nextExecution: UFix64
        access(all) var executionCount: UInt64
        access(all) var isActive: Bool

        init(
            scheduleId: String,
            userId: String,
            ruleType: String,
            frequency: String,
            config: {String: String},
            nextExecution: UFix64
        ) {
            self.scheduleId = scheduleId
            self.userId = userId
            self.ruleType = ruleType
            self.frequency = frequency
            self.config = config
            self.nextExecution = nextExecution
            self.executionCount = 0
            self.isActive = true
        }

        access(all) fun updateNextExecution() {
            let now = getCurrentBlock().timestamp
            let interval = self.getFrequencyInterval()
            self.nextExecution = now + interval
        }

        access(all) fun markExecuted() {
            self.executionCount = self.executionCount + 1
            self.updateNextExecution()
        }

        access(all) fun getFrequencyInterval(): UFix64 {
            switch self.frequency {
                case "daily":
                    return 86400.0 // 24 hours
                case "weekly":
                    return 604800.0 // 7 days
                case "biweekly":
                    return 1209600.0 // 14 days
                case "monthly":
                    return 2592000.0 // 30 days
                default:
                    return 86400.0
            }
        }

        access(all) fun pause() {
            self.isActive = false
        }

        access(all) fun resume() {
            self.isActive = true
        }
    }

    access(all) struct ExecutionRecord {
        access(all) let scheduleId: String
        access(all) let timestamp: UFix64
        access(all) let success: Bool
        access(all) let message: String?
        access(all) let txHash: String?

        init(scheduleId: String, success: Bool, message: String?, txHash: String?) {
            self.scheduleId = scheduleId
            self.timestamp = getCurrentBlock().timestamp
            self.success = success
            self.message = message
            self.txHash = txHash
        }
    }

    access(all) resource ScheduleManager {
        access(all) var schedules: {String: Schedule}
        access(all) var executionHistory: [ExecutionRecord]

        init() {
            self.schedules = {}
            self.executionHistory = []
        }

        access(all) fun createSchedule(
            scheduleId: String,
            userId: String,
            ruleType: String,
            frequency: String,
            config: {String: String}
        ) {
            pre {
                self.schedules[scheduleId] == nil: "Schedule already exists"
                ruleType == "save" || ruleType == "send" || ruleType == "dca" || ruleType == "stake" || ruleType == "bill": "Invalid rule type"
            }
            let nextExecution = getCurrentBlock().timestamp + self.calculateNextExecution(frequency: frequency)
            let schedule = Schedule(
                scheduleId: scheduleId,
                userId: userId,
                ruleType: ruleType,
                frequency: frequency,
                config: config,
                nextExecution: nextExecution
            )
            self.schedules[scheduleId] = schedule
            emit ScheduleCreated(scheduleId: scheduleId, userId: userId, frequency: frequency)
        }

        access(all) fun executeSchedule(scheduleId: String): ExecutionRecord {
            pre {
                self.schedules[scheduleId] != nil: "Schedule does not exist"
            }
            var schedule = self.schedules[scheduleId]!

            if !schedule.isActive {
                panic("Schedule is not active")
            }
            if schedule.nextExecution > getCurrentBlock().timestamp {
                panic("Execution time not reached")
            }

            // Execute based on rule type
            var success = false
            var message: String? = nil
            var txHash: String? = nil

            switch schedule.ruleType {
                case "save":
                    success = true
                    message = "Automatic savings executed"
                case "send":
                    success = true
                    message = "Automatic payment sent"
                case "dca":
                    success = true
                    message = "Dollar-cost averaging executed"
                case "stake":
                    success = true
                    message = "Staking rewards claimed"
                case "bill":
                    success = true
                    message = "Bill payment processed"
                default:
                    success = false
                    message = "Unknown rule type"
            }

            if success {
                schedule.markExecuted()
                self.schedules[scheduleId] = schedule
            }

            let record = ExecutionRecord(
                scheduleId: scheduleId,
                success: success,
                message: message,
                txHash: txHash
            )
            self.executionHistory.append(record)
            emit ScheduleExecuted(scheduleId: scheduleId, timestamp: getCurrentBlock().timestamp, success: success, message: message)
            return record
        }

        access(all) fun pauseSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil: "Schedule does not exist"
            }
            var schedule = self.schedules[scheduleId]!
            schedule.pause()
            self.schedules[scheduleId] = schedule
            emit SchedulePaused(scheduleId: scheduleId)
        }

        access(all) fun resumeSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil: "Schedule does not exist"
            }
            var schedule = self.schedules[scheduleId]!
            schedule.resume()
            self.schedules[scheduleId] = schedule
            emit ScheduleResumed(scheduleId: scheduleId)
        }

        access(all) fun cancelSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil: "Schedule does not exist"
            }
            self.schedules.remove(key: scheduleId)
            emit ScheduleCancelled(scheduleId: scheduleId)
        }

        access(all) fun getSchedule(scheduleId: String): Schedule? {
            return self.schedules[scheduleId]
        }

        access(all) fun getAllSchedules(userId: String): [Schedule] {
            var userSchedules: [Schedule] = []
            for scheduleId in self.schedules.keys {
                if let schedule = self.schedules[scheduleId] {
                    if schedule.userId == userId {
                        userSchedules.append(schedule)
                    }
                }
            }
            return userSchedules
        }

        access(all) fun getExecutionHistory(scheduleId: String): [ExecutionRecord] {
            var records: [ExecutionRecord] = []
            for record in self.executionHistory {
                if record.scheduleId == scheduleId {
                    records.append(record)
                }
            }
            return records
        }

        access(self) fun calculateNextExecution(frequency: String): UFix64 {
            switch frequency {
                case "daily":
                    return 86400.0
                case "weekly":
                    return 604800.0
                case "biweekly":
                    return 1209600.0
                case "monthly":
                    return 2592000.0
                default:
                    return 86400.0
            }
        }
    }

    access(all) fun createScheduleManager(): @ScheduleManager {
        return <- create ScheduleManager()
    }

    init() {}
}
