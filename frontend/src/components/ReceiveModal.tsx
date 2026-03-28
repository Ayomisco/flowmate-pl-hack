import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userWalletAddress: string;
}

const ReceiveModal = ({ isOpen, onClose, userWalletAddress }: ReceiveModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(userWalletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenedAddress = `${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)}`;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/30">
          <SheetTitle className="text-xl font-bold">Receive Money</SheetTitle>
          <SheetClose asChild>
            <button className="rounded-lg hover:bg-muted/50 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 flex flex-col justify-between py-6 space-y-6">
          {/* Address Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-4"
          >
            <p className="text-label">Your Wallet Address</p>

            {/* Address Card */}
            <div className="card-secondary space-y-3">
              {/* Full Address (helpful text) */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Full Address</p>
                <p className="text-xs font-mono break-all text-foreground/70">
                  {userWalletAddress}
                </p>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  copied
                    ? "bg-primary/20 text-primary"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Address
                  </>
                )}
              </button>
            </div>

            {/* QR Code Placeholder */}
            <div className="card-secondary flex flex-col items-center space-y-3 py-6">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">QR Code</p>
                  <p className="text-[10px] text-muted-foreground/60">(Coming soon)</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground max-w-xs">
                Share your address with others to receive payments
              </p>
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3"
          >
            <p className="text-xs leading-relaxed text-foreground/80">
              <span className="font-semibold">💡 Tip:</span> Share your address or QR code with anyone to receive FLOW, USDC, or other tokens on the Flow network.
            </p>
          </motion.div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Done
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReceiveModal;