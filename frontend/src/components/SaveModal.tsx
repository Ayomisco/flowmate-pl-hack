import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PiggyBank, X, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance?: number;
}

const vaultOptions = [
  { id: "savings", label: "Savings", desc: "General savings vault" },
  { id: "emergency", label: "Emergency Fund", desc: "Locked for emergencies" },
  { id: "staking", label: "Staking", desc: "Earn ~8.5% APY" },
];

const SaveModal = ({ isOpen, onClose, availableBalance = 0 }: SaveModalProps) => {
  const [amount, setAmount] = useState("");
  const [toVault, setToVault] = useState("savings");
  const [txResult, setTxResult] = useState<{ txHash: string; explorerUrl: string } | null>(null);
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => api.post("/api/v1/transactions/save", { amount: parseFloat(amount), toVault }),
    onSuccess: (res) => {
      const { transaction, explorerUrl } = res.data.data;
      setTxResult({ txHash: transaction.txHash, explorerUrl });
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err?.response?.data?.error || "Transfer failed", variant: "destructive" });
    },
  });

  const isValid = parseFloat(amount) > 0 && parseFloat(amount) <= availableBalance;

  const resetAndClose = () => {
    setAmount(""); setToVault("savings"); setTxResult(null); setDone(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={resetAndClose}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/30">
          <SheetTitle className="text-xl font-bold">{done ? "Saved!" : "Save Funds"}</SheetTitle>
          <button onClick={resetAndClose} className="rounded-lg hover:bg-muted/50 transition-colors p-1"><X className="w-5 h-5" /></button>
        </SheetHeader>

        {!done ? (
          <form onSubmit={(e) => { e.preventDefault(); if (isValid) saveMutation.mutate(); }} className="flex-1 flex flex-col justify-between py-6 space-y-4">
            <div className="space-y-4">
              <div className="card-secondary space-y-1">
                <p className="text-label">Available to Save</p>
                <p className="text-2xl font-bold text-primary">{availableBalance.toLocaleString()} FLOW</p>
              </div>
              <div className="space-y-2">
                <label className="text-label">Amount (FLOW)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" className="glass-input w-full px-4 py-3 text-sm" min="0.01" step="0.01" max={availableBalance} autoFocus />
                {parseFloat(amount) > availableBalance && <p className="text-xs text-destructive">Exceeds available balance</p>}
              </div>
              <div className="space-y-2">
                <label className="text-label">Save Into</label>
                <div className="space-y-2">
                  {vaultOptions.map((v) => (
                    <button key={v.id} type="button" onClick={() => setToVault(v.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${toVault === v.id ? "border-primary bg-primary/10" : "border-border/30 bg-card/30 hover:bg-card/50"}`}>
                      <p className="text-sm font-medium">{v.label}</p>
                      <p className="text-xs text-muted-foreground">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={resetAndClose} className="btn-glass flex-1">Cancel</button>
              <button type="submit" disabled={!isValid || saveMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                {saveMutation.isPending ? "Saving..." : <><PiggyBank className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <PiggyBank className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Saved Successfully!</h3>
              <p className="text-sm text-muted-foreground">{parseFloat(amount).toLocaleString()} FLOW → {vaultOptions.find(v => v.id === toVault)?.label}</p>
            </div>
            {txResult && (
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

export default SaveModal;
