import VaultManager from 0xc26f3fa2883a46db

/// Get vault balances for a given address
access(all) fun main(addr: Address): {String: UFix64} {
    let account = getAccount(addr)
    let vaultsCap = account.capabilities.borrow<&VaultManager.UserVaults>(/public/userVaults)
        ?? panic("User has no vaults")

    let allVaults = vaultsCap.getAllVaults()
    var balances: {String: UFix64} = {}
    for key in allVaults.keys {
        if let vault = allVaults[key] {
            balances[key] = vault.getBalance()
        }
    }
    return balances
}
