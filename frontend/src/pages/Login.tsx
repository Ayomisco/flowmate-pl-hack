import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowRight } from "lucide-react";
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
      {/* Background with overlay */}
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm"
      >
        {/* Branding - Logo only (cleaner) */}
        <motion.div
          className="text-center mb-16"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <img
            src={flowmateIcon}
            alt="FlowMate"
            width={64}
            height={64}
            className="mx-auto drop-shadow-lg mb-6"
          />
          <p className="text-muted-foreground text-sm tracking-widest uppercase font-medium">
            Autonomous Financial Agent
          </p>
        </motion.div>

        {/* Auth form container */}
        <div className="w-full">
          {!showEmail ? (
            // Initial CTA - Sign in button
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowEmail(true)}
                className="btn-primary w-full flex items-center justify-center gap-3 text-base py-3 group"
              >
                <Mail className="w-5 h-5" />
                Get Started
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>

              <p className="text-xs text-muted-foreground/70 text-center px-2 mt-4">
                Sign in or create account with your email • No password required
              </p>
            </motion.div>
          ) : (
            // Email form
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleEmailSignIn}
              className="space-y-3"
            >
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="glass-input w-full px-4 py-3 text-sm"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <p className="text-xs text-muted-foreground/70 px-2">
                We'll send a magic link to your email. Click it to sign in.
              </p>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full text-base flex items-center justify-center gap-2 py-3 disabled:opacity-60 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEmail(false);
                  setEmail("");
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                ← Back
              </button>
            </motion.form>
          )}
        </div>

        {/* Footer attribution - minimal */}
        <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground/80 tracking-wider">
            Powered by{" "}
            <span className="text-primary font-medium">Magic Link</span> &{" "}
            <span className="text-primary font-medium">Flow Blockchain</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
