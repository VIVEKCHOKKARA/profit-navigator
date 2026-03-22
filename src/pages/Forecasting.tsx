import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg bg-card border border-border p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Forecasting() {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);

  const runForecast = async () => {
    setLoading(true);
    try {
      const resp = await supabase.functions.invoke("forecast");
      if (resp.error) throw resp.error;
      const data = resp.data;
      
      const historical = (data.historical?.months || []).map((m: string, i: number) => ({
        month: m,
        actual: data.historical.revenues[i],
        forecast: null,
      }));
      const predicted = (data.forecasts || []).map((f: any) => ({
        month: f.period,
        actual: null,
        forecast: f.predicted_revenue,
      }));
      setChartData([...historical, ...predicted]);
      setForecasts(data.forecasts || []);
      toast.success("Forecast generated from your transaction data!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate forecast");
    }
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("forecasts").select("*").order("period");
      if (data && data.length > 0) setForecasts(data);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Sales Forecasting</h2>
          <p className="text-sm text-muted-foreground mt-1">AI-powered predictions based on your transaction data</p>
        </div>
        <Button onClick={runForecast} disabled={loading} className="gap-2 self-start">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Generating..." : "Generate Forecast"}
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 p-4">
        <TrendingUp className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-foreground">
          Add transactions first, then click "Generate Forecast" to get predictions based on your real data using linear regression.
        </p>
      </div>

      {chartData.length > 0 && (
        <motion.div className="glow-card p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Revenue: Actual vs Forecast</h3>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(172, 66%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 69%, 58%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 69%, 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 25%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 45%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 45%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" stroke="hsl(172, 66%, 50%)" fill="url(#actualGrad)" strokeWidth={2} name="Actual" connectNulls={false} />
              <Area type="monotone" dataKey="forecast" stroke="hsl(142, 69%, 58%)" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 5" name="Forecast" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {forecasts.length > 0 && (
        <motion.div className="glow-card overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground font-medium">Period</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Predicted Revenue</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Predicted Expenses</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Predicted Profit</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((f: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="p-4 text-foreground font-medium">{f.period}</td>
                    <td className="p-4 text-right text-secondary">${f.predicted_revenue.toLocaleString()}</td>
                    <td className="p-4 text-right text-destructive">${f.predicted_expenses.toLocaleString()}</td>
                    <td className="p-4 text-right text-primary">${(f.predicted_revenue - f.predicted_expenses).toLocaleString()}</td>
                    <td className="p-4 text-right text-muted-foreground">{Math.round((f.confidence || 0.85) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}