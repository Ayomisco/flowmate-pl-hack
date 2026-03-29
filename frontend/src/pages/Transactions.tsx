import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, ArrowDownUp, PiggyBank, ExternalLink, ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

interface Transaction {
  id: string; type: string; amount: number; status: string;
  createdAt: string; toAddress: string; fromAddress: string;
  explorerUrl?: string; token: string; txHash: string;
}

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  send: { icon: ArrowUpRight, label: "Sent", color: "text-orange-400" },
  receive: { icon: ArrowDownLeft, label: "Received", color: "text-primary" },
  save: { icon: PiggyBank, label: "Saved", color: "text-blue-400" },
  swap: { icon: ArrowDownUp, label: "Swapped", color: "text-purple-400" },
  stake: { icon: ArrowDownUp, label: "Staked", color: "text-yellow-400" },
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-primary bg-primary/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  failed: "text-destructive bg-destructive/10",
};

const Transactions = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["all-transactions"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/transactions?limit=50");
      return data.data as { transactions: Transaction[]; total: number };
    },
  });

  const transactions = data?.transactions || [];

  if (selected) {
    const cfg = TYPE_CONFIG[selected.type] || TYPE_CONFIG.send;
    return (
      <div className="page-shell">
        <div className="flex-1 app-container">
          <header className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">Transaction Details</span>
          </header>
          <div className="px-4 pt-6 pb-28 space-y-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-6 space-y-2">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                <cfg.icon className={`w-8 h-8 ${cfg.color}`} />
              </div>
              <p className="text-3xl font-bold">{selected.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selected.token}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status] || STATUS_COLORS.confirmed}`}>
                {selected.status}
              </span>
            </motion.div>
            {[
              { label: "Type", value: cfg.label },
              { label: "Date", value: new Date(selected.createdAt).toLocaleString() },
              { label: "From", value: selected.fromAddress },
              { label: "To", value: selected.toAddress },
              { label: "Tx Hash", value: `${selected.txHash.slice(0, 16)}...${selected.txHash.slice(-8)}` },
            ].map(({ label, value }) => (
              <div key={label} className="card-secondary flex justify-between items-start gap-4">
                <p className="text-label shrink-0">{label}</p>
                <p className="text-sm font-mono text-right break-all">{value}</p>
              </div>
            ))}
            {selected.explorerUrl && (
              <a href={selected.explorerUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                <ExternalLink className="w-4 h-4" /> View on Flowscan Testnet
              </a>
            )}
          </div>
          <BottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg">Transaction History</span>
        </header>
        <div className="px-4 pt-4 pb-28 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
          ) : transactions.length > 0 ? (
            transactions.map(tx => {
              const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.send;
              return (
                <motion.button key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelected(tx)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-card/40 hover:bg-card/70 transition-colors text-left">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()} · {tx.toAddress.slice(0, 12)}...</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-sm font-semibold ${cfg.color}`}>
                      {tx.type === "receive" ? "+" : "-"}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW
                    </span>
                    {tx.explorerUrl && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </motion.button>
              );
            })
          ) : (
            <div className="flex flex-col items-center py-16 space-y-3">
              <ArrowDownUp className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </div>
  );
};

export default Transactions;
