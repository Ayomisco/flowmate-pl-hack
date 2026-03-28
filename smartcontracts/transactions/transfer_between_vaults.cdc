import VaultManager from 0x02

/// Transfer funds between user vaults
transaction(
    fromVaultType: String,
    toVaultType: String,
    amount: UFix64
) {
    prepare(signer: auth(BorrowValue) &Account) {
        VaultManager.transferBetweenVaults(
            userAddress: signer.address,
            fromVaultType: fromVaultType,
            toVaultType: toVaultType,
            amount: amount
        )

        log("Transfer completed: ".concat(amount.toString()).concat(" from ").concat(fromVaultType).concat(" to ").concat(toVaultType))
    }
}
