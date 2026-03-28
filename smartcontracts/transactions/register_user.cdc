import FlowMateAgent from 0xFlowMateAgent
import VaultManager from 0xVaultManager

/// Transaction to register a new user
/// Creates both FlowMateAgent config and user vaults in a single atomic transaction

transaction(autonomyMode: String) {
  prepare(signer: AuthAccount) {
    // Initialize FlowMateAgent user config
    FlowMateAgent.registerUser(acct: signer, initialMode: autonomyMode)

    // Create user vaults (available, savings, emergency, staking)
    VaultManager.createUserVaults(acct: signer)
  }

  execute {
    log("User registered successfully")
  }
}
