import FlowMateAgent from 0xc26f3fa2883a46db
import VaultManager from 0xc26f3fa2883a46db

transaction(userId: String, autonomyMode: String, dailyLimit: UFix64) {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        let userAccount <- FlowMateAgent.registerUser(
            userId: userId,
            autonomyMode: autonomyMode,
            dailyLimit: dailyLimit,
            address: signer.address
        )

        let userVaults <- VaultManager.createUserVaults()

        signer.storage.save(<- userAccount, to: /storage/flowmateUserAccount)
        signer.storage.save(<- userVaults, to: /storage/userVaults)

        let accountCap = signer.capabilities.storage.issue<&FlowMateAgent.UserAccount>(/storage/flowmateUserAccount)
        signer.capabilities.publish(accountCap, at: /public/flowmateUserAccount)

        let vaultsCap = signer.capabilities.storage.issue<&VaultManager.UserVaults>(/storage/userVaults)
        signer.capabilities.publish(vaultsCap, at: /public/userVaults)
    }

    execute {
        log("User registered successfully")
    }
}
