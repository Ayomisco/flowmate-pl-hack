import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  ArrowDownUp,
  ChevronRight,
} from "lucide-react";
import ChatHeader from "@/components/ChatHeader";
import BottomNav from "@/components/BottomNav";
import SendModal from "@/components/SendModal";
import ReceiveModal from "@/components/ReceiveModal";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface Vault {
  type: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  recipient?: string;
  description?: string;
}

const txIcon = (type: string) => {
  if (type === "receive") return <ArrowDownLeft className="w-4 h-4" />;
  if (type === "save") return <ArrowDownUp className="w-4 h-4" />;
  return <ArrowUpRight className="w-4 h-4" />;
};

const vaultLabel: Record<string, string> = {
  available: "Available",
  savings: "Savings",
  emergency: "Emergency",
  staking: "Staking",
};

const Dashboard = () => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const { user } = useAuth();

  const { data: vaultData, isLoading: vaultsLoading } = useQuery<Vault[]>({
    queryKey: ["vaults"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/vaults");
      return data.data;
    },
  });

  const { data: txData, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/transactions");
      return data.data.transactions;
    },
  });

  const vaults = vaultData || [];
  const transactions = txData || [];
  const totalBalance = vaults.reduce((sum, v) => sum + (v.balance || 0), 0);

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <ChatHeader />

        <div className="px-4 pt-6 pb-28 space-y-4 overflow-y-auto">
          {/* Balance Card */}
          <motion.div {...fadeUp} className="card-primary text-center space-y-2">
            <p className="text-label">Total Wealth</p>
            {vaultsLoading ? (
              <div className="h-10 bg-muted/30 rounded-lg animate-pulse mx-auto w-32" />
            ) : (
              <h1 className="text-balance">
                {totalBalance.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </h1>
            )}
            <p className="text-xs text-primary/80 font-medium">Flow Blockchain</p>
          </motion.div>

          {/* Primary Actions */}
          <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowSendModal(true)} className="card-action flex flex-col items-center justify-center gap-2 py-6">
              <Send className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Send</span>
            </button>
            <button onClick={() => setShowReceiveModal(true)} className="card-action flex flex-col items-center justify-center gap-2 py-6">
              <ArrowDownLeft className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Receive</span>
            </button>
          </motion.div>

          <div className="divider-subtle my-2" />

          {/* Vault Summary */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="card-secondary space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-label">Wealth Vaults</p>
              <p className="text-sm font-semibold text-primary">
                {totalBalance.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </p>
            </div>
            {vaultsLoading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex-1 min-w-[45%] h-12 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vaults.length > 0 ? vaults.map((v) => (
                  <div key={v.type} className="flex-1 min-w-[45%] bg-muted/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {vaultLabel[v.type] || v.type}
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      ${(v.balance / 1000).toFixed(1)}k
                    </p>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground">No vaults found</p>
                )}
              </div>
            )}
            <button className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View All Vaults <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Recent Activity */}
          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="card-secondary space-y-3">
            <p className="text-label">Recent Activity</p>
            {txLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 py-2">
                    <div className={`p-2 rounded-lg ${tx.type === "receive" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {txIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate capitalize">
                        {tx.description || tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap ${tx.amount > 0 ? "text-primary" : "text-foreground"}`}>
                      {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">No transactions yet</p>
            )}
            <button className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View All Activity <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} />
        <ReceiveModal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          userWalletAddress={user?.flowAddress || "0x..."}
        />

        <BottomNav />
      </div>
    </div>
  );
};

export default Dashboard;
