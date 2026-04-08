import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const SESSION_ID = "default";

export default function AIChatbot({ fullHeight = false }: { fullHeight?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history from DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", SESSION_ID)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        setMessages(data.map(d => ({ role: d.role as "user" | "assistant", content: d.content })));
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessage = async (role: string, content: string) => {
    await supabase.from("chat_messages").insert({ role, content, session_id: SESSION_ID });
  };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    await saveMessage("user", userMsg.content);

    let assistantSoFar = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to get response");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) {
        await saveMessage("assistant", assistantSoFar);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className={cn(
        "glow-card flex flex-col transition-all duration-300",
        fullHeight ? "h-full" : "h-[500px]"
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={cn(
        "flex items-center gap-2 p-4 border-b border-border transition-all",
        fullHeight ? "bg-accent/20" : ""
      )}>
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-display text-base font-semibold text-foreground">AI Business Consulting</h3>
        {fullHeight && (
          <span className="ml-auto text-xs font-medium text-muted-foreground uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            Enterprise Model
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2">How can I help your business today?</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask about sales trends, inventory management, or pricing optimization based on your real data.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="rounded-full bg-primary h-8 w-8 flex items-center justify-center shrink-0 self-start shadow-lg shadow-primary/20">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                "rounded-2xl p-4 max-w-[85%] text-sm shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-accent/80 backdrop-blur-sm text-foreground border border-border/50 rounded-tl-none"
              )}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="leading-relaxed">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="rounded-full bg-secondary h-8 w-8 flex items-center justify-center shrink-0 self-start shadow-md">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-4">
              <div className="rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center shrink-0 self-start">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl bg-accent/80 p-4 border border-border/50 rounded-tl-none">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className={cn(
        "p-6 border-t border-border transition-all",
        fullHeight ? "bg-accent/10" : ""
      )}>
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your business data, trends, or strategy..."
            className="flex-1 bg-background h-12 shadow-inner border-border focus:ring-primary"
            disabled={isLoading}
          />
          <Button onClick={send} disabled={isLoading || !input.trim()} size="icon" className="shrink-0 h-12 w-12 rounded-xl shadow-lg shadow-primary/20">
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {fullHeight && (
          <p className="text-[10px] text-muted-foreground text-center mt-4 uppercase tracking-widest font-bold opacity-50">
            Powered by GPT-4 Financial Engine
          </p>
        )}
      </div>
    </motion.div>
  );
}
