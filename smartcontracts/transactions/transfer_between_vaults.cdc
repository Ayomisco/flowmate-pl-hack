import VaultManager from 0xc26f3fa2883a46db

transaction(from: String, to: String, amount: UFix64) {
  prepare(signer: auth(Storage) &Account) {
    let vaults = signer.storage.borrow<&VaultManager.UserVaults>(from: /storage/userVaults)
      ?? panic("User vaults not found")

    vaults.transferBetweenVaults(from: from, to: to, amount: amount)
  }

  execute {
    log("Transferred ".concat(amount.toString()).concat(" from ").concat(from).concat(" to ").concat(to))
  }
}
