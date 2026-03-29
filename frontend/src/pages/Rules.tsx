import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Pause, Play, Trash2, ChevronLeft, Zap } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Rule {
  id: string;
  type: string;
  status: string;
  config: Record<string, any>;
  nextExecution?: string;
  createdAt: string;
  scheduledTransaction?: {
    frequency: string;
    dayOfWeek?: number;
    time?: string;
  };
}

const TYPE_COLORS: Record<string, string> = {
  save: "text-blue-400 bg-blue-400/10",
  send: "text-orange-400 bg-orange-400/10",
  dca: "text-purple-400 bg-purple-400/10",
  stake: "text-yellow-400 bg-yellow-400/10",
  bill: "text-green-400 bg-green-400/10",
};

const TYPE_LABELS: Record<string, string> = {
  save: "Auto-Save", send: "Recurring Send", dca: "DCA",
  stake: "Auto-Stake", bill: "Bill Payment",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FREQ_LABELS: Record<string, string> = {
  daily: "Every day", weekly: "Every week",
  biweekly: "Every 2 weeks", monthly: "Every month",
};

const Rules = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    type: "save", amount: "", toVault: "savings",
    recipient: "", frequency: "weekly", dayOfWeek: 5, time: "09:00",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["rules"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/rules");
      return data.data as Rule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/api/v1/rules", {
      type: form.type,
      config: {
        amount: parseFloat(form.amount),
        ...(form.type === "save" ? { toVault: form.toVault } : {}),
        ...(form.type === "send" ? { recipient: form.recipient } : {}),
      },
      frequency: form.frequency,
      dayOfWeek: parseInt(String(form.dayOfWeek)),
      time: form.time,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      setShowCreate(false);
      setForm({ type: "save", amount: "", toVault: "savings", recipient: "", frequency: "weekly", dayOfWeek: 5, time: "09:00" });
      toast({ title: "Rule created", description: "Automation is now active" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err?.response?.data?.error || "Try again", variant: "destructive" });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/rules/${id}/pause`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/rules/${id}/resume`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      toast({ title: "Rule deleted" });
    },
  });

  const rules = data || [];

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">Automations</span>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary/80 transition-colors">
            <Plus className="w-4 h-4" /> New Rule
          </button>
        </header>

        <div className="px-4 pt-4 pb-28 space-y-3 overflow-y-auto">

          {/* Create Form */}
          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="card-secondary space-y-3 border border-primary/20">
              <p className="text-sm font-semibold text-primary">New Automation Rule</p>
              <div className="space-y-2">
                <label className="text-label">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="glass-input w-full px-3 py-2 text-sm">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-label">Amount (FLOW)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" className="glass-input w-full px-3 py-2 text-sm" min="0.01" step="0.01" />
              </div>
              {form.type === "save" && (
                <div className="space-y-2">
                  <label className="text-label">Save To</label>
                  <select value={form.toVault} onChange={e => setForm(f => ({ ...f, toVault: e.target.value }))}
                    className="glass-input w-full px-3 py-2 text-sm">
                    <option value="savings">Savings</option>
                    <option value="emergency">Emergency Fund</option>
                    <option value="staking">Staking</option>
                  </select>
                </div>
              )}
              {form.type === "send" && (
                <div className="space-y-2">
                  <label className="text-label">Recipient Address</label>
                  <input type="text" value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                    placeholder="0x..." className="glass-input w-full px-3 py-2 text-sm" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-label">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    className="glass-input w-full px-3 py-2 text-sm">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-label">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="glass-input w-full px-3 py-2 text-sm" />
                </div>
              </div>
              {(form.frequency === "weekly" || form.frequency === "biweekly") ? (
                <div className="space-y-2">
                  <label className="text-label">Day of Week</label>
                  <div className="flex gap-1 flex-wrap">
                    {DAYS.map((d, i) => (
                      <button key={d} type="button" onClick={() => setForm(f => ({ ...f, dayOfWeek: i }))}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${form.dayOfWeek === i ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-glass flex-1 text-sm">Cancel</button>
                <button onClick={() => createMutation.mutate()}
                  disabled={!form.amount || parseFloat(form.amount) <= 0 || createMutation.isPending}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-1 disabled:opacity-50">
                  {createMutation.isPending ? "Creating..." : <><Zap className="w-3 h-3" /> Create</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* Rules List */}
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}</div>
          ) : rules.length > 0 ? (
            rules.map(rule => (
              <motion.div key={rule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`card-secondary space-y-2 ${rule.status === 'paused' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[rule.type] || "text-muted-foreground bg-muted/30"}`}>
                      {TYPE_LABELS[rule.type] || rule.type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rule.status === 'active' ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted/30'}`}>
                      {rule.status}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => rule.status === 'active' ? pauseMutation.mutate(rule.id) : resumeMutation.mutate(rule.id)}
                      className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary">
                      {rule.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => deleteMutation.mutate(rule.id)}
                      className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{(rule.config as any)?.amount} FLOW</span>
                  <span className="text-muted-foreground text-xs">
                    {rule.scheduledTransaction ? FREQ_LABELS[rule.scheduledTransaction.frequency] || rule.scheduledTransaction.frequency : 'one-time'}
                    {rule.scheduledTransaction?.dayOfWeek !== undefined ? ` · ${DAYS[rule.scheduledTransaction.dayOfWeek]}` : ''}
                    {rule.scheduledTransaction?.time ? ` @ ${rule.scheduledTransaction.time}` : ''}
                  </span>
                </div>
                {rule.nextExecution && rule.status === 'active' && (
                  <p className="text-xs text-muted-foreground">
                    Next: {new Date(rule.nextExecution).toLocaleDateString()} at {new Date(rule.nextExecution).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {(rule.config as any)?.toVault && (
                  <p className="text-xs text-muted-foreground">→ {(rule.config as any).toVault} vault</p>
                )}
                {(rule.config as any)?.recipient && (
                  <p className="text-xs text-muted-foreground font-mono">→ {(rule.config as any).recipient.slice(0, 12)}...</p>
                )}
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center py-16 space-y-3">
              <Zap className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground text-center">No automation rules yet.<br />Create one or ask the AI agent.</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-6">
                <Plus className="w-4 h-4 inline mr-1" /> Create First Rule
              </button>
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    </div>
  );
};

export default Rules;
