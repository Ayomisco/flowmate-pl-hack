import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-bg.jpg";
import flowmateIcon from "@/assets/flowmate-logo.svg";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
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
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 w-full max-w-xs"
      >
        {/* Logo + wordmark */}
        <motion.div
          className="flex flex-col items-center gap-4 mb-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <img src={flowmateIcon} alt="FlowMate" width={48} height={48} className="drop-shadow-lg" />
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">FlowMate</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
              Your autonomous financial agent on Flow.
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleEmailSignIn}
          className="w-full space-y-3"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="glass-input w-full px-4 py-3 text-sm"
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending link…
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.form>

        {/* Footer */}
        <p className="mt-16 text-[11px] text-muted-foreground/50 tracking-wide">
          Powered by Flow Blockchain
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
