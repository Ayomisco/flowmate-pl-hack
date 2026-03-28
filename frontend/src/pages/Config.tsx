import { useState } from "react";
import { motion } from "framer-motion";
import {
  Gauge,
  ChevronRight,
  LogOut,
  User,
  Shield,
  Bell,
  HelpCircle,
} from "lucide-react";
import ChatHeader from "@/components/ChatHeader";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

const autonomyModes = [
  { id: "manual", label: "Manual", desc: "Approve every operation" },
  { id: "assist", label: "Assisted", desc: "Confirm before FlowMate executes" },
  { id: "autopilot", label: "Autonomous", desc: "FlowMate operates fully autonomously" },
] as const;

const menuItems = [
  { icon: User, label: "Edit Profile", route: "/profile" },
  { icon: Shield, label: "Security & Limits", route: "" },
  { icon: Bell, label: "Notifications", route: "" },
  { icon: HelpCircle, label: "Help & Support", route: "" },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const Config = () => {
  const [mode, setMode] = useState<string>("assist");
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <ChatHeader />

        <div className="px-4 pt-4 pb-28 space-y-6 overflow-y-auto">
          {/* User card */}
          <motion.div {...fadeUp} className="glass-card-bright p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border border-primary/30">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate">Amaka Obi</p>
              <p className="text-xs text-muted-foreground truncate">amaka@email.com</p>
              <p className="text-[10px] font-mono text-primary/70 mt-0.5">0x1a2b...9f3d</p>
            </div>
          </motion.div>

          {/* Autonomy slider */}
          <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
            <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5" /> Autonomy Mode
            </h3>
            <div className="glass-card p-1 flex gap-1">
              {autonomyModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex-1 py-3 rounded-xl text-center transition-all text-sm ${
                    mode === m.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {autonomyModes.find((m) => m.id === mode)?.desc}
            </p>
          </motion.div>

          {/* Menu items */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <div className="glass-card divide-y divide-border/30">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.route && navigate(item.route)}
                  className="flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-muted/20 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Logout */}
          <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
            <button
              onClick={() => navigate("/")}
              className="btn-glass w-full flex items-center justify-center gap-2 text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Config;
