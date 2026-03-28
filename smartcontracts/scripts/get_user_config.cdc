import FlowMateAgent from 0xc26f3fa2883a46db

/// Get user agent config for a given address
access(all) fun main(addr: Address): FlowMateAgent.UserConfig? {
    let account = getAccount(addr)
    let userAccountCap = account.capabilities.borrow<&FlowMateAgent.UserAccount>(/public/flowmateUserAccount)

    if userAccountCap == nil {
        return nil
    }

    return userAccountCap!.getConfig()
}
