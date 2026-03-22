import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const SESSION_ID = "default";

export default function AIChatbot() {
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
      className="glow-card flex flex-col h-[500px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="font-display text-base font-semibold text-foreground">AI Business Advisor</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ask me anything about your business data, sales trends, or for advice!
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="rounded-lg bg-primary/10 p-2 shrink-0 self-start">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`rounded-lg p-3 max-w-[80%] text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              {msg.role === "user" && (
                <div className="rounded-lg bg-accent p-2 shrink-0 self-start">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg bg-accent p-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about your business data..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button onClick={send} disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
