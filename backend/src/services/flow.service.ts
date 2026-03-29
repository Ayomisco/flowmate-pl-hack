import * as fcl from '@onflow/fcl';
import { queryFlow, CONTRACT_ADDRESS } from '../config/flow.js';
import logger from '../config/logger.js';

const ADDR = CONTRACT_ADDRESS;

// ── Read Scripts ────────────────────────────────────────────────────────────

const GET_VAULTS_SCRIPT = `
import VaultManager from ${ADDR}

access(all) fun main(addr: Address): {String: UFix64} {
    let account = getAccount(addr)
    let vaultsCap = account.capabilities.borrow<&VaultManager.UserVaults>(/public/userVaults)
    if vaultsCap == nil { return {} }
    let allVaults = vaultsCap!.getAllVaults()
    var balances: {String: UFix64} = {}
    for key in allVaults.keys {
        if let vault = allVaults[key] { balances[key] = vault.getBalance() }
    }
    return balances
}
`;

const GET_USER_CONFIG_SCRIPT = `
import FlowMateAgent from ${ADDR}

access(all) fun main(addr: Address): FlowMateAgent.UserConfig? {
    let account = getAccount(addr)
    let cap = account.capabilities.borrow<&FlowMateAgent.UserAccount>(/public/flowmateUserAccount)
    if cap == nil { return nil }
    return cap!.getConfig()
}
`;

const GET_SCHEDULES_SCRIPT = `
import ScheduledTransactions from ${ADDR}

access(all) fun main(addr: Address): [ScheduledTransactions.Schedule] {
    let account = getAccount(addr)
    let cap = account.capabilities.borrow<&ScheduledTransactions.ScheduleManager>(/public/scheduleManager)
    if cap == nil { return [] }
    return cap!.getAllSchedules(userId: addr.toString())
}
`;

// ── Service ─────────────────────────────────────────────────────────────────

export class FlowService {
  /**
   * Get vault balances for a user address.
   * Returns { available, savings, emergency, staking } in UFix64 strings.
   * Falls back to empty map on error (user may not have registered on-chain yet).
   */
  async getUserVaults(address: string): Promise<Record<string, string>> {
    try {
      const result = await queryFlow(GET_VAULTS_SCRIPT, (arg: any, t: any) => [
        arg(address, t.Address),
      ]);
      return result as Record<string, string>;
    } catch (err) {
      logger.warn('getUserVaults failed (user may not be on-chain)', { address, err: (err as Error).message });
      return { available: '0.00000000', savings: '0.00000000', emergency: '0.00000000', staking: '0.00000000' };
    }
  }

  /**
   * Get user agent config from on-chain.
   */
  async getUserConfig(address: string): Promise<Record<string, any> | null> {
    try {
      const result = await queryFlow(GET_USER_CONFIG_SCRIPT, (arg: any, t: any) => [
        arg(address, t.Address),
      ]);
      return result as Record<string, any>;
    } catch (err) {
      logger.warn('getUserConfig failed', { address, err: (err as Error).message });
      return null;
    }
  }

  /**
   * Get scheduled transactions for a user address.
   */
  async getSchedules(address: string): Promise<any[]> {
    try {
      const result = await queryFlow(GET_SCHEDULES_SCRIPT, (arg: any, t: any) => [
        arg(address, t.Address),
      ]);
      return result as any[];
    } catch (err) {
      logger.warn('getSchedules failed', { address, err: (err as Error).message });
      return [];
    }
  }
}

export default new FlowService();
