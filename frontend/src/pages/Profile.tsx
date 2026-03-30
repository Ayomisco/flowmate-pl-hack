import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  ArrowLeft,
  Check,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/users/me");
      return data.data;
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
      });
    }
  }, [profile]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Save profile mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      api.put("/api/v1/users/me/profile", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Success", description: "Profile updated" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="page-shell">
      <div className="flex-1 app-container">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <button
            onClick={() => navigate("/config")}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold">Edit Profile</h1>
        </header>

        <div className="px-4 pt-6 pb-28 space-y-6 overflow-y-auto">
          {/* Avatar */}
          <motion.div {...fadeUp} className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-primary/30">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Tap to change photo</p>
          </motion.div>

          {/* Form fields */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="space-y-4">
            {[
              { key: "name", label: "Full Name", icon: User, type: "text" },
              { key: "email", label: "Email", icon: Mail, type: "email" },
              { key: "phone", label: "Phone", icon: Phone, type: "tel" },
              { key: "location", label: "Location", icon: MapPin, type: "text" },
            ].map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-widest">
                  {field.label}
                </label>
                <div className="glass-card flex items-center gap-3 px-4 py-3">
                  <field.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => update(field.key, e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Flow Wallet */}
          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <label className="text-xs text-muted-foreground uppercase tracking-widest">
              Flow Wallet
            </label>
            <div className="glass-card px-4 py-3 mt-1.5 flex items-center justify-between">
              <span className="text-sm font-mono text-muted-foreground">
                {user?.walletAddress
                  ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                  : "Not connected"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider font-semibold">
                {user?.walletAddress ? "Connected" : "Disconnected"}
              </span>
            </div>
          </motion.div>

          {/* Save button */}
          <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className={`btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                saveMutation.isSuccess ? "bg-primary/80" : ""
              }`}
            >
              {saveMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : saveMutation.isSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Saved
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Profile;
