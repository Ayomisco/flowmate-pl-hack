import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

/// FlowMateAgent - Main autonomous financial agent contract
/// Handles user permissions, vault interactions, and delegated key management
access(all) contract FlowMateAgent {

    // ==================== Events ====================

    access(all) event UserRegistered(userAddress: Address, autonomyMode: String)
    access(all) event PermissionsUpdated(userAddress: Address, dailyLimit: UFix64)
    access(all) event RecipientWhitelisted(userAddress: Address, recipient: Address, name: String)
    access(all) event RecipientRemoved(userAddress: Address, recipient: Address)
    access(all) event DailyTransfersUpdated(userAddress: Address, transferred: UFix64)
    access(all) event AutomationStatusChanged(userAddress: Address, status: String)

    // ==================== Structures ====================

    /// User configuration and permissions
    access(all) struct UserConfig {
        access(all) let userAddress: Address
        access(all) var autonomyMode: String  // manual | assist | autopilot
        access(all) var dailyLimit: UFix64
        access(all) var dailyTransferred: UFix64
        access(all) var lastReset: UFix64
        access(all) var whitelistedRecipients: {Address: String}  // Address -> Name
        access(all) var allowedActions: [String]
        access(all) var automationActive: Bool

        init(
            userAddress: Address,
            dailyLimit: UFix64,
            autonomyMode: String
        ) {
            self.userAddress = userAddress
            self.autonomyMode = autonomyMode
            self.dailyLimit = dailyLimit
            self.dailyTransferred = 0.0
            self.lastReset = getCurrentBlock().timestamp
            self.whitelistedRecipients = {}
            self.allowedActions = ["save", "send", "receive", "swap", "stake", "pause"]
            self.automationActive = true
        }
    }

    /// Delegated key structure for agent authorization
    access(all) struct DelegatedKey {
        access(all) let keyId: UInt32
        access(all) let publicKey: String
        access(all) let hashAlgorithm: String
        access(all) let signAlgorithm: String
        access(all) let weight: UInt8

        init(
            keyId: UInt32,
            publicKey: String,
            hashAlgorithm: String,
            signAlgorithm: String,
            weight: UInt8
        ) {
            self.keyId = keyId
            self.publicKey = publicKey
            self.hashAlgorithm = hashAlgorithm
            self.signAlgorithm = signAlgorithm
            self.weight = weight
        }
    }

    // ==================== Storage ====================

    access(all) var userConfigs: {Address: UserConfig}
    access(all) var delegatedKeys: {Address: DelegatedKey}
    access(all) var userOperationLog: {Address: [TransactionRecord]}

    access(all) struct TransactionRecord {
        access(all) let timestamp: UFix64
        access(all) let action: String
        access(all) let fromVault: String
        access(all) let toVault: String
        access(all) let amount: UFix64
        access(all) let recipient: Address?
        access(all) let status: String
        access(all) let txHash: String?

        init(
            action: String,
            fromVault: String,
            toVault: String,
            amount: UFix64,
            recipient: Address?,
            status: String,
            txHash: String?
        ) {
            self.timestamp = getCurrentBlock().timestamp
            self.action = action
            self.fromVault = fromVault
            self.toVault = toVault
            self.amount = amount
            self.recipient = recipient
            self.status = status
            self.txHash = txHash
        }
    }

    // ==================== Functions ====================

    /// Register a user with initial permissions
    access(all) fun registerUser(
        userAddress: Address,
        dailyLimit: UFix64,
        autonomyMode: String
    ) {
        pre {
            dailyLimit > 0.0: "Daily limit must be greater than 0"
            autonomyMode == "manual" || autonomyMode == "assist" || autonomyMode == "autopilot":
                "Invalid autonomy mode"
        }

        let userConfig = UserConfig(
            userAddress: userAddress,
            dailyLimit: dailyLimit,
            autonomyMode: autonomyMode
        )

        self.userConfigs[userAddress] = userConfig
        self.userOperationLog[userAddress] = []

        emit UserRegistered(userAddress: userAddress, autonomyMode: autonomyMode)
    }

    /// Update user's autonomy mode
    access(all) fun updateAutonomyMode(_ userAddress: Address, _ newMode: String) {
        pre {
            self.userConfigs[userAddress] != nil: "User not registered"
            newMode == "manual" || newMode == "assist" || newMode == "autopilot":
                "Invalid autonomy mode"
        }

        self.userConfigs[userAddress]?.autonomyMode = newMode

        emit AutomationStatusChanged(userAddress: userAddress, status: newMode)
    }

    /// Add recipient to whitelist
    access(all) fun whitelistRecipient(
        _ userAddress: Address,
        _ recipientAddress: Address,
        _ recipientName: String
    ) {
        pre {
            self.userConfigs[userAddress] != nil: "User not registered"
            recipientAddress != userAddress: "Cannot whitelist yourself"
        }

        self.userConfigs[userAddress]?.whitelistedRecipients[recipientAddress] = recipientName

        emit RecipientWhitelisted(
            userAddress: userAddress,
            recipient: recipientAddress,
            name: recipientName
        )
    }

    /// Remove recipient from whitelist
    access(all) fun removeRecipient(_ userAddress: Address, _ recipientAddress: Address) {
        pre {
            self.userConfigs[userAddress] != nil: "User not registered"
        }

        self.userConfigs[userAddress]?.whitelistedRecipients.remove(key: recipientAddress)

        emit RecipientRemoved(userAddress: userAddress, recipient: recipientAddress)
    }

    /// Log a transaction
    access(all) fun logTransaction(
        userAddress: Address,
        action: String,
        fromVault: String,
        toVault: String,
        amount: UFix64,
        recipient: Address?,
        status: String,
        txHash: String?
    ) {
        pre {
            self.userOperationLog[userAddress] != nil: "User log not initialized"
        }

        let record = TransactionRecord(
            action: action,
            fromVault: fromVault,
            toVault: toVault,
            amount: amount,
            recipient: recipient,
            status: status,
            txHash: txHash
        )

        self.userOperationLog[userAddress]!.append(record)
    }

    /// Validate transfer - checks daily limit, whitelisting, autonomy mode
    access(all) fun validateTransfer(
        userAddress: Address,
        recipient: Address,
        amount: UFix64
    ): Bool {
        pre {
            self.userConfigs[userAddress] != nil: "User not registered"
        }

        let config = self.userConfigs[userAddress]!

        // Check if automation is active
        if !config.automationActive {
            return false
        }

        // Reset daily counter if needed
        let timeDiff = getCurrentBlock().timestamp - config.lastReset
        if timeDiff > 86400.0 {  // 24 hours
            config.dailyTransferred = 0.0
            config.lastReset = getCurrentBlock().timestamp
        }

        // Check daily limit
        if config.dailyTransferred + amount > config.dailyLimit {
            return false
        }

        // Check whitelist (if recipient != user)
        if recipient != userAddress {
            if !config.whitelistedRecipients.containsKey(recipient) {
                return false
            }
        }

        // Update daily transferred
        config.dailyTransferred = config.dailyTransferred + amount

        return true
    }

    /// Get user configuration
    access(all) fun getUserConfig(_ userAddress: Address): UserConfig? {
        return self.userConfigs[userAddress]
    }

    /// Get user operation history
    access(all) fun getUserOperationLog(_ userAddress: Address): [TransactionRecord]? {
        return self.userOperationLog[userAddress]
    }

    /// Pause user's automation
    access(all) fun pauseAutomation(_ userAddress: Address) {
        pre {
            self.userConfigs[userAddress] != nil: "User not registered"
        }

        self.userConfigs[userAddress]?.automationActive = false

        emit AutomationStatusChanged(userAddress: userAddress, status: "paused")
    }

    /// Resume user's automation
    access(all) fun resumeAutomation(_ userAddress: Address) {
        pre {
            self.userConfigs[userAddress] != nil: "User not registered"
        }

        self.userConfigs[userAddress]?.automationActive = true

        emit AutomationStatusChanged(userAddress: userAddress, status: "resumed")
    }

    init() {
        self.userConfigs = {}
        self.delegatedKeys = {}
        self.userOperationLog = {}
    }
}
