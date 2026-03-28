import FlowMateAgent from 0x01
import VaultManager from 0x02

/// Register a user in FlowMate
transaction(
    dailyLimit: UFix64,
    autonomyMode: String
) {
    prepare(signer: auth(BorrowValue) &Account) {
        // Register in FlowMateAgent
        FlowMateAgent.registerUser(
            userAddress: signer.address,
            dailyLimit: dailyLimit,
            autonomyMode: autonomyMode
        )

        // Create vaults in VaultManager
        VaultManager.createUserVaults(signer.address)

        log("User registered and vaults created")
    }
}
