import VaultManager from 0xVaultManager

/// Transaction to transfer funds between user's vaults
/// Example: Transfer from Available vault to Savings vault

transaction(from: String, to: String, amount: UFix64) {
  prepare(signer: AuthAccount) {
    let vaults = signer.borrow<&VaultManager.UserVaults>(from: VaultManager.UserVaultsStoragePath)
      ?? panic("User vaults not found")

    // Perform transfer
    vaults.transferBetweenVaults(from: from, to: to, amount: amount)
  }

  execute {
    log("Transferred ".concat(amount.toString()).concat(" from ").concat(from).concat(" to ").concat(to))
  }
}
