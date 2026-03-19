import { motion } from "framer-motion";
import { pricingSuggestions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Pricing() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Dynamic Pricing Engine</h2>
        <p className="text-sm text-muted-foreground mt-1">Intelligent pricing recommendations based on market and demand data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pricingSuggestions.map((s, i) => (
          <motion.div
            key={s.id}
            className="glow-card p-5 space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">{s.product}</h3>
              <p className="insight-text mt-1">{s.reason}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="font-display text-lg font-bold text-foreground">${s.currentPrice}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary shrink-0" />
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-center">
                <p className="text-xs text-primary">Suggested</p>
                <p className="font-display text-lg font-bold text-primary">${s.suggestedPrice}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Confidence: </span>
                <span className={cn(
                  "font-medium",
                  s.confidence >= 80 ? "text-secondary" : s.confidence >= 70 ? "text-primary" : "text-muted-foreground"
                )}>
                  {s.confidence}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Impact: </span>
                <span className="text-foreground font-medium">{s.expectedImpact}</span>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="h-1.5 rounded-full bg-accent overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", s.confidence >= 80 ? "bg-secondary" : "bg-primary")}
                initial={{ width: 0 }}
                animate={{ width: `${s.confidence}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <Check className="h-3.5 w-3.5" /> Apply
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                <X className="h-3.5 w-3.5" /> Dismiss
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
