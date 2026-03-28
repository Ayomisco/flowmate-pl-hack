import { motion } from "framer-motion";
import {
  Wallet,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Send,
  ArrowDownUp,
  Plus,
} from "lucide-react";
import ChatHeader from "@/components/ChatHeader";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

const vaults = [
  { label: "Available", amount: 12500, icon: Wallet, color: "text-primary" },
  { label: "Savings", amount: 4200, icon: PiggyBank, color: "text-primary" },
  { label: "Emergency", amount: 2800, icon: ShieldCheck, color: "text-primary" },
  { label: "Staking", amount: 1500, icon: TrendingUp, color: "text-primary" },
];

const quickActions = [
  { label: "Send", icon: Send, color: "bg-primary/15 text-primary" },
  { label: "Receive", icon: ArrowDownLeft, color: "bg-primary/15 text-primary" },
  { label: "Swap", icon: ArrowDownUp, color: "bg-primary/15 text-primary" },
  { label: "Save", icon: Plus, color: "bg-primary/15 text-primary" },
];

const recentActivity = [
  { type: "out", label: "Sent to John", desc: "0x8f3d...a2c1", amount: -2000, time: "Today, 9:00 AM" },
  { type: "in", label: "Salary received", desc: "From employer", amount: 100000, time: "Yesterday" },
  { type: "save", label: "Auto-saved", desc: "→ Studio Fund", amount: -2500, time: "Friday" },
  { type: "swap", label: "Swapped FLOW→USDC", desc: "50 FLOW at $0.82", amount: -41, time: "Thursday" },
  { type: "out", label: "Electricity bill", desc: "Auto-pay", amount: -5000, time: "Mar 15" },
  { type: "stake", label: "Staked FLOW", desc: "8.2% APY", amount: -1500, time: "Mar 12" },
];

const goals = [
  { name: "Studio Fund", current: 1240, target: 5000, eta: "Dec 18" },
  { name: "Emergency Reserve", current: 2800, target: 10000, eta: "Jun 2027" },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <ChatHeader />

        <div className="px-4 pt-4 pb-28 space-y-6 overflow-y-auto">
          {/* Total balance */}
          <motion.div {...fadeUp} className="glass-card-bright p-5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Total Balance
            </p>
            <h2 className="text-3xl font-bold">
              $21,000<span className="text-lg text-muted-foreground">.00</span>
            </h2>
            <div className="flex items-center justify-center gap-1 mt-1 text-primary text-xs font-medium">
              <TrendingUp className="w-3 h-3" /> +4.2% this month
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
            <div className="flex justify-between gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate("/chat")}
                  className="flex-1 flex flex-col items-center gap-2 py-3"
                >
                  <div className={`p-3 rounded-2xl ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Vaults */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Vaults
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {vaults.map((v) => (
                <div key={v.label} className="glass-card p-4 space-y-2">
                  <v.icon className={`w-5 h-5 ${v.color}`} />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {v.label}
                  </p>
                  <p className="text-lg font-bold">
                    ${v.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Goals */}
          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Goals
            </h3>
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g.name} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{g.name}</p>
                    <span className="text-xs text-primary font-medium">
                      ${g.current.toLocaleString()} / ${g.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(g.current / g.target) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-primary/70 italic">ETA: {g.eta}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
            <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Recent Activity
            </h3>
            <div className="glass-card divide-y divide-border/30">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`p-2 rounded-xl ${
                      a.type === "in"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.type === "in" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : a.type === "save" || a.type === "stake" ? (
                      <PiggyBank className="w-4 h-4" />
                    ) : a.type === "swap" ? (
                      <ArrowDownUp className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {a.time}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      a.amount > 0 ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {a.amount > 0 ? "+" : ""}${Math.abs(a.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Dashboard;
