import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-bg.jpg";
import flowmateIcon from "@/assets/flowmate-logo.svg";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await loginWithEmail(email.trim());
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Sign in failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm"
      >
        <motion.img
          src={flowmateIcon} alt="FlowMate" width={72} height={72}
          className="mb-4 drop-shadow-lg"
          initial={{ scale: 0.8 }} animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        />
        <h1 className="text-4xl font-bold tracking-tight mb-1">FlowMate</h1>
        <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-10">
          Autonomous Financial Agent
        </p>

        <div className="glass-card px-6 py-4 text-center mb-6 w-full">
          <p className="text-base font-body leading-relaxed">
            Your autonomous financial operating system.<br />
            <span className="text-primary font-semibold text-glow">Save automatically.</span>{" "}
            <span className="text-primary font-semibold text-glow">Send intelligently.</span>{" "}
            <span className="text-primary font-semibold text-glow">Invest autonomously.</span>
          </p>
        </div>

        <div className="status-badge mb-10">
          <span className="glow-dot" />
          Network Active · Flow Testnet
        </div>

        <div className="w-full space-y-3">
          {!showEmail ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowEmail(true)}
              className="btn-primary w-full flex items-center justify-center gap-3 text-base"
            >
              <Mail className="w-5 h-5" />
              Sign in with Email
            </motion.button>
          ) : (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleEmailSignIn}
              className="space-y-3"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="glass-input w-full px-4 py-3 text-sm"
                autoFocus
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground text-center px-2">
                We'll send a one-time code to your email. No password needed.
              </p>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full text-base flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</>
                ) : (
                  "Continue"
                )}
              </button>
            </motion.form>
          )}
        </div>

        <div className="flex items-center gap-6 mt-10 text-xs text-muted-foreground tracking-widest uppercase">
          <button className="hover:text-foreground transition-colors">Privacy</button>
          <button className="hover:text-foreground transition-colors">Terms</button>
          <button className="hover:text-foreground transition-colors">Nodes</button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-3 tracking-wider uppercase">
          Powered by Magic Link · Flow Blockchain
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
