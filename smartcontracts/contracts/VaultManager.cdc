import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

access(all) contract VaultManager {

    access(all) event VaultCreated(userId: String, vaultType: String)
    access(all) event VaultTransfer(fromVault: String, toVault: String, amount: UFix64)
    access(all) event VaultLocked(userId: String, vaultType: String, lockedUntil: UFix64)
    access(all) event VaultUnlocked(userId: String, vaultType: String)
    access(all) event DepositToVault(userId: String, vaultType: String, amount: UFix64)
    access(all) event WithdrawFromVault(userId: String, vaultType: String, amount: UFix64)

    access(all) struct Vault {
        access(all) let vaultType: String // available | savings | emergency | staking
        access(all) var balance: UFix64
        access(all) var lockedUntil: UFix64? // nil if unlocked
        access(all) let createdAt: UFix64

        init(vaultType: String) {
            self.vaultType = vaultType
            self.balance = 0.0
            self.lockedUntil = nil
            self.createdAt = getCurrentBlock().timestamp
        }

        access(all) fun deposit(amount: UFix64) {
            pre {
                amount > 0.0: "Deposit amount must be positive"
            }
            self.balance = self.balance + amount
        }

        access(all) fun withdraw(amount: UFix64): UFix64 {
            pre {
                amount > 0.0: "Withdrawal amount must be positive"
                self.balance >= amount: "Insufficient balance"
                self.lockedUntil == nil || (self.lockedUntil! <= getCurrentBlock().timestamp): "Vault is locked"
            }
            self.balance = self.balance - amount
            return amount
        }

        access(all) fun lock(duration: UFix64) {
            pre {
                duration > 0.0: "Lock duration must be positive"
            }
            self.lockedUntil = getCurrentBlock().timestamp + duration
        }

        access(all) fun unlock() {
            self.lockedUntil = nil
        }

        access(all) fun isLocked(): Bool {
            if self.lockedUntil == nil {
                return false
            }
            return self.lockedUntil! > getCurrentBlock().timestamp
        }

        access(all) fun getBalance(): UFix64 {
            return self.balance
        }
    }

    access(all) resource UserVaults {
        access(all) var vaults: {String: Vault} // available | savings | emergency | staking

        init() {
            self.vaults = {}
            self.createVault(vaultType: "available")
            self.createVault(vaultType: "savings")
            self.createVault(vaultType: "emergency")
            self.createVault(vaultType: "staking")
        }

        access(all) fun createVault(vaultType: String) {
            pre {
                vaultType == "available" || vaultType == "savings" || vaultType == "emergency" || vaultType == "staking": "Invalid vault type"
                self.vaults[vaultType] == nil: "Vault already exists"
            }
            self.vaults[vaultType] = Vault(vaultType: vaultType)
            emit VaultCreated(userId: "", vaultType: vaultType)
        }

        access(all) fun getVault(vaultType: String): Vault? {
            return self.vaults[vaultType]
        }

        access(all) fun depositToVault(vaultType: String, amount: UFix64) {
            pre {
                self.vaults[vaultType] != nil: "Vault does not exist"
            }
            var vault = self.vaults[vaultType]!
            vault.deposit(amount: amount)
            self.vaults[vaultType] = vault
            emit DepositToVault(userId: "", vaultType: vaultType, amount: amount)
        }

        access(all) fun withdrawFromVault(vaultType: String, amount: UFix64): UFix64 {
            pre {
                self.vaults[vaultType] != nil: "Vault does not exist"
            }
            var vault = self.vaults[vaultType]!
            let withdrawn = vault.withdraw(amount: amount)
            self.vaults[vaultType] = vault
            emit WithdrawFromVault(userId: "", vaultType: vaultType, amount: withdrawn)
            return withdrawn
        }

        access(all) fun transferBetweenVaults(from: String, to: String, amount: UFix64) {
            pre {
                self.vaults[from] != nil: "Source vault does not exist"
                self.vaults[to] != nil: "Destination vault does not exist"
                amount > 0.0: "Transfer amount must be positive"
            }
            let withdrawn = self.withdrawFromVault(vaultType: from, amount: amount)
            self.depositToVault(vaultType: to, amount: withdrawn)
            emit VaultTransfer(fromVault: from, toVault: to, amount: withdrawn)
        }

        access(all) fun lockVault(vaultType: String, duration: UFix64) {
            pre {
                self.vaults[vaultType] != nil: "Vault does not exist"
            }
            var vault = self.vaults[vaultType]!
            vault.lock(duration: duration)
            let lockedUntil = vault.lockedUntil ?? 0.0
            self.vaults[vaultType] = vault
            emit VaultLocked(userId: "", vaultType: vaultType, lockedUntil: lockedUntil)
        }

        access(all) fun unlockVault(vaultType: String) {
            pre {
                self.vaults[vaultType] != nil: "Vault does not exist"
            }
            var vault = self.vaults[vaultType]!
            vault.unlock()
            self.vaults[vaultType] = vault
            emit VaultUnlocked(userId: "", vaultType: vaultType)
        }

        access(all) fun getTotalBalance(): UFix64 {
            var total: UFix64 = 0.0
            for vaultType in self.vaults.keys {
                if let vault = self.vaults[vaultType] {
                    total = total + vault.getBalance()
                }
            }
            return total
        }

        access(all) fun getAllVaults(): {String: Vault} {
            return self.vaults
        }
    }

    access(all) fun createUserVaults(): @UserVaults {
        return <- create UserVaults()
    }

    init() {}
}
