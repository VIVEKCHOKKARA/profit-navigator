import { motion } from "framer-motion";
import { forecastData, monthlyRevenue } from "@/lib/mock-data";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from "recharts";
import { TrendingUp, Target, Calendar } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";

const TEAL = "hsl(172, 66%, 50%)";
const GREEN = "hsl(142, 69%, 58%)";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg bg-card border border-border p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Forecasting() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Sales Forecasting</h2>
        <p className="text-sm text-muted-foreground mt-1">AI-powered predictions based on historical trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Next Month Forecast" value="$56,000" change="+7.7% projected" changeType="positive" icon={TrendingUp} />
        <MetricCard label="Quarterly Target" value="$175,000" change="On track" changeType="positive" icon={Target} variant="success" />
        <MetricCard label="Annual Projection" value="$620,000" change="+21.6% YoY" changeType="positive" icon={Calendar} />
      </div>

      {/* Forecast Chart */}
      <motion.div className="glow-card p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Revenue Forecast (6 Months)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="fTeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
                <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.2} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 25%)" />
            <XAxis dataKey="month" stroke="hsl(215, 20%, 45%)" fontSize={12} />
            <YAxis stroke="hsl(215, 20%, 45%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x="Mar" stroke="hsl(215, 20%, 45%)" strokeDasharray="3 3" label={{ value: "Today", fill: "hsl(215, 20%, 65%)", fontSize: 11 }} />
            <Area type="monotone" dataKey="actual" name="Actual" stroke={TEAL} fill="url(#fTeal)" strokeWidth={2} connectNulls={false} />
            <Area type="monotone" dataKey="forecast" name="Forecast" stroke={GREEN} fill="url(#fGreen)" strokeWidth={2} strokeDasharray="6 3" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Historical context */}
      <motion.div className="glow-card p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Historical Revenue</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 25%)" />
            <XAxis dataKey="month" stroke="hsl(215, 20%, 45%)" fontSize={12} />
            <YAxis stroke="hsl(215, 20%, 45%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke={TEAL} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(351, 89%, 70%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* AI Context */}
      <motion.div className="glow-card p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="font-display text-base font-semibold text-foreground mb-3">What this means for your business</h3>
        <div className="space-y-2">
          <p className="insight-text">📈 <strong className="text-foreground">Growth trajectory is strong.</strong> Revenue has grown consistently over the past 3 months, suggesting sustained market demand.</p>
          <p className="insight-text">🎯 <strong className="text-foreground">Q2 looks promising.</strong> Based on seasonality and current trends, April–June revenue is projected to average $58K/month.</p>
          <p className="insight-text">⚠️ <strong className="text-foreground">Watch expenses.</strong> Your expense ratio has been creeping up. If it continues, profit margins will tighten despite revenue growth.</p>
        </div>
      </motion.div>
    </div>
  );
}
