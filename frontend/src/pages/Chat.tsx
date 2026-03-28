import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ChatHeader from "@/components/ChatHeader";
import BottomNav from "@/components/BottomNav";
import flowmateLogo from "@/assets/flowmate-logo.svg";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  time: string;
  card?: {
    label: string;
    title: string;
    progress?: { current: number; total: number };
    eta?: string;
    action?: string;
  };
}

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const initialMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content:
      "I'm looking to save $5,000 for a new creative studio setup by the end of the year. Can you help me optimize my weekly spending?",
    time: "14:20",
  },
  {
    id: "2",
    role: "agent",
    content:
      "I've analyzed your cash flow trends for the last quarter. Based on your current trajectory, I've identified $140 in monthly non-essential recurring subscriptions we can redirect.",
    time: "14:20",
    card: {
      label: "TARGET STRATEGY",
      title: "Studio Fund",
      progress: { current: 1240, total: 5000 },
      eta: "On track to reach goal by Dec 18th",
      action: "Confirm Optimization",
    },
  },
  {
    id: "3",
    role: "user",
    content:
      "That looks great. Let's also look at my food budget. I spend way too much on coffee.",
    time: "14:21",
  },
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      time: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate agent response
    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content:
          "I'm analyzing your request. Let me look into your spending patterns and suggest an optimized plan.",
        time: now(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 1200);
  };

  return (
    <div className="page-shell">
      <div className="flex-1 flex flex-col app-container">
        <ChatHeader />

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === "user" ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="chat-bubble-user">
                      <p>{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mr-1">
                      {msg.time}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Agent label */}
                    <div className="flex items-center gap-2">
                      <img src={flowmateLogo} alt="" width={28} height={28} className="rounded-md" />
                      <span className="text-primary font-semibold text-sm">
                        FlowMate Agent
                      </span>
                    </div>

                    {/* Text bubble */}
                    <div className="card-secondary">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Optional card */}
                    {msg.card && (
                      <div className="card-secondary space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">{msg.card.title}</h3>
                        {msg.card.progress && (
                          <>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="text-primary font-semibold">
                                  {Math.round((msg.card.progress.current / msg.card.progress.total) * 100)}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: `${(msg.card.progress.current / msg.card.progress.total) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}
                        {msg.card.eta && (
                          <p className="text-xs text-muted-foreground">{msg.card.eta}</p>
                        )}
                        {msg.card.action && (
                          <button className="btn-primary w-full text-sm mt-1">
                            {msg.card.action}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="absolute bottom-16 left-0 right-0 z-40 flex justify-center px-4 py-3">
          <div className="w-full max-w-md lg:max-w-lg">
            <div className="card-secondary flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Message FlowMate..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Chat;

