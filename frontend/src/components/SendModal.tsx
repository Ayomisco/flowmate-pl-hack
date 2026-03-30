import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, X, ChevronLeft, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance?: number;
}

type SendStep = "form" | "confirmation" | "success";

const SendModal = ({ isOpen, onClose, availableBalance = 0 }: SendModalProps) => {
  const [step, setStep] = useState<SendStep>("form");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [txResult, setTxResult] = useState<{ txHash: string; explorerUrl: string | null } | null>(null);
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: () => api.post("/api/v1/transactions/send", { recipient, amount: parseFloat(amount), note }),
    onSuccess: (res) => {
      const { transaction } = res.data.data;
      setTxResult({ txHash: transaction.txHash, explorerUrl: transaction.explorerUrl || null });
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
    },
    onError: (err: any) => {
      toast({ title: "Transaction failed", description: err?.response?.data?.error || "Send failed", variant: "destructive" });
    },
  });

  const isFormValid = recipient.trim().length > 0 && parseFloat(amount) > 0 && parseFloat(amount) <= availableBalance;

  const resetAndClose = () => {
    setRecipient(""); setAmount(""); setNote(""); setStep("form"); setTxResult(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={() => step === "form" && resetAndClose()}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            {step === "confirmation" && (
              <button onClick={() => setStep("form")} className="rounded-lg hover:bg-muted/50 transition-colors p-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <SheetTitle className="text-xl font-bold">
              {step === "form" && "Send FLOW"}
              {step === "confirmation" && "Confirm Transfer"}
              {step === "success" && "Sent!"}
            </SheetTitle>
          </div>
          <button onClick={resetAndClose} className="rounded-lg hover:bg-muted/50 transition-colors p-1"><X className="w-5 h-5" /></button>
        </SheetHeader>

        {step === "form" && (
          <form onSubmit={(e) => { e.preventDefault(); if (isFormValid) setStep("confirmation"); }} className="flex-1 flex flex-col justify-between py-6 space-y-4">
            <div className="space-y-4">
              <div className="card-secondary space-y-1">
                <p className="text-label">Available Balance</p>
                <p className="text-2xl font-bold text-primary">{availableBalance.toLocaleString()} FLOW</p>
              </div>
              <div className="space-y-2">
                <label className="text-label">Recipient Address</label>
                <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x... (Flow address)" className="glass-input w-full px-4 py-3 text-sm" autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-label">Amount (FLOW)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" className="glass-input w-full px-4 py-3 text-sm" min="0.01" step="0.01" max={availableBalance} />
                {parseFloat(amount) > availableBalance && <p className="text-xs text-destructive">Exceeds available balance</p>}
              </div>
              <div className="space-y-2">
                <label className="text-label">Note (optional)</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this for?" className="glass-input w-full px-4 py-3 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={resetAndClose} className="btn-glass flex-1">Cancel</button>
              <button type="submit" disabled={!isFormValid} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                <Send className="w-4 h-4" /> Review
              </button>
            </div>
          </form>
        )}

        {step === "confirmation" && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col justify-between py-6 space-y-4">
            <div className="space-y-3">
              <div className="card-secondary space-y-1"><p className="text-label">To</p><p className="text-sm font-mono break-all">{recipient}</p></div>
              <div className="card-secondary space-y-1"><p className="text-label">Amount</p><p className="text-2xl font-bold">{parseFloat(amount).toLocaleString()} FLOW</p></div>
              <div className="card-secondary space-y-1"><p className="text-label">Balance After</p><p className="text-lg font-semibold text-primary">{(availableBalance - parseFloat(amount)).toLocaleString()} FLOW</p></div>
              {note && <div className="card-secondary space-y-1"><p className="text-label">Note</p><p className="text-sm">{note}</p></div>}
              <p className="text-xs text-muted-foreground text-center">This will execute on Flow testnet</p>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep("form")} className="btn-glass flex-1">Back</button>
              <button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {sendMutation.isPending ? "Sending..." : <><Send className="w-4 h-4" /> Confirm Send</>}
              </button>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Sent Successfully!</h3>
              <p className="text-sm text-muted-foreground">{parseFloat(amount).toLocaleString()} FLOW to {recipient.slice(0, 8)}...{recipient.slice(-4)}</p>
            </div>
            {txResult?.explorerUrl && (
              <a href={txResult.explorerUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
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

export default SendModal;
