import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Send, ArrowDownUp, PiggyBank, ExternalLink, Zap, ChevronRight } from "lucide-react";
import ChatHeader from "@/components/ChatHeader";
import BottomNav from "@/components/BottomNav";
import SendModal from "@/components/SendModal";
import ReceiveModal from "@/components/ReceiveModal";
import SaveModal from "@/components/SaveModal";
import SwapModal from "@/components/SwapModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface Vault { type: string; balance: number; }
interface Transaction {
  id: string; type: string; amount: number; status: string;
  createdAt: string; toAddress?: string; fromAddress?: string;
  explorerUrl?: string; description?: string;
}

const TX_ICON: Record<string, any> = {
  receive: <ArrowDownLeft className="w-4 h-4" />,
  save: <PiggyBank className="w-4 h-4" />,
  swap: <ArrowDownUp className="w-4 h-4" />,
  stake: <ArrowDownUp className="w-4 h-4" />,
};

const VAULT_LABELS: Record<string, string> = { available: "Available", savings: "Savings", emergency: "Emergency", staking: "Staking" };

const Dashboard = () => {
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: vaultData, isLoading: vaultsLoading } = useQuery<Vault[]>({
    queryKey: ["vaults"],
    queryFn: async () => { const { data } = await api.get("/api/v1/vaults"); return data.data; },
  });

  const { data: txData, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => { const { data } = await api.get("/api/v1/transactions?limit=5"); return data.data.transactions; },
  });

  const { data: rulesData } = useQuery({
    queryKey: ["rules"],
    queryFn: async () => { const { data } = await api.get("/api/v1/rules"); return data.data as {id: string; type: string; status: string; config: any; nextExecution?: string}[]; },
  });

  const vaults = vaultData || [];
  const transactions = txData || [];
  const totalBalance = vaults.reduce((sum, v) => sum + (v.balance || 0), 0);
  const availableBalance = vaults.find(v => v.type === "available")?.balance || 0;
  const activeRules = (rulesData || []).filter(r => r.status === "active");

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <ChatHeader />
        <div className="px-4 pt-6 pb-28 space-y-4 overflow-y-auto">

          {/* Balance Card */}
          <motion.div {...fadeUp} className="card-primary text-center space-y-2">
            <p className="text-label">Total Wealth</p>
            {vaultsLoading ? <div className="h-10 bg-muted/30 rounded-lg animate-pulse mx-auto w-40" /> : (
              <h1 className="text-balance">{totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-2xl">FLOW</span></h1>
            )}
            <p className="text-xs text-primary/80 font-medium truncate">{user?.flowAddress || "Flow Testnet"}</p>
          </motion.div>

          {/* Action Grid */}
          <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-4 gap-2">
            {[
              { label: "Send", icon: <Send className="w-5 h-5 text-primary" />, onClick: () => setShowSend(true) },
              { label: "Receive", icon: <ArrowDownLeft className="w-5 h-5 text-primary" />, onClick: () => setShowReceive(true) },
              { label: "Save", icon: <PiggyBank className="w-5 h-5 text-primary" />, onClick: () => setShowSave(true) },
              { label: "Swap", icon: <ArrowDownUp className="w-5 h-5 text-primary" />, onClick: () => setShowSwap(true) },
            ].map(({ label, icon, onClick }) => (
              <button key={label} onClick={onClick} className="card-action flex flex-col items-center justify-center gap-1 py-4">
                {icon}
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </motion.div>

          <div className="divider-subtle my-2" />

          {/* Active Automations */}
          {activeRules.length > 0 && (
            <motion.button {...fadeUp} transition={{ delay: 0.08 }}
              onClick={() => navigate("/rules")}
              className="card-secondary flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{activeRules.length} active automation{activeRules.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Next: {activeRules[0]?.nextExecution ? new Date(activeRules[0].nextExecution).toLocaleDateString() : 'scheduled'}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.button>
          )}

          {/* Vault Summary */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="card-secondary space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-label">Wealth Vaults</p>
              <p className="text-sm font-semibold text-primary">{totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW</p>
            </div>
            {vaultsLoading ? (
              <div className="flex flex-wrap gap-2">{[1,2,3,4].map(i => <div key={i} className="flex-1 min-w-[45%] h-12 bg-muted/30 rounded-lg animate-pulse" />)}</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vaults.length > 0 ? vaults.map(v => (
                  <div key={v.type} className="flex-1 min-w-[45%] bg-muted/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">{VAULT_LABELS[v.type] || v.type}</p>
                    <p className="text-xs font-semibold text-foreground">{v.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW</p>
                  </div>
                )) : <p className="text-xs text-muted-foreground">No vaults. Add funds to get started.</p>}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="card-secondary space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-label">Recent Activity</p>
              <button onClick={() => navigate("/transactions")} className="text-xs text-primary hover:underline">View All</button>
            </div>
            {txLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />)}</div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 py-2">
                    <div className={`p-2 rounded-lg ${tx.type === "receive" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {TX_ICON[tx.type] || <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-semibold whitespace-nowrap ${tx.type === "receive" ? "text-primary" : "text-foreground"}`}>
                        {tx.type === "receive" ? "+" : "-"}{Math.abs(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW
                      </span>
                      {tx.explorerUrl && (
                        <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">No transactions yet. Try sending or saving some FLOW.</p>
            )}
          </motion.div>

        </div>

        <SendModal isOpen={showSend} onClose={() => setShowSend(false)} availableBalance={availableBalance} />
        <ReceiveModal isOpen={showReceive} onClose={() => setShowReceive(false)} userWalletAddress={user?.flowAddress || ""} />
        <SaveModal isOpen={showSave} onClose={() => setShowSave(false)} availableBalance={availableBalance} />
        <SwapModal isOpen={showSwap} onClose={() => setShowSwap(false)} vaults={vaults} />

        <BottomNav />
      </div>
    </div>
  );
};

export default Dashboard;
