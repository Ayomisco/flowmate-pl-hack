import VaultManager from 0xVaultManager

/// Script to retrieve user vault balances
/// Read-only query - does not create a transaction

pub fun main(addr: Address): {String: UFix64} {
  return VaultManager.getUserVaultBalances(address: addr)
}
