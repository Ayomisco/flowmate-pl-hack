import { useState } from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendModal = ({ isOpen, onClose }: SendModalProps) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isFormValid = recipient.trim().length > 0 && parseFloat(amount) > 0;
  const currentBalance = 21000;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setSubmitted(true);
      setTimeout(() => {
        setRecipient("");
        setAmount("");
        setSubmitted(false);
        onClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    setRecipient("");
    setAmount("");
    setSubmitted(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/30">
          <SheetTitle className="text-xl font-bold">Send Money</SheetTitle>
          <SheetClose asChild>
            <button className="rounded-lg hover:bg-muted/50 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </SheetClose>
        </SheetHeader>

        {!submitted ? (
          <form onSubmit={handleSend} className="flex-1 flex flex-col justify-between py-6 space-y-4">
            <div className="space-y-4">
              {/* Available Balance */}
              <div className="card-secondary space-y-1">
                <p className="text-label">Available Balance</p>
                <p className="text-2xl font-bold text-primary">${currentBalance.toLocaleString()}</p>
              </div>

              {/* Recipient Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="space-y-2"
              >
                <label className="text-label">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Enter recipient address (0x...)"
                  className="glass-input w-full px-4 py-3 text-sm"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Flow wallet address</p>
              </motion.div>

              {/* Amount Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <label className="text-label">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="glass-input w-full pl-8 pr-4 py-3 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              </motion.div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn-glass flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center space-y-4 py-6"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Sent Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                ${parseFloat(amount).toFixed(2)} to {recipient.slice(0, 10)}...
              </p>
            </div>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SendModal;