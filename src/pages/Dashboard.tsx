import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { monthlyRevenue, dailySales, categoryBreakdown, aiInsights } from "@/lib/mock-data";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Lightbulb, TrendingUp as TrendUp, Package, Zap, Shield, Users } from "lucide-react";

const CHART_COLORS = {
  teal: "hsl(172, 66%, 50%)",
  green: "hsl(142, 69%, 58%)",
  rose: "hsl(351, 89%, 70%)",
  slate: "hsl(217, 33%, 35%)",
};

const PIE_COLORS = [CHART_COLORS.teal, CHART_COLORS.green, CHART_COLORS.rose, CHART_COLORS.slate];

const insightIcons: Record<string, any> = {
  "trending-up": TrendUp,
  package: Package,
  zap: Zap,
  shield: Shield,
  users: Users,
};

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

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time business intelligence at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue" value="$52,000" change="+18.2% vs last month" changeType="positive" icon={DollarSign} />
        <MetricCard label="Net Profit" value="$21,000" change="+23.5% vs last month" changeType="positive" icon={TrendingUp} variant="success" />
        <MetricCard label="Expenses" value="$31,000" change="+6.9% vs last month" changeType="negative" icon={TrendingDown} variant="alert" />
        <MetricCard label="Orders" value="1,847" change="+12% vs last month" changeType="positive" icon={ShoppingCart} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <motion.div
          className="glow-card p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Revenue & Profit Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 25%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 45%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 45%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.teal} fill="url(#tealGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" name="Profit" stroke={CHART_COLORS.green} fill="url(#greenGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          className="glow-card p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0}>
                {categoryBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryBreakdown.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium text-foreground">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Daily Sales + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="glow-card p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display text-base font-semibold text-foreground mb-4">This Week's Sales</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 25%)" />
              <XAxis dataKey="day" stroke="hsl(215, 20%, 45%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 45%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" name="Sales" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          className="glow-card p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="font-display text-base font-semibold text-foreground">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {aiInsights.slice(0, 3).map((insight, i) => {
              const IconComp = insightIcons[insight.icon] || Lightbulb;
              return (
                <div key={i} className="flex gap-3 rounded-lg bg-accent/50 p-3">
                  <IconComp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <p className="insight-text mt-0.5">{insight.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
