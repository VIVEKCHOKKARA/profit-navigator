import { useState, useEffect, useRef } from "react";
import { fetchChatHistory, saveChatMessage, getChatStreamUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SESSION_ID = "default";

export default function AIChatbot({ fullHeight = false }: { fullHeight?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history from API on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchChatHistory(SESSION_ID);
        if (data && data.length > 0) {
          setMessages(data.map(d => ({ role: d.role as "user" | "assistant", content: d.content })));
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    await saveChatMessage("user", userMsg.content, SESSION_ID);

    let assistantSoFar = "";
    try {
      const resp = await fetch(getChatStreamUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages, session_id: SESSION_ID }),
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
          // Parse only the JSON here — a parse failure means a partial chunk,
          // so re-buffer and wait for more data.
          let parsed: any;
          try {
            parsed = JSON.parse(jsonStr);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
          // Backend streams { error } when the model call fails (e.g. bad/missing
          // GROQ_API_KEY). HTTP status is still 200, so surface it as a thrown error
          // (handled by the outer try/catch -> toast) rather than re-buffering it.
          if (parsed.error) {
            throw new Error(parsed.error);
          }
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
        }
      }

      // Assistant message is saved server-side by Flask
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
            Groq Llama 3.3 · Multilingual
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
                Ask in any language — Telugu, Hindi, Tamil, English, or Spanish. The AI will reply in the same language.
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
            placeholder="Ask in any language — Telugu, Hindi, Tamil, English..."
            className="flex-1 bg-background h-12 shadow-inner border-border focus:ring-primary"
            disabled={isLoading}
          />
          <Button onClick={send} disabled={isLoading || !input.trim()} size="icon" className="shrink-0 h-12 w-12 rounded-xl shadow-lg shadow-primary/20">
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {fullHeight && (
          <p className="text-[10px] text-muted-foreground text-center mt-4 uppercase tracking-widest font-bold opacity-50">
            Powered by Groq Llama 3.3 · తెలుగు · हिंदी · English
          </p>
        )}
      </div>
    </motion.div>
  );
}
