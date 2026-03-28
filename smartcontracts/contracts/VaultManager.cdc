import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

/// VaultManager - Manages user's financial vaults
/// Handles vault creation, transfers, and balance tracking
access(all) contract VaultManager {

    // ==================== Events ====================

    access(all) event VaultCreated(userAddress: Address, vaultType: String, vaultId: String)
    access(all) event VaultTransfer(
        from: String,
        to: String,
        amount: UFix64,
        userAddress: Address
    )
    access(all) event VaultLocked(vaultId: String, lockedUntil: UFix64)
    access(all) event VaultUnlocked(vaultId: String)
    access(all) event BalanceUpdated(userAddress: Address, vaultType: String, newBalance: UFix64)

    // ==================== Structures ====================

    /// Vault structure tracking balance and properties
    access(all) struct Vault {
        access(all) let vaultId: String
        access(all) let vaultType: String  // available | savings | emergency | staking
        access(all) var balance: UFix64
        access(all) var lockedUntil: UFix64?  // nil = unlocked
        access(all) let createdAt: UFix64
        access(all) var lastUpdated: UFix64
        access(all) var transferCount: UInt64

        init(
            vaultId: String,
            vaultType: String
        ) {
            self.vaultId = vaultId
            self.vaultType = vaultType
            self.balance = 0.0
            self.lockedUntil = nil
            self.createdAt = getCurrentBlock().timestamp
            self.lastUpdated = getCurrentBlock().timestamp
            self.transferCount = 0
        }
    }

    // ==================== Storage ====================

    access(all) var userVaults: {Address: {String: Vault}}  // userAddress -> {vaultType -> Vault}

    // ==================== Functions ====================

    /// Create vaults for a user
    access(all) fun createUserVaults(_ userAddress: Address) {
        pre {
            self.userVaults[userAddress] == nil: "User vaults already exist"
        }

        var userVaultMap: {String: Vault} = {}

        // Create four vaults
        let available = Vault(vaultId: "available_\(userAddress)", vaultType: "available")
        userVaultMap["available"] = available

        let savings = Vault(vaultId: "savings_\(userAddress)", vaultType: "savings")
        userVaultMap["savings"] = savings

        let emergency = Vault(vaultId: "emergency_\(userAddress)", vaultType: "emergency")
        userVaultMap["emergency"] = emergency

        let staking = Vault(vaultId: "staking_\(userAddress)", vaultType: "staking")
        userVaultMap["staking"] = staking

        self.userVaults[userAddress] = userVaultMap

        emit VaultCreated(userAddress: userAddress, vaultType: "available", vaultId: available.vaultId)
        emit VaultCreated(userAddress: userAddress, vaultType: "savings", vaultId: savings.vaultId)
        emit VaultCreated(userAddress: userAddress, vaultType: "emergency", vaultId: emergency.vaultId)
        emit VaultCreated(userAddress: userAddress, vaultType: "staking", vaultId: staking.vaultId)
    }

    /// Transfer between vaults
    access(all) fun transferBetweenVaults(
        userAddress: Address,
        fromVaultType: String,
        toVaultType: String,
        amount: UFix64
    ) {
        pre {
            self.userVaults[userAddress] != nil: "User has no vaults"
            self.userVaults[userAddress]![fromVaultType] != nil: "From vault does not exist"
            self.userVaults[userAddress]![toVaultType] != nil: "To vault does not exist"
            amount > 0.0: "Transfer amount must be greater than 0"
        }

        let vaults = self.userVaults[userAddress]!
        let fromVault = vaults[fromVaultType]!
        let toVault = vaults[toVaultType]!

        pre {
            fromVault.balance >= amount: "Insufficient balance"
            fromVault.lockedUntil == nil || fromVault.lockedUntil! <= getCurrentBlock().timestamp:
                "From vault is locked"
        }

        // Update balances
        fromVault.balance = fromVault.balance - amount
        toVault.balance = toVault.balance + amount

        // Update metadata
        fromVault.lastUpdated = getCurrentBlock().timestamp
        fromVault.transferCount = fromVault.transferCount + 1
        toVault.lastUpdated = getCurrentBlock().timestamp
        toVault.transferCount = toVault.transferCount + 1

        emit VaultTransfer(from: fromVaultType, to: toVaultType, amount: amount, userAddress: userAddress)
        emit BalanceUpdated(userAddress: userAddress, vaultType: fromVaultType, newBalance: fromVault.balance)
        emit BalanceUpdated(userAddress: userAddress, vaultType: toVaultType, newBalance: toVault.balance)
    }

    /// Deposit to vault
    access(all) fun depositToVault(
        userAddress: Address,
        vaultType: String,
        amount: UFix64
    ) {
        pre {
            self.userVaults[userAddress] != nil: "User has no vaults"
            self.userVaults[userAddress]![vaultType] != nil: "Vault does not exist"
            amount > 0.0: "Deposit amount must be greater than 0"
        }

        let vault = self.userVaults[userAddress]![vaultType]!
        vault.balance = vault.balance + amount
        vault.lastUpdated = getCurrentBlock().timestamp

        emit BalanceUpdated(userAddress: userAddress, vaultType: vaultType, newBalance: vault.balance)
    }

    /// Withdraw from vault
    access(all) fun withdrawFromVault(
        userAddress: Address,
        vaultType: String,
        amount: UFix64
    ) {
        pre {
            self.userVaults[userAddress] != nil: "User has no vaults"
            self.userVaults[userAddress]![vaultType] != nil: "Vault does not exist"
            amount > 0.0: "Withdrawal amount must be greater than 0"
        }

        let vault = self.userVaults[userAddress]![vaultType]!

        pre {
            vault.balance >= amount: "Insufficient balance"
            vault.lockedUntil == nil || vault.lockedUntil! <= getCurrentBlock().timestamp:
                "Vault is locked"
        }

        vault.balance = vault.balance - amount
        vault.lastUpdated = getCurrentBlock().timestamp

        emit BalanceUpdated(userAddress: userAddress, vaultType: vaultType, newBalance: vault.balance)
    }

    /// Lock vault until date
    access(all) fun lockVault(
        userAddress: Address,
        vaultType: String,
        lockedUntil: UFix64
    ) {
        pre {
            self.userVaults[userAddress] != nil: "User has no vaults"
            self.userVaults[userAddress]![vaultType] != nil: "Vault does not exist"
            lockedUntil > getCurrentBlock().timestamp: "Lock date must be in the future"
        }

        let vault = self.userVaults[userAddress]![vaultType]!
        vault.lockedUntil = lockedUntil

        emit VaultLocked(vaultId: vault.vaultId, lockedUntil: lockedUntil)
    }

    /// Unlock vault
    access(all) fun unlockVault(
        userAddress: Address,
        vaultType: String
    ) {
        pre {
            self.userVaults[userAddress] != nil: "User has no vaults"
            self.userVaults[userAddress]![vaultType] != nil: "Vault does not exist"
        }

        let vault = self.userVaults[userAddress]![vaultType]!
        vault.lockedUntil = nil

        emit VaultUnlocked(vaultId: vault.vaultId)
    }

    /// Get vault balance
    access(all) fun getVaultBalance(
        userAddress: Address,
        vaultType: String
    ): UFix64 {
        if let vaults = self.userVaults[userAddress] {
            if let vault = vaults[vaultType] {
                return vault.balance
            }
        }
        return 0.0
    }

    /// Get total balance across all vaults
    access(all) fun getTotalBalance(_ userAddress: Address): UFix64 {
        if let vaults = self.userVaults[userAddress] {
            var total: UFix64 = 0.0
            for vaultType in vaults.keys {
                total = total + vaults[vaultType]!.balance
            }
            return total
        }
        return 0.0
    }

    /// Get all vaults for user
    access(all) fun getUserVaults(_ userAddress: Address): {String: Vault}? {
        return self.userVaults[userAddress]
    }

    /// Get specific vault
    access(all) fun getVault(
        userAddress: Address,
        vaultType: String
    ): Vault? {
        if let vaults = self.userVaults[userAddress] {
            return vaults[vaultType]
        }
        return nil
    }

    init() {
        self.userVaults = {}
    }
}
