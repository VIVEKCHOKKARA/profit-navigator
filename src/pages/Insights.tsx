import { motion } from "framer-motion";
import { aiInsights } from "@/lib/mock-data";
import { Lightbulb, TrendingUp, Package, Zap, Shield, Users } from "lucide-react";

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
            <motion.div
              key={i}
              className="glow-card p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
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

      <motion.div
        className="glow-card p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-display text-base font-semibold text-foreground mb-3">How to use these insights</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Review each insight and assess its relevance to your current situation.</li>
          <li className="flex gap-2"><span className="text-primary font-bold">2.</span> For pricing recommendations, navigate to the Pricing Engine to apply changes.</li>
          <li className="flex gap-2"><span className="text-primary font-bold">3.</span> For inventory alerts, check your supplier agreements and plan accordingly.</li>
          <li className="flex gap-2"><span className="text-primary font-bold">4.</span> Insights refresh as new transactions are logged — check back regularly.</li>
        </ul>
      </motion.div>
    </div>
  );
}
