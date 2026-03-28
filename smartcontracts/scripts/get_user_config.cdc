import FlowMateAgent from 0xFlowMateAgent

/// Script to retrieve user configuration
/// Read-only query - does not create a transaction

pub fun main(addr: Address): FlowMateAgent.UserConfig? {
  return FlowMateAgent.getUserConfig(address: addr)
}
