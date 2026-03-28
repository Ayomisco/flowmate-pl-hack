import flowmateLogo from "@/assets/flowmate-logo.svg";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChatHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border/30">
      <div className="flex items-center gap-3">
        <img src={flowmateLogo} alt="FlowMate" width={32} height={32} className="rounded-lg" />
        <span className="text-primary font-bold text-lg">FlowMate</span>
      </div>
      <button
        onClick={() => navigate("/config")}
        className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
};

export default ChatHeader;
