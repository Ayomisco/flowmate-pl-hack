import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Fingerprint } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-bg.jpg";
import flowmateIcon from "@/assets/flowmate-logo.svg";

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Sign in failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePasskey = async () => {
    if (!email.trim() || !password.trim()) {
      setShowEmail(true);
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Registration failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background */}
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm"
      >
        {/* Logo */}
        <motion.img
          src={flowmateIcon}
          alt="FlowMate"
          width={72}
          height={72}
          className="mb-4 drop-shadow-lg"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        />

        <h1 className="text-4xl font-bold tracking-tight mb-1">FlowMate</h1>
        <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-10">
          Autonomous Financial Agent
        </p>

        {/* Tagline */}
        <div className="glass-card px-6 py-4 text-center mb-6 w-full">
          <p className="text-base font-body leading-relaxed">
            Your autonomous financial operating system. <br/>
            <span className="text-primary font-semibold text-glow">Save automatically.</span>{" "}
            <span className="text-primary font-semibold text-glow">Send intelligently.</span>{" "}
            <span className="text-primary font-semibold text-glow">Invest autonomously.</span>
          </p>
        </div>

        {/* Status */}
        <div className="status-badge mb-10">
          <span className="glow-dot" />
          Network Active
        </div>

        {/* Auth buttons */}
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
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="glass-input w-full px-4 py-3 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Continue"}
              </button>
            </motion.form>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreatePasskey}
            disabled={loading}
            className="btn-glass w-full flex items-center justify-center gap-3 text-base disabled:opacity-60"
          >
            <Fingerprint className="w-5 h-5" />
            Create Account
          </motion.button>
        </div>

        {/* Footer links */}
        <div className="flex items-center gap-6 mt-10 text-xs text-muted-foreground tracking-widest uppercase">
          <button className="hover:text-foreground transition-colors">Privacy</button>
          <button className="hover:text-foreground transition-colors">Terms</button>
          <button className="hover:text-foreground transition-colors">Nodes</button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-3 tracking-wider uppercase">
          Powered by Autonomous Ledger Protocol v2.4
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
