import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ChatHeader from "@/components/ChatHeader";
import BottomNav from "@/components/BottomNav";
import api from "@/lib/api";
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

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  const { data: historyData } = useQuery({
    queryKey: ["chatHistory"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/chat/history");
      return data.data as Array<{ id: string; role: string; content: string; createdAt: string }>;
    },
  });

  useEffect(() => {
    if (historyData && historyData.length > 0 && messages.length === 0) {
      const loaded: Message[] = historyData.map((m) => ({
        id: m.id,
        role: m.role as "user" | "agent",
        content: m.content,
        time: formatTime(m.createdAt),
      }));
      setMessages(loaded);
    }
  }, [historyData]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      time: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setSending(true);

    // Optimistic thinking indicator
    const thinkingId = `thinking_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "agent", content: "...", time: now() },
    ]);

    try {
      const { data } = await api.post("/api/v1/chat", { message: currentInput });
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingId)
          .concat({
            id: data.data.messageId || Date.now().toString(),
            role: "agent",
            content: data.data.reply,
            time: now(),
          })
      );
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingId)
          .concat({
            id: Date.now().toString(),
            role: "agent",
            content: "I'm having trouble connecting right now. Please try again.",
            time: now(),
          })
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="flex-1 flex flex-col app-container">
        <ChatHeader />

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
              <img src={flowmateLogo} alt="" width={48} height={48} className="opacity-40" />
              <p className="text-sm text-muted-foreground text-center">
                Ask FlowMate anything about your finances.
                <br />Try: "Save 10% of my income weekly"
              </p>
            </div>
          )}
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
                    <span className="text-[10px] text-muted-foreground mr-1">{msg.time}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={flowmateLogo} alt="" width={28} height={28} className="rounded-md" />
                      <span className="text-primary font-semibold text-sm">FlowMate Agent</span>
                    </div>
                    <div className="card-secondary">
                      {msg.content === "..." ? (
                        <div className="flex gap-1 py-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                    {msg.card && (
                      <div className="card-secondary space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">{msg.card.title}</h3>
                        {msg.card.progress && (
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
                                style={{ inlineSize: `${(msg.card.progress.current / msg.card.progress.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {msg.card.eta && (
                          <p className="text-xs text-muted-foreground">{msg.card.eta}</p>
                        )}
                        {msg.card.action && (
                          <button className="btn-primary w-full text-sm mt-1">{msg.card.action}</button>
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
                disabled={!input.trim() || sending}
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
