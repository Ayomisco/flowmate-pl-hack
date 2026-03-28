import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x7e60df042a9c0868

pub contract VaultManager {
    
    pub event VaultCreated(userId: String, vaultType: String)
    pub event VaultTransfer(fromVault: String, toVault: String, amount: UFix64)
    pub event VaultLocked(userId: String, vaultType: String, lockedUntil: UFix64)
    pub event VaultUnlocked(userId: String, vaultType: String)
    pub event DepositToVault(userId: String, vaultType: String, amount: UFix64)
    pub event WithdrawFromVault(userId: String, vaultType: String, amount: UFix64)

    pub struct Vault {
        pub let vaultType: String // available | savings | emergency | staking
        pub var balance: UFix64
        pub var lockedUntil: UFix64? // nil if unlocked
        pub let createdAt: UFix64

        init(vaultType: String) {
            self.vaultType = vaultType
            self.balance = 0.0
            self.lockedUntil = nil
            self.createdAt = getCurrentBlock().timestamp
        }

        pub fun deposit(amount: UFix64) {
            pre {
                amount > 0.0: "Deposit amount must be positive"
            }
            self.balance = self.balance + amount
        }

        pub fun withdraw(amount: UFix64): UFix64 {
            pre {
                amount > 0.0: "Withdrawal amount must be positive"
                self.balance >= amount: "Insufficient balance"
                self.lockedUntil == nil || (self.lockedUntil! <= getCurrentBlock().timestamp): "Vault is locked"
            }
            self.balance = self.balance - amount
            return amount
        }

        pub fun lock(duration: UFix64) {
            pre {
                duration > 0.0: "Lock duration must be positive"
            }
            self.lockedUntil = getCurrentBlock().timestamp + duration
        }

        pub fun unlock() {
            self.lockedUntil = nil
        }

        pub fun isLocked(): Bool {
            if self.lockedUntil == nil {
                return false
            }
            return self.lockedUntil! > getCurrentBlock().timestamp
        }

        pub fun getBalance(): UFix64 {
            return self.balance
        }
    }

    pub resource UserVaults {
        pub var vaults: {String: Vault} // available | savings | emergency | staking

        init() {
            self.vaults = {}
            self.createVault(vaultType: "available")
            self.createVault(vaultType: "savings")
            self.createVault(vaultType: "emergency")
            self.createVault(vaultType: "staking")
        }

        pub fun createVault(vaultType: String) {
            pre {
                vaultType == "available" || vaultType == "savings" || vaultType == "emergency" || vaultType == "staking": "Invalid vault type"
                self.vaults[vaultType] == nil: "Vault already exists"
            }
            self.vaults[vaultType] = Vault(vaultType: vaultType)
            emit VaultCreated(userId: "", vaultType: vaultType)
        }

        pub fun getVault(vaultType: String): Vault? {
            return self.vaults[vaultType]
        }

        pub fun depositToVault(vaultType: String, amount: UFix64) {
            pre {
                self.vaults[vaultType] != nil: "Vault does not exist"
            }
            self.vaults[vaultType]!.deposit(amount: amount)
            emit DepositToVault(userId: "", vaultType: vaultType, amount: amount)
        }

        pub fun withdrawFromVault(vaultType: String, amount: UFix64): UFix64 {
            pre {
                self.vaults[vaultType] != nil: "Vault does not exist"
            }
            let withdrawn = self.vaults[vaultType]!.withdraw(amount: amount)
            emit WithdrawFromVault(userId: "", vaultType: vaultType, amount: withdrawn)
            return withdrawn
        }

        pub fun transferBetweenVaults(from: String, to: String, amount: UFix64) {
            pre {
                self.vaults[from] != nil: "Source vault does not exist"
                self.vaults[to] != nil: "Destination vault does not exist"
                amount > 0.0: "Transfer amount must be positive"
            }
            let withdrawn = self.withdrawFromVault(vaultType: from, amount: amount)
            self.depositToVault(vaultType: to, amount: withdrawn)
            emit VaultTransfer(fromVault: from, toVault: to, amount: withdrawn)
        }

        pub fun lockVault(vaultType: String, duration: UFix64) {
            pre {
                self.vaults[vaultType] != nil: "Vault does not exist"
            }
            self.vaults[vaultType]!.lock(duration: duration)
            emit VaultLocked(userId: "", vaultType: vaultType, lockedUntil: self.vaults[vaultType]!.lockedUntil ?? 0.0)
        }

        pub fun unlockVault(vaultType: String) {
            pre {
                self.vaults[vaultType] != nil: "Vault does not exist"
            }
            self.vaults[vaultType]!.unlock()
            emit VaultUnlocked(userId: "", vaultType: vaultType)
        }

        pub fun getTotalBalance(): UFix64 {
            var total: UFix64 = 0.0
            for vaultType in self.vaults.keys {
                if let vault = self.vaults[vaultType] {
                    total = total + vault.getBalance()
                }
            }
            return total
        }

        pub fun getAllVaults(): {String: Vault} {
            return self.vaults
        }
    }

    pub fun createUserVaults(): @UserVaults {
        return <- create UserVaults()
    }

    init() {}
}
