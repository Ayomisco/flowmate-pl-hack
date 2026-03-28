pub contract ScheduledTransactions {
    
    pub event ScheduleCreated(scheduleId: String, userId: String, frequency: String)
    pub event ScheduleExecuted(scheduleId: String, timestamp: UFix64, success: Bool, message: String?)
    pub event SchedulePaused(scheduleId: String)
    pub event ScheduleResumed(scheduleId: String)
    pub event ScheduleCancelled(scheduleId: String)

    pub struct Schedule {
        pub let scheduleId: String
        pub let userId: String
        pub let ruleType: String // save | send | dca | stake | bill
        pub let frequency: String // daily | weekly | monthly | biweekly
        pub let config: {String: String} // Flexible config based on rule type
        pub var nextExecution: UFix64
        pub var executionCount: UInt64
        pub var isActive: Bool

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

        pub fun updateNextExecution() {
            let now = getCurrentBlock().timestamp
            let interval = self.getFrequencyInterval()
            self.nextExecution = now + interval
        }

        pub fun getFrequencyInterval(): UFix64 {
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

        pub fun pause() {
            self.isActive = false
        }

        pub fun resume() {
            self.isActive = true
        }
    }

    pub struct ExecutionRecord {
        pub let scheduleId: String
        pub let timestamp: UFix64
        pub let success: Bool
        pub let message: String?
        pub let txHash: String?

        init(scheduleId: String, success: Bool, message: String?, txHash: String?) {
            self.scheduleId = scheduleId
            self.timestamp = getCurrentBlock().timestamp
            self.success = success
            self.message = message
            self.txHash = txHash
        }
    }

    pub resource ScheduleManager {
        pub var schedules: {String: Schedule}
        pub var executionHistory: [ExecutionRecord]

        init() {
            self.schedules = {}
            self.executionHistory = []
        }

        pub fun createSchedule(
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

        pub fun executeSchedule(scheduleId: String): ExecutionRecord {
            pre {
                self.schedules[scheduleId] != nil: "Schedule does not exist"
            }
            let schedule = self.schedules[scheduleId]!
            pre {
                schedule.isActive: "Schedule is not active"
                schedule.nextExecution <= getCurrentBlock().timestamp: "Execution time not reached"
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
                schedule.executionCount = schedule.executionCount + 1
                schedule.updateNextExecution()
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

        pub fun pauseSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil: "Schedule does not exist"
            }
            self.schedules[scheduleId]!.pause()
            emit SchedulePaused(scheduleId: scheduleId)
        }

        pub fun resumeSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil: "Schedule does not exist"
            }
            self.schedules[scheduleId]!.resume()
            emit ScheduleResumed(scheduleId: scheduleId)
        }

        pub fun cancelSchedule(scheduleId: String) {
            pre {
                self.schedules[scheduleId] != nil: "Schedule does not exist"
            }
            self.schedules.remove(key: scheduleId)
            emit ScheduleCancelled(scheduleId: scheduleId)
        }

        pub fun getSchedule(scheduleId: String): Schedule? {
            return self.schedules[scheduleId]
        }

        pub fun getAllSchedules(userId: String): [Schedule] {
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

        pub fun getExecutionHistory(scheduleId: String): [ExecutionRecord] {
            var records: [ExecutionRecord] = []
            for record in self.executionHistory {
                if record.scheduleId == scheduleId {
                    records.append(record)
                }
            }
            return records
        }

        priv fun calculateNextExecution(frequency: String): UFix64 {
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

    pub fun createScheduleManager(): @ScheduleManager {
        return <- create ScheduleManager()
    }

    init() {}
}
