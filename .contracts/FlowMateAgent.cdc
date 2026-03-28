import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

access(all) contract FlowMateAgent {

    // Events
    access(all) event UserRegistered(userId: String, address: Address)
    access(all) event AutonomyModeUpdated(userId: String, mode: String)
    access(all) event RecipientWhitelisted(userId: String, recipient: Address)
    access(all) event TransactionValidated(userId: String, recipient: Address, amount: UFix64, allowed: Bool)
    access(all) event AutomationPaused(userId: String)
    access(all) event AutomationResumed(userId: String)

    // Structs
    access(all) struct UserConfig {
        access(all) let userId: String
        access(all) let autonomyMode: String // manual | assist | autopilot
        access(all) let dailyLimit: UFix64
        access(all) let dailySpent: UFix64
        access(all) let lastReset: UFix64
        access(all) let whitelistedRecipients: [Address]
        access(all) let isAutomationPaused: Bool

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

    access(all) struct DelegatedKey {
        access(all) let keyId: UInt64
        access(all) let publicKey: String
        access(all) let weight: UInt64
        access(all) let createdAt: UFix64

        init(keyId: UInt64, publicKey: String, weight: UInt64, createdAt: UFix64) {
            self.keyId = keyId
            self.publicKey = publicKey
            self.weight = weight
            self.createdAt = createdAt
        }
    }

    access(all) struct TransactionRecord {
        access(all) let id: String
        access(all) let userId: String
        access(all) let from: Address
        access(all) let to: Address
        access(all) let amount: UFix64
        access(all) let timestamp: UFix64
        access(all) let txHash: String
        access(all) let status: String

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

    access(all) resource UserAccount {
        access(all) var config: UserConfig
        access(all) var delegatedKeys: [DelegatedKey]
        access(all) var transactionHistory: [TransactionRecord]

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

        access(all) fun updateAutonomyMode(mode: String) {
            pre {
                mode == "manual" || mode == "assist" || mode == "autopilot": "Invalid autonomy mode"
            }
            self.config.autonomyMode = mode
            emit AutonomyModeUpdated(userId: self.config.userId, mode: mode)
        }

        access(all) fun whitelistRecipient(address: Address) {
            if !self.config.whitelistedRecipients.contains(address) {
                self.config.whitelistedRecipients.append(address)
                emit RecipientWhitelisted(userId: self.config.userId, recipient: address)
            }
        }

        access(all) fun validateTransfer(recipient: Address, amount: UFix64): Bool {
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

        access(all) fun addDelegatedKey(publicKey: String, weight: UInt64) {
            let keyId = UInt64(self.delegatedKeys.length)
            let key = DelegatedKey(
                keyId: keyId,
                publicKey: publicKey,
                weight: weight,
                createdAt: getCurrentBlock().timestamp
            )
            self.delegatedKeys.append(key)
        }

        access(all) fun recordTransaction(
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

        access(all) fun pauseAutomation() {
            self.config.isAutomationPaused = true
            emit AutomationPaused(userId: self.config.userId)
        }

        access(all) fun resumeAutomation() {
            self.config.isAutomationPaused = false
            emit AutomationResumed(userId: self.config.userId)
        }

        access(all) fun getConfig(): UserConfig {
            return self.config
        }

        access(all) fun getTransactionHistory(): [TransactionRecord] {
            return self.transactionHistory
        }
    }

    access(all) fun registerUser(userId: String, autonomyMode: String, dailyLimit: UFix64): @UserAccount {
        pre {
            autonomyMode == "manual" || autonomyMode == "assist" || autonomyMode == "autopilot": "Invalid autonomy mode"
            dailyLimit > 0.0: "Daily limit must be positive"
        }
        emit UserRegistered(userId: userId, address: getCurrentBlock().timestamp as Address)
        return <- create UserAccount(userId: userId, autonomyMode: autonomyMode, dailyLimit: dailyLimit)
    }

    init() {}
}
