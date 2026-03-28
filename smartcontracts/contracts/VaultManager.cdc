import FungibleToken from 0xFungibleToken
import FlowToken from 0xFlowToken

/// VaultManager Contract
/// Manages user's multi-vault financial system
///
/// Vault Types:
/// - Available: Daily spending
/// - Savings: Long-term savings (can be locked with deadline)
/// - Emergency: Emergency fund (locked with withdrawal restrictions)
/// - Staking: Staked assets (locked until unstake)
///
/// Key Features:
/// - Independent balance tracking per vault
/// - Lock/unlock mechanisms with timestamp-based deadlines
/// - Transfer between vaults
/// - Total balance calculation across all vaults

pub contract VaultManager {

    // ===== Events =====
    pub event VaultsCreated(address: Address)
    pub event VaultTransfer(from: String, to: String, amount: UFix64, timestamp: UFix64)
    pub event VaultLocked(vaultType: String, lockedUntil: UFix64)
    pub event VaultUnlocked(vaultType: String)
    pub event DepositToVault(vaultType: String, amount: UFix64)
    pub event WithdrawFromVault(vaultType: String, amount: UFix64)

    // ===== Paths =====
    pub let UserVaultsStoragePath: StoragePath
    pub let UserVaultsPublicPath: PublicPath

    init() {
        self.UserVaultsStoragePath = /storage/flowmateUserVaults
        self.UserVaultsPublicPath = /public/flowmateUserVaults
    }

    // ===== Structures =====

    /// Individual vault with balance and lock status
    pub struct Vault {
        pub let vaultType: String // "available", "savings", "emergency", "staking"
        pub var balance: UFix64
        pub var lockedUntil: UFix64? // nil if unlocked, timestamp if locked

        init(vaultType: String) {
            self.vaultType = vaultType
            self.balance = 0.0
            self.lockedUntil = nil
        }

        /// Check if vault is currently locked
        pub fun isLocked(): Bool {
            if let lockTime = self.lockedUntil {
                return getCurrentBlock().timestamp < lockTime
            }
            return false
        }
    }

    // ===== Resources =====

    /// Resource to store user's vaults
    pub resource UserVaults {
        pub var vaults: {String: Vault}

        init() {
            self.vaults = {}
            self.vaults["available"] = Vault(vaultType: "available")
            self.vaults["savings"] = Vault(vaultType: "savings")
            self.vaults["emergency"] = Vault(vaultType: "emergency")
            self.vaults["staking"] = Vault(vaultType: "staking")
        }

        /// Deposit to specific vault
        pub fun depositToVault(vaultType: String, amount: UFix64) {
            pre {
                amount > 0.0 : "Deposit amount must be positive"
                self.vaults[vaultType] != nil : "Invalid vault type"
            }

            self.vaults[vaultType]!.balance = self.vaults[vaultType]!.balance + amount
            emit DepositToVault(vaultType: vaultType, amount: amount)
        }

        /// Withdraw from specific vault
        pub fun withdrawFromVault(vaultType: String, amount: UFix64): UFix64 {
            pre {
                amount > 0.0 : "Withdrawal amount must be positive"
                self.vaults[vaultType] != nil : "Invalid vault type"
                !self.vaults[vaultType]!.isLocked() : "Vault is locked"
                self.vaults[vaultType]!.balance >= amount : "Insufficient balance"
            }

            self.vaults[vaultType]!.balance = self.vaults[vaultType]!.balance - amount
            emit WithdrawFromVault(vaultType: vaultType, amount: amount)
            return amount
        }

        /// Transfer between vaults
        pub fun transferBetweenVaults(from: String, to: String, amount: UFix64) {
            pre {
                amount > 0.0 : "Transfer amount must be positive"
                self.vaults[from] != nil : "Invalid source vault"
                self.vaults[to] != nil : "Invalid destination vault"
                !self.vaults[from]!.isLocked() : "Source vault is locked"
                self.vaults[from]!.balance >= amount : "Insufficient balance in source vault"
            }

            self.vaults[from]!.balance = self.vaults[from]!.balance - amount
            self.vaults[to]!.balance = self.vaults[to]!.balance + amount

            emit VaultTransfer(from: from, to: to, amount: amount, timestamp: getCurrentBlock().timestamp)
        }

        /// Lock a vault until specified timestamp
        pub fun lockVault(vaultType: String, lockedUntil: UFix64) {
            pre {
                self.vaults[vaultType] != nil : "Invalid vault type"
                lockedUntil > getCurrentBlock().timestamp : "Lock time must be in the future"
            }

            self.vaults[vaultType]!.lockedUntil = lockedUntil
            emit VaultLocked(vaultType: vaultType, lockedUntil: lockedUntil)
        }

        /// Unlock a vault
        pub fun unlockVault(vaultType: String) {
            pre {
                self.vaults[vaultType] != nil : "Invalid vault type"
            }

            self.vaults[vaultType]!.lockedUntil = nil
            emit VaultUnlocked(vaultType: vaultType)
        }

        /// Get vault by type
        pub fun getVault(vaultType: String): Vault? {
            return self.vaults[vaultType]
        }

        /// Get total balance across all vaults
        pub fun getTotalBalance(): UFix64 {
            var total: UFix64 = 0.0
            for vaultType in self.vaults.keys {
                total = total + self.vaults[vaultType]!.balance
            }
            return total
        }

        /// Get all vault balances
        pub fun getAllVaultBalances(): {String: UFix64} {
            let balances: {String: UFix64} = {}
            for vaultType in self.vaults.keys {
                balances[vaultType] = self.vaults[vaultType]!.balance
            }
            return balances
        }
    }

    // ===== Contract Functions =====

    /// Create vaults for new user
    pub fun createUserVaults(acct: AuthAccount) {
        let vaults <- create UserVaults()
        acct.save(<- vaults, to: self.UserVaultsStoragePath)

        emit VaultsCreated(address: acct.address)
    }

    /// Get user vault balances (public read)
    pub fun getUserVaultBalances(address: Address): {String: UFix64} {
        let acct = getAccount(address)
        if let vaults = acct.getCapability(self.UserVaultsPublicPath).borrow<&UserVaults>() {
            return vaults.getAllVaultBalances()
        }
        return {}
    }
}
