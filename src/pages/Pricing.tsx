import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Suggestion = {
  id: string;
  productId: string;
  product: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  confidence: number;
  expectedImpact: string;
};

export default function Pricing() {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const generateSuggestions = useCallback((products: any[]) => {
    return products
      .filter(p => p.trend !== "stable" || p.cluster === "underperformer" || p.cluster === "star")
      .map(p => {
        let suggestedPrice = p.price;
        let reason = "";
        let impact = "";
        let confidence = 0;

        if (p.trend === "up" && p.cluster === "star") {
          suggestedPrice = Number((p.price * 1.08).toFixed(2));
          reason = "High demand & positive momentum. Market data suggests room for a 8% premium.";
          impact = `+$${Math.round(p.revenue * 0.05).toLocaleString()}/mo revenue`;
          confidence = 88;
        } else if (p.trend === "down") {
          suggestedPrice = Number((p.price * 0.90).toFixed(2));
          reason = "Declining sales velocity. A 10% price cut could recover ~40% of lost volume.";
          impact = "+25% unit volume";
          confidence = 72;
        } else if (p.cluster === "underperformer") {
          suggestedPrice = Number((p.price * 0.85).toFixed(2));
          reason = "Low conversion rates. Aggressive pricing recommended to clear inventory.";
          impact = "Clear stock in 30 days";
          confidence = 65;
        } else if (p.cluster === "cash-cow" && p.trend === "stable") {
          suggestedPrice = Number((p.price * 1.03).toFixed(2));
          reason = "Loyal customer base. Small optimization reflects rising operational costs.";
          impact = "+$1.2K/mo profit";
          confidence = 94;
        }

        return {
          id: p.id,
          productId: p.id,
          product: p.name,
          currentPrice: p.price,
          suggestedPrice,
          reason,
          confidence,
          expectedImpact: impact
        };
      })
      .filter(s => s.reason !== "")
      .slice(0, 4);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*");
    if (data) {
      setSuggestions(generateSuggestions(data));
    }
    setLoading(false);
  }, [generateSuggestions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApply = async (s: Suggestion) => {
    const { error } = await supabase
      .from("products")
      .update({ price: s.suggestedPrice })
      .eq("id", s.productId);

    if (error) {
      toast.error("Failed to update price");
    } else {
      toast.success(`Price updated for ${s.product}`);
      setSuggestions(prev => prev.filter(item => item.id !== s.id));
    }
  };

  const handleDismiss = (id: string) => {
    setSuggestions(prev => prev.filter(item => item.id !== id));
    toast.info("Suggestion dismissed");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Dynamic Pricing Engine</h2>
          <p className="text-sm text-muted-foreground mt-1">Intelligent pricing recommendations based on market and demand data</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>

      {!loading && suggestions.length === 0 ? (
        <div className="glow-card p-12 text-center">
          <p className="text-muted-foreground italic">No pricing changes recommended at this time based on current data.</p>
          <Button variant="link" onClick={fetchData} className="mt-2">Refresh Analysis</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((s, i) => (
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
                  <p className="font-display text-lg font-bold text-foreground">${s.currentPrice.toFixed(2)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary shrink-0" />
                <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-center">
                  <p className="text-xs text-primary">Suggested</p>
                  <p className="font-display text-lg font-bold text-primary">${s.suggestedPrice.toFixed(2)}</p>
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

              <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", s.confidence >= 80 ? "bg-secondary" : "bg-primary")}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.confidence}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleApply(s)} size="sm" className="flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Check className="h-3.5 w-3.5" /> Apply
                </Button>
                <Button onClick={() => handleDismiss(s.id)} size="sm" variant="outline" className="flex-1 gap-1 border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                  <X className="h-3.5 w-3.5" /> Dismiss
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
