import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronLeft, ExternalLink, CheckCheck, Gift, Zap, Target, AlertCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    explorerUrl?: string;
    txHash?: string;
    amount?: number;
    onChain?: boolean;
  };
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  payment_sent: <Gift className="w-4 h-4 text-primary" />,
  action_executed: <Zap className="w-4 h-4 text-yellow-400" />,
  goal_progress: <Target className="w-4 h-4 text-green-400" />,
  alert: <AlertCircle className="w-4 h-4 text-orange-400" />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/notifications");
      return data.data as { notifications: Notification[]; unreadCount: number };
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/api/v1/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1 as any)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </header>

        <div className="px-4 pt-4 pb-28 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-16 space-y-3">
              <Bell className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground text-center">
                No notifications yet.<br />
                We'll notify you when something happens.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => !n.read && markReadMutation.mutate(n.id)}
                  className={`card-secondary space-y-2 cursor-pointer transition-opacity ${
                    n.read ? "opacity-70" : "border border-primary/15"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-0.5 p-2 rounded-lg bg-muted/40 shrink-0">
                      {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold leading-snug">{n.title}</p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground/60">
                          {timeAgo(n.createdAt)}
                        </span>

                        {n.metadata?.explorerUrl && (
                          <a
                            href={n.metadata.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            View on Flowscan
                          </a>
                        )}

                        {n.metadata?.amount && (
                          <span className="text-[10px] font-medium text-primary">
                            +{n.metadata.amount} FLOW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Notifications;
