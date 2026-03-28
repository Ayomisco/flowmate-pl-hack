import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x7e60df042a9c0868

pub contract FlowMateAgent {
    
    // Events
    pub event UserRegistered(userId: String, address: Address)
    pub event AutonomyModeUpdated(userId: String, mode: String)
    pub event RecipientWhitelisted(userId: String, recipient: Address)
    pub event TransactionValidated(userId: String, recipient: Address, amount: UFix64, allowed: Bool)
    pub event AutomationPaused(userId: String)
    pub event AutomationResumed(userId: String)

    // Structs
    pub struct UserConfig {
        pub let userId: String
        pub let autonomyMode: String // manual | assist | autopilot
        pub let dailyLimit: UFix64
        pub let dailySpent: UFix64
        pub let lastReset: UFix64
        pub let whitelistedRecipients: [Address]
        pub let isAutomationPaused: Bool

        init(
            userId: String,
            autonomyMode: String,
            dailyLimit: UFix64,
            dailySpent: UFix64,
            lastReset: UFix64,
            whitelistedRecipients: [Address],
            isAutomationPaused: Bool
        ) {
            self.userId = userId
            self.autonomyMode = autonomyMode
            self.dailyLimit = dailyLimit
            self.dailySpent = dailySpent
            self.lastReset = lastReset
            self.whitelistedRecipients = whitelistedRecipients
            self.isAutomationPaused = isAutomationPaused
        }
    }

    pub struct DelegatedKey {
        pub let keyId: UInt64
        pub let publicKey: String
        pub let weight: UInt64
        pub let createdAt: UFix64

        init(keyId: UInt64, publicKey: String, weight: UInt64, createdAt: UFix64) {
            self.keyId = keyId
            self.publicKey = publicKey
            self.weight = weight
            self.createdAt = createdAt
        }
    }

    pub struct TransactionRecord {
        pub let id: String
        pub let userId: String
        pub let from: Address
        pub let to: Address
        pub let amount: UFix64
        pub let timestamp: UFix64
        pub let txHash: String
        pub let status: String

        init(
            id: String,
            userId: String,
            from: Address,
            to: Address,
            amount: UFix64,
            timestamp: UFix64,
            txHash: String,
            status: String
        ) {
            self.id = id
            self.userId = userId
            self.from = from
            self.to = to
            self.amount = amount
            self.timestamp = timestamp
            self.txHash = txHash
            self.status = status
        }
    }

    pub resource UserAccount {
        pub var config: UserConfig
        pub var delegatedKeys: [DelegatedKey]
        pub var transactionHistory: [TransactionRecord]

        init(userId: String, autonomyMode: String, dailyLimit: UFix64) {
            self.config = UserConfig(
                userId: userId,
                autonomyMode: autonomyMode,
                dailyLimit: dailyLimit,
                dailySpent: 0.0,
                lastReset: getCurrentBlock().timestamp,
                whitelistedRecipients: [],
                isAutomationPaused: false
            )
            self.delegatedKeys = []
            self.transactionHistory = []
        }

        pub fun updateAutonomyMode(mode: String) {
            pre {
                mode == "manual" || mode == "assist" || mode == "autopilot": "Invalid autonomy mode"
            }
            self.config.autonomyMode = mode
            emit AutonomyModeUpdated(userId: self.config.userId, mode: mode)
        }

        pub fun whitelistRecipient(address: Address) {
            if !self.config.whitelistedRecipients.contains(address) {
                self.config.whitelistedRecipients.append(address)
                emit RecipientWhitelisted(userId: self.config.userId, recipient: address)
            }
        }

        pub fun validateTransfer(recipient: Address, amount: UFix64): Bool {
            // Reset daily limit if 24 hours have passed
            let now = getCurrentBlock().timestamp
            if now - self.config.lastReset >= 86400.0 {
                self.config.dailySpent = 0.0
                self.config.lastReset = now
            }

            // Check whitelist
            if self.config.autonomyMode == "autopilot" || self.config.autonomyMode == "assist" {
                if !self.config.whitelistedRecipients.contains(recipient) {
                    emit TransactionValidated(userId: self.config.userId, recipient: recipient, amount: amount, allowed: false)
                    return false
                }
            }

            // Check daily limit
            if self.config.dailySpent + amount > self.config.dailyLimit {
                emit TransactionValidated(userId: self.config.userId, recipient: recipient, amount: amount, allowed: false)
                return false
            }

            self.config.dailySpent = self.config.dailySpent + amount
            emit TransactionValidated(userId: self.config.userId, recipient: recipient, amount: amount, allowed: true)
            return true
        }

        pub fun addDelegatedKey(publicKey: String, weight: UInt64) {
            let keyId = UInt64(self.delegatedKeys.length)
            let key = DelegatedKey(
                keyId: keyId,
                publicKey: publicKey,
                weight: weight,
                createdAt: getCurrentBlock().timestamp
            )
            self.delegatedKeys.append(key)
        }

        pub fun recordTransaction(
            id: String,
            from: Address,
            to: Address,
            amount: UFix64,
            txHash: String,
            status: String
        ) {
            let record = TransactionRecord(
                id: id,
                userId: self.config.userId,
                from: from,
                to: to,
                amount: amount,
                timestamp: getCurrentBlock().timestamp,
                txHash: txHash,
                status: status
            )
            self.transactionHistory.append(record)
        }

        pub fun pauseAutomation() {
            self.config.isAutomationPaused = true
            emit AutomationPaused(userId: self.config.userId)
        }

        pub fun resumeAutomation() {
            self.config.isAutomationPaused = false
            emit AutomationResumed(userId: self.config.userId)
        }

        pub fun getConfig(): UserConfig {
            return self.config
        }

        pub fun getTransactionHistory(): [TransactionRecord] {
            return self.transactionHistory
        }
    }

    pub fun registerUser(userId: String, autonomyMode: String, dailyLimit: UFix64): @UserAccount {
        pre {
            autonomyMode == "manual" || autonomyMode == "assist" || autonomyMode == "autopilot": "Invalid autonomy mode"
            dailyLimit > 0.0: "Daily limit must be positive"
        }
        emit UserRegistered(userId: userId, address: getCurrentBlock().timestamp as Address)
        return <- create UserAccount(userId: userId, autonomyMode: autonomyMode, dailyLimit: dailyLimit)
    }

    init() {}
}
