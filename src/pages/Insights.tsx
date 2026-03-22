import { motion } from "framer-motion";
import { aiInsights } from "@/lib/mock-data";
import { Lightbulb, TrendingUp, Package, Zap, Shield, Users } from "lucide-react";
import AIChatbot from "@/components/AIChatbot";

const insightIcons: Record<string, any> = {
  "trending-up": TrendingUp,
  package: Package,
  zap: Zap,
  shield: Shield,
  users: Users,
};

export default function Insights() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">AI Insights</h2>
        <p className="text-sm text-muted-foreground mt-1">Plain-language business advice powered by your data</p>
      </div>

      {/* AI Chatbot */}
      <AIChatbot />

      <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 p-4">
        <Lightbulb className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-foreground">
          These insights are generated from your sales, inventory, and financial data. They update automatically as new data flows in.
        </p>
      </div>

      <div className="space-y-4">
        {aiInsights.map((insight, i) => {
          const Icon = insightIcons[insight.icon] || Lightbulb;
          return (
            <motion.div key={i} className="glow-card p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="flex gap-4">
                <div className="rounded-lg bg-accent p-3 shrink-0 self-start">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-base font-semibold text-foreground">{insight.title}</h3>
                  <p className="insight-text leading-relaxed">{insight.text}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
