import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ExternalLink, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ChatHeader from "@/components/ChatHeader";
import BottomNav from "@/components/BottomNav";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import flowmateLogo from "@/assets/flowmate-logo.svg";

interface ExecutionPayload {
  endpoint: string;
  body: Record<string, any>;
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  time: string;
  executionPayload?: ExecutionPayload | null;
  executionResult?: { explorerUrl: string } | null;
}

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: historyData } = useQuery({
    queryKey: ["chatHistory"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/chat/history");
      return data.data as Array<{ id: string; role: string; content: string; createdAt: string }>;
    },
  });

  useEffect(() => {
    if (historyData && historyData.length > 0 && messages.length === 0) {
      setMessages(historyData.map(m => ({
        id: m.id, role: m.role as "user" | "agent",
        content: m.content, time: formatTime(m.createdAt),
      })));
    }
  }, [historyData]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const executeAction = async (msgId: string, payload: ExecutionPayload) => {
    setExecuting(msgId);
    try {
      const { data } = await api.post(payload.endpoint, payload.body);
      const explorerUrl = data.data?.explorerUrl;
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, executionPayload: null, executionResult: { explorerUrl } } : m
      ));
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
      toast({
        title: "Action executed!",
        description: explorerUrl ? "Transaction confirmed on Flow testnet" : "Done",
      });
    } catch (err: any) {
      toast({ title: "Execution failed", description: err?.response?.data?.error || "Try again", variant: "destructive" });
    } finally {
      setExecuting(null);
    }
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input, time: now() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setSending(true);
    const thinkingId = `thinking_${Date.now()}`;
    setMessages(prev => [...prev, { id: thinkingId, role: "agent", content: "...", time: now() }]);
    try {
      const { data } = await api.post("/api/v1/chat", { message: currentInput });
      const { reply, executionPayload, messageId } = data.data;
      setMessages(prev =>
        prev.filter(m => m.id !== thinkingId).concat({
          id: messageId || Date.now().toString(),
          role: "agent", content: reply, time: now(),
          executionPayload: executionPayload || null,
        })
      );
    } catch {
      setMessages(prev =>
        prev.filter(m => m.id !== thinkingId).concat({
          id: Date.now().toString(), role: "agent", time: now(),
          content: "I'm having trouble connecting. Please check your connection and try again.",
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
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
              <img src={flowmateLogo} alt="" width={48} height={48} className="opacity-40" />
              <p className="text-sm text-muted-foreground text-center">
                Ask me to send, save, stake, or swap your FLOW.<br />
                <span className="text-primary/60">Try: "Save 100 FLOW to my savings vault"</span>
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {msg.role === "user" ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="chat-bubble-user"><p>{msg.content}</p></div>
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
                          {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </div>
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                    {msg.executionPayload && (
                      <div className="card-secondary space-y-2 border border-primary/20">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Action Ready</p>
                        <div className="text-sm space-y-1">
                          {Object.entries(msg.executionPayload.body).filter(([,v]) => v).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">{k}</span>
                              <span className="font-medium">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => executeAction(msg.id, msg.executionPayload!)}
                          disabled={executing === msg.id}
                          className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                          {executing === msg.id ? "Executing..." : <><Zap className="w-4 h-4" /> Execute Now</>}
                        </button>
                      </div>
                    )}
                    {msg.executionResult && (
                      <div className="card-secondary border border-primary/30 space-y-2">
                        <p className="text-sm font-medium text-primary">Transaction confirmed!</p>
                        {msg.executionResult.explorerUrl && (
                          <a href={msg.executionResult.explorerUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <ExternalLink className="w-3 h-3" /> View on Flowscan
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="absolute bottom-16 left-0 right-0 z-40 flex justify-center px-4 py-3">
          <div className="w-full max-w-md lg:max-w-lg">
            <div className="card-secondary flex items-center gap-2">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Message FlowMate..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <button onClick={send} disabled={!input.trim() || sending}
                className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-30">
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
