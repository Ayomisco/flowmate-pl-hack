import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDownUp, X, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaults?: { type: string; balance: number }[];
}

const VAULT_LABELS: Record<string, string> = {
  available: "Available", savings: "Savings", emergency: "Emergency", staking: "Staking",
};

const SwapModal = ({ isOpen, onClose, vaults = [] }: SwapModalProps) => {
  const [fromVault, setFromVault] = useState("available");
  const [toVault, setToVault] = useState("savings");
  const [amount, setAmount] = useState("");
  const [txResult, setTxResult] = useState<{ txHash: string; explorerUrl: string | null } | null>(null);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const fromBalance = vaults.find(v => v.type === fromVault)?.balance ?? 0;
  const isValid = parseFloat(amount) > 0 && parseFloat(amount) <= fromBalance && fromVault !== toVault;

  const swapMutation = useMutation({
    mutationFn: () => api.post("/api/v1/transactions/swap", { fromVault, toVault, amount: parseFloat(amount) }),
    onSuccess: (res) => {
      const { transaction } = res.data.data;
      setTxResult({ txHash: transaction.txHash, explorerUrl: transaction.explorerUrl || null });
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
    },
    onError: (err: any) => {
      toast({ title: "Swap failed", description: err?.response?.data?.error || "Transfer failed", variant: "destructive" });
    },
  });

  const resetAndClose = () => {
    setFromVault("available"); setToVault("savings"); setAmount(""); setTxResult(null); setDone(false);
    onClose();
  };

  const vaultList = ["available", "savings", "emergency", "staking"];

  return (
    <Sheet open={isOpen} onOpenChange={resetAndClose}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/30">
          <SheetTitle className="text-xl font-bold">{done ? "Swapped!" : "Swap Vaults"}</SheetTitle>
          <button onClick={resetAndClose} className="rounded-lg hover:bg-muted/50 transition-colors p-1"><X className="w-5 h-5" /></button>
        </SheetHeader>

        {!done ? (
          <form onSubmit={(e) => { e.preventDefault(); if (isValid) swapMutation.mutate(); }} className="flex-1 flex flex-col justify-between py-6 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-label">From Vault</label>
                <select value={fromVault} onChange={(e) => setFromVault(e.target.value)} className="glass-input w-full px-4 py-3 text-sm">
                  {vaultList.map(v => <option key={v} value={v}>{VAULT_LABELS[v]} ({vaults.find(vv => vv.type === v)?.balance?.toLocaleString() ?? 0} FLOW)</option>)}
                </select>
              </div>
              <div className="flex justify-center">
                <ArrowDownUp className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-label">To Vault</label>
                <select value={toVault} onChange={(e) => setToVault(e.target.value)} className="glass-input w-full px-4 py-3 text-sm">
                  {vaultList.filter(v => v !== fromVault).map(v => <option key={v} value={v}>{VAULT_LABELS[v]}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-label">Amount (FLOW)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" className="glass-input w-full px-4 py-3 text-sm" min="0.01" step="0.01" max={fromBalance} autoFocus />
                <p className="text-xs text-muted-foreground">Balance in {VAULT_LABELS[fromVault]}: {fromBalance.toLocaleString()} FLOW</p>
                {parseFloat(amount) > fromBalance && <p className="text-xs text-destructive">Exceeds vault balance</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={resetAndClose} className="btn-glass flex-1">Cancel</button>
              <button type="submit" disabled={!isValid || swapMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {swapMutation.isPending ? "Swapping..." : <><ArrowDownUp className="w-4 h-4" /> Swap</>}
              </button>
            </div>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <ArrowDownUp className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Swap Complete!</h3>
              <p className="text-sm text-muted-foreground">{parseFloat(amount).toLocaleString()} FLOW: {VAULT_LABELS[fromVault]} → {VAULT_LABELS[toVault]}</p>
            </div>
            {txResult?.explorerUrl && (
              <a href={txResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink className="w-4 h-4" /> View on Flowscan
              </a>
            )}
            <button onClick={resetAndClose} className="btn-primary w-full mt-4">Done</button>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SwapModal;
