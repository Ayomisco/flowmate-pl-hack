import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, LogOut, User } from "lucide-react";
import ChatHeader from "@/components/ChatHeader";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

const autonomyModes = [
  { id: "manual", label: "Manual", desc: "Approve every operation" },
  { id: "assist", label: "Assisted", desc: "Confirm before FlowMate executes" },
  { id: "autopilot", label: "Autonomous", desc: "FlowMate operates fully autonomously" },
] as const;

const menuItems = [
  { label: "Edit Profile", route: "/profile" },
  { label: "Security & Limits", route: "" },
  { label: "Notifications", route: "" },
  { label: "Help & Support", route: "" },
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

        <div className="px-4 pt-6 pb-28 space-y-4 overflow-y-auto">
          {/* User card */}
          <motion.div {...fadeUp} className="card-secondary flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">Amaka Obi</p>
              <p className="text-xs text-muted-foreground truncate">amaka@email.com</p>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="divider-subtle" />

          {/* Autonomy section */}
          <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="space-y-3">
            <p className="text-label">Agent Autonomy</p>
            <div className="grid grid-cols-3 gap-2">
              {autonomyModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`py-3 rounded-xl text-xs font-medium transition-all ${
                    mode === m.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-card/50 text-muted-foreground hover:bg-card/70"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground px-1">
              {autonomyModes.find((m) => m.id === mode)?.desc}
            </p>
          </motion.div>

          {/* Divider */}
          <div className="divider-subtle" />

          {/* Settings menu */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="space-y-2">
            <p className="text-label">Settings</p>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.route && navigate(item.route)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors text-sm"
                >
                  <span className="font-medium">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Sign out button */}
          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="pt-4">
            <button
              onClick={() => navigate("/")}
              className="w-full px-4 py-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium transition-colors flex items-center justify-center gap-2"
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
