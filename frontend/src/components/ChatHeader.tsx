import flowmateLogo from "@/assets/flowmate-logo.svg";

const ChatHeader = () => (
  <header className="flex items-center justify-between px-4 py-3 border-b border-border/30">
    <div className="flex items-center gap-3">
      <img src={flowmateLogo} alt="FlowMate" width={32} height={32} className="rounded-lg" />
      <span className="text-primary font-bold text-lg">FlowMate</span>
    </div>
  </header>
);

export default ChatHeader;
