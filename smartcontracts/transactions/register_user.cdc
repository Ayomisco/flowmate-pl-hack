import FlowMateAgent from 0x01
import VaultManager from 0x02

transaction(userId: String, autonomyMode: String, dailyLimit: UFix64) {
    prepare(signer: AuthAccount) {
        // Register user with FlowMateAgent
        let userAccount <- FlowMateAgent.registerUser(
            userId: userId,
            autonomyMode: autonomyMode,
            dailyLimit: dailyLimit
        )
        
        // Create vaults for user
        let userVaults <- VaultManager.createUserVaults()
        
        // Save resources to account
        signer.save(<- userAccount, to: /storage/flowmateUserAccount)
        signer.save(<- userVaults, to: /storage/userVaults)
        
        // Create public links
        signer.link<&FlowMateAgent.UserAccount>(
            /public/flowmateUserAccount,
            target: /storage/flowmateUserAccount
        )
        signer.link<&VaultManager.UserVaults>(
            /public/userVaults,
            target: /storage/userVaults
        )
    }
    
    execute {
        log("User registered successfully")
    }
}
