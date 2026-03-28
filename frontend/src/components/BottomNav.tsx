import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Bot, Settings } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { path: "/dashboard", icon: LayoutGrid, label: "Home" },
  { path: "/chat", icon: Bot, label: "Agent" },
  { path: "/config", icon: Settings, label: "Config" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 py-1 px-5 transition-colors"
            >
              {active ? (
                <motion.div
                  layoutId="nav-active"
                  className="p-2.5 rounded-2xl bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <tab.icon className="w-5 h-5 text-primary-foreground" />
                </motion.div>
              ) : (
                <div className="p-2.5">
                  <tab.icon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <span
                className={`text-[10px] tracking-wider uppercase ${
                  active ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
