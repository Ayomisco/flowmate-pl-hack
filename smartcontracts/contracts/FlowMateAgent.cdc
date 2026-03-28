import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken

/// FlowMateAgent Contract
/// Manages user permissions, autonomy modes, and permission boundaries for the FlowMate system
///
/// Key Features:
/// - User permission boundaries (daily limits, whitelisted recipients)
/// - Three autonomy modes: manual, assist (AI suggestions), autopilot (AI execution)
/// - Delegated key system for authorized operations
/// - Immutable transaction logging for audit trail
/// - Automatic daily limit reset every 24 hours

pub contract FlowMateAgent {

    // ===== Events =====
    pub event UserRegistered(address: Address, autonomyMode: String)
    pub event AutonomyModeUpdated(address: Address, newMode: String)
    pub event RecipientWhitelisted(address: Address, recipient: Address)
    pub event RecipientRemoved(address: Address, recipient: Address)
    pub event TransactionValidated(address: Address, txHash: String, approved: Bool)
    pub event DailyLimitReset(address: Address, resetTime: UFix64)
    pub event AutomationPaused(address: Address)
    pub event AutomationResumed(address: Address)

    // ===== Paths =====
    pub let UserConfigStoragePath: StoragePath
    pub let UserConfigPublicPath: PublicPath
    pub let DelegatedKeyStoragePath: StoragePath
    pub let TransactionLogStoragePath: StoragePath

    init() {
        self.UserConfigStoragePath = /storage/flowmateUserConfig
        self.UserConfigPublicPath = /public/flowmateUserConfig
        self.DelegatedKeyStoragePath = /storage/flowmateDelegatedKey
        self.TransactionLogStoragePath = /storage/flowmateTransactionLog
    }

    // ===== Structures =====

    /// User configuration including autonomy mode and permission boundaries
    pub struct UserConfig {
        pub var autonomyMode: String // "manual", "assist", or "autopilot"
        pub var dailyLimit: UFix64
        pub var dailyUsed: UFix64
        pub var dailyResetAt: UFix64
        pub var automationPaused: Bool
        pub var whitelistedRecipients: [Address]
        pub var createdAt: UFix64

        init(autonomyMode: String, dailyLimit: UFix64) {
            self.autonomyMode = autonomyMode
            self.dailyLimit = dailyLimit
            self.dailyUsed = 0.0
            self.dailyResetAt = getCurrentBlock().timestamp + 86400.0 // 24 hours
            self.automationPaused = false
            self.whitelistedRecipients = []
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    /// Delegated key for AI agent authorization
    pub struct DelegatedKey {
        pub let keyId: UInt32
        pub let delegatedTo: Address // AI agent/service address
        pub let expiresAt: UFix64
        pub let scope: String // e.g., "transfer", "stake", "swap"
        pub var active: Bool

        init(keyId: UInt32, delegatedTo: Address, expiresAt: UFix64, scope: String) {
            self.keyId = keyId
            self.delegatedTo = delegatedTo
            self.expiresAt = expiresAt
            self.scope = scope
            self.active = true
        }
    }

    /// Immutable transaction record for audit trail
    pub struct TransactionRecord {
        pub let txHash: String
        pub let fromAddress: Address
        pub let toAddress: Address
        pub let amount: UFix64
        pub let timestamp: UFix64
        pub let type: String // "send", "swap", "stake", etc.
        pub let status: String // "pending", "confirmed", "failed"

        init(txHash: String, from: Address, to: Address, amount: UFix64, type: String) {
            self.txHash = txHash
            self.fromAddress = from
            self.toAddress = to
            self.amount = amount
            self.timestamp = getCurrentBlock().timestamp
            self.type = type
            self.status = "confirmed"
        }
    }

    // ===== Resources =====

    /// Resource to store user configuration
    pub resource UserConfigResource {
        pub var config: UserConfig
        pub var delegatedKeys: [DelegatedKey]
        pub var transactionLog: [TransactionRecord]

        init(autonomyMode: String, dailyLimit: UFix64) {
            self.config = UserConfig(autonomyMode: autonomyMode, dailyLimit: dailyLimit)
            self.delegatedKeys = []
            self.transactionLog = []
        }

        /// Update user autonomy mode
        pub fun updateAutonomyMode(_ newMode: String) {
            pre {
                newMode == "manual" || newMode == "assist" || newMode == "autopilot" : "Invalid autonomy mode"
            }
            self.config.autonomyMode = newMode
        }

        /// Whitelist a recipient address
        pub fun whitelistRecipient(_ address: Address) {
            if !self.config.whitelistedRecipients.contains(address) {
                self.config.whitelistedRecipients.append(address)
            }
        }

        /// Remove whitelisted recipient
        pub fun removeRecipient(_ address: Address) {
            self.config.whitelistedRecipients.remove(at: self.config.whitelistedRecipients.firstIndex(of: address) ?? panic("Recipient not found"))
        }

        /// Add delegated key for AI authorization
        pub fun addDelegatedKey(_ key: DelegatedKey) {
            self.delegatedKeys.append(key)
        }

        /// Record transaction for audit trail
        pub fun recordTransaction(_ record: TransactionRecord) {
            self.transactionLog.append(record)
        }

        /// Reset daily limit if 24 hours have passed
        pub fun resetDailyLimitIfNeeded() {
            if getCurrentBlock().timestamp >= self.config.dailyResetAt {
                self.config.dailyUsed = 0.0
                self.config.dailyResetAt = getCurrentBlock().timestamp + 86400.0
            }
        }

        /// Check if transfer is allowed within daily limit and whitelist
        pub fun validateTransfer(to: Address, amount: UFix64): Bool {
            self.resetDailyLimitIfNeeded()

            // Check daily limit
            if self.config.dailyUsed + amount > self.config.dailyLimit {
                return false
            }

            // Check whitelist (if any recipients are whitelisted, transfer only allowed to whitelisted)
            if self.config.whitelistedRecipients.length > 0 {
                if !self.config.whitelistedRecipients.contains(to) {
                    return false
                }
            }

            return true
        }

        /// Update daily used amount
        pub fun updateDailyUsed(_ amount: UFix64) {
            self.config.dailyUsed = self.config.dailyUsed + amount
        }

        /// Pause all automation
        pub fun pauseAutomation() {
            self.config.automationPaused = true
        }

        /// Resume automation
        pub fun resumeAutomation() {
            self.config.automationPaused = false
        }
    }

    // ===== Contract Functions =====

    /// Register a new user
    pub fun registerUser(acct: AuthAccount, initialMode: String) {
        let config <- create UserConfigResource(autonomyMode: initialMode, dailyLimit: 10000.0)
        acct.save(<- config, to: self.UserConfigStoragePath)

        emit UserRegistered(address: acct.address, autonomyMode: initialMode)
    }

    /// Get user config (public read)
    pub fun getUserConfig(address: Address): UserConfig? {
        let acct = getAccount(address)
        if let resource = acct.getCapability(self.UserConfigPublicPath).borrow<&UserConfigResource>() {
            return resource.config
        }
        return nil
    }
}
