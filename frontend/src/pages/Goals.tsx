import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Target, Trophy, ChevronLeft, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: "active" | "achieved";
  createdAt: string;
}

const Goals = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [form, setForm] = useState({ name: "", targetAmount: "", deadline: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/goals");
      return data.data as Goal[];
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/v1/goals", {
        name: form.name.trim(),
        targetAmount: parseFloat(form.targetAmount),
        deadline: form.deadline,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowCreate(false);
      setForm({ name: "", targetAmount: "", deadline: "" });
      toast({ title: "Goal created", description: "Start contributing to reach your target" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err?.response?.data?.error || "Try again", variant: "destructive" });
    },
  });

  const contributeMutation = useMutation({
    mutationFn: (goalId: string) =>
      api.patch(`/api/v1/goals/${goalId}/contribute`, { amount: parseFloat(contributeAmount) }),
    onSuccess: (_, goalId) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      setContributeId(null);
      setContributeAmount("");
      const goal = (data || []).find(g => g.id === goalId);
      toast({ title: "Contribution added", description: goal ? `Saved to "${goal.name}"` : "Goal updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err?.response?.data?.error || "Try again", variant: "destructive" });
    },
  });

  const goals = data || [];
  const activeGoals = goals.filter(g => g.status === "active");
  const achievedGoals = goals.filter(g => g.status === "achieved");

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">Goals</span>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </header>

        <div className="px-4 pt-4 pb-28 space-y-3 overflow-y-auto">

          {/* Create Form */}
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-secondary space-y-3 border border-primary/20"
            >
              <p className="text-sm font-semibold text-primary">New Savings Goal</p>

              <div className="space-y-2">
                <label className="text-label">Goal Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Emergency Fund, New Laptop"
                  className="glass-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-label">Target Amount (FLOW)</label>
                <input
                  type="number"
                  value={form.targetAmount}
                  onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="0.00"
                  className="glass-input w-full px-3 py-2 text-sm"
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-label">Target Date</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="glass-input w-full px-3 py-2 text-sm"
                  min={minDateStr}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-glass flex-1 text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={
                    !form.name.trim() ||
                    !form.targetAmount ||
                    parseFloat(form.targetAmount) <= 0 ||
                    !form.deadline ||
                    createMutation.isPending
                  }
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <><Target className="w-3.5 h-3.5" /> Create</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Active Goals */}
          {!isLoading && activeGoals.length > 0 && (
            <div className="space-y-3">
              {activeGoals.map(goal => {
                const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                const daysLeft = Math.ceil(
                  (new Date(goal.deadline).getTime() - Date.now()) / 86_400_000
                );
                const isContributing = contributeId === goal.id;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-secondary space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{goal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left` : "Deadline passed"}
                          {" · "}
                          {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full text-primary bg-primary/10 whitespace-nowrap font-medium">
                        active
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {goal.currentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW saved
                        </span>
                        <span className="font-medium text-foreground">
                          {goal.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right">{pct.toFixed(1)}% complete</p>
                    </div>

                    {/* Contribute */}
                    {isContributing ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={contributeAmount}
                          onChange={e => setContributeAmount(e.target.value)}
                          placeholder="Amount in FLOW"
                          className="glass-input flex-1 px-3 py-2 text-sm"
                          min="0.01"
                          step="0.01"
                          autoFocus
                        />
                        <button
                          onClick={() => setContributeId(null)}
                          className="btn-glass px-3 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => contributeMutation.mutate(goal.id)}
                          disabled={
                            !contributeAmount ||
                            parseFloat(contributeAmount) <= 0 ||
                            contributeMutation.isPending
                          }
                          className="btn-primary px-3 text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          {contributeMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setContributeId(goal.id); setContributeAmount(""); }}
                        className="btn-glass w-full text-sm"
                      >
                        + Contribute
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Achieved Goals */}
          {!isLoading && achievedGoals.length > 0 && (
            <div className="space-y-2">
              <p className="text-label px-1">Achieved</p>
              {achievedGoals.map(goal => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-secondary opacity-70 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                      <p className="text-sm font-semibold truncate">{goal.name}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full text-yellow-400 bg-yellow-400/10 whitespace-nowrap font-medium">
                      achieved
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-primary/40 overflow-hidden">
                    <div className="h-full w-full rounded-full bg-yellow-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goal.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} FLOW · {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && goals.length === 0 && (
            <div className="flex flex-col items-center py-16 space-y-3">
              <Target className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground text-center">
                No goals yet.<br />Set a target and start saving automatically.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary text-sm px-6"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Create First Goal
              </button>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Goals;
