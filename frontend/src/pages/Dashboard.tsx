import { useState } from "react";
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

const vaults = [
  { label: "Available", amount: 12500 },
  { label: "Savings", amount: 4200 },
  { label: "Emergency", amount: 2800 },
  { label: "Staking", amount: 1500 },
];

const recentActivity = [
  { type: "out", label: "Sent to John", desc: "0x8f3d...a2c1", amount: -2000, time: "Today, 9:00 AM" },
  { type: "in", label: "Salary received", desc: "From employer", amount: 100000, time: "Yesterday" },
  { type: "save", label: "Auto-saved", desc: "→ Studio Fund", amount: -2500, time: "Friday" },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const Dashboard = () => {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const totalVaults = vaults.reduce((sum, v) => sum + v.amount, 0);

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <ChatHeader />

        <div className="px-4 pt-6 pb-28 space-y-4 overflow-y-auto">
          {/* Primary: Balance Card */}
          <motion.div {...fadeUp} className="card-primary text-center space-y-2">
            <p className="text-label">Total Wealth</p>
            <h1 className="text-balance">$21,000</h1>
            <p className="text-xs text-primary/80 font-medium">+4.2% this month</p>
          </motion.div>

          {/* Primary Actions: Send & Receive */}
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

          {/* Divider */}
          <div className="divider-subtle my-2" />

          {/* Secondary: Vault Summary */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="card-secondary space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-label">Wealth Vaults</p>
              <p className="text-sm font-semibold text-primary">${totalVaults.toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {vaults.map((v) => (
                <div key={v.label} className="flex-1 min-w-[45%] bg-muted/30 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">{v.label}</p>
                  <p className="text-xs font-semibold text-foreground">${(v.amount / 1000).toFixed(1)}k</p>
                </div>
              ))}
            </div>
            <button className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View All Vaults <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Tertiary: Recent Activity */}
          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="card-secondary space-y-3">
            <p className="text-label">Recent Activity</p>
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div
                    className={`p-2 rounded-lg ${
                      a.type === "in"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.type === "in" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : a.type === "save" ? (
                      <ArrowDownUp className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${
                      a.amount > 0 ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {a.amount > 0 ? "+" : ""}${Math.abs(a.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View All Activity <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Modals */}
        <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} />
        <ReceiveModal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} userWalletAddress="0x1a2b...9f3d" />

        <BottomNav />
      </div>
    </div>
  );
};

export default Dashboard;
