import flowmateLogo from "@/assets/flowmate-logo.svg";
import { Settings, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const ChatHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/notifications");
      return data.data as { unreadCount: number };
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // poll every 30s
  });

  const unread = data?.unreadCount ?? 0;

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border/30">
      <div className="flex items-center gap-3">
        <img src={flowmateLogo} alt="FlowMate" width={32} height={32} className="rounded-lg" />
        <span className="text-primary font-bold text-lg">FlowMate</span>
      </div>
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {unread > 99 ? "99+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate("/config")}
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
