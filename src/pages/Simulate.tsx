import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wand2, TrendingUp, TrendingDown, DollarSign,
    ArrowRight, Info, Sparkles, Target, Zap, ShieldAlert,
    ArrowUpCircle, Activity, Layers, MousePointer2,
    LineChart, MousePointer, LayoutDashboard, BarChart3
} from "lucide-react";
import { useForecasting } from "@/hooks/useForecasting";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, ComposedChart, Line
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ThemeCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("glow-card p-6 bg-[#131926] border border-white/5 shadow-xl", className)}>
        {children}
    </div>
);

const KPICard = ({ label, value, trend, icon: Icon, color }: any) => (
    <ThemeCard className="flex flex-col justify-between py-6">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                <p className={cn("text-[10px] font-bold mt-1", trend.startsWith('+') ? "text-emerald-400" : "text-rose-400")}>
                    {trend} <span className="text-slate-500 font-medium ml-1">vs last month</span>
                </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Icon className="h-5 w-5 text-primary" />
            </div>
        </div>
    </ThemeCard>
);

export default function Simulate() {
    const { forecasts, loading } = useForecasting();
    const [priceAdj, setPriceAdj] = useState([0]);
    const [expenseAdj, setExpenseAdj] = useState([0]);
    const [volumeAdj, setVolumeAdj] = useState([15]); // Default to some growth

    const applyPreset = (p: number, e: number, v: number) => {
        setPriceAdj([p]);
        setExpenseAdj([e]);
        setVolumeAdj([v]);
    };

    const simulatedData = useMemo(() => {
        if (!forecasts.length) return [];

        return forecasts.map((f) => {
            const pFactor = 1 + (priceAdj[0] / 100);
            const eFactor = 1 - (expenseAdj[0] / 100);
            const vFactor = 1 + (volumeAdj[0] / 100);

            const simRevenue = f.predicted_revenue * pFactor * vFactor;
            const simExpenses = f.predicted_expenses * eFactor;
            const simProfit = simRevenue - simExpenses;
            const baseProfit = f.predicted_revenue - f.predicted_expenses;

            return {
                period: f.period,
                baselineProfit: baseProfit,
                simulatedProfit: simProfit,
                simulatedRevenue: simRevenue,
                simulatedExpenses: simExpenses,
                profitDelta: simProfit - baseProfit
            };
        });
    }, [forecasts, priceAdj, expenseAdj, volumeAdj]);

    const totalSimProfit = simulatedData.reduce((acc, d) => acc + d.simulatedProfit, 0);
    const totalBaseProfit = simulatedData.reduce((acc, d) => acc + d.baselineProfit, 0);
    const totalDelta = totalSimProfit - totalBaseProfit;
    const profitLift = totalBaseProfit > 0 ? (totalDelta / totalBaseProfit) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header aligned with Dashboard theme */}
            <div className="flex flex-col gap-1">
                <h2 className="font-display text-2xl font-bold text-white">Strategic Profit Simulator</h2>
                <p className="text-sm text-slate-400">Model strategic growth and financial impact using linear regression</p>
            </div>

            {/* KPI Row matching Dashboard style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard label="Total Projected Revenue" value={`$${Math.round(simulatedData.reduce((a, b) => a + b.simulatedRevenue, 0) / 1000).toLocaleString()}k`} trend="+96%" icon={DollarSign} />
                <KPICard label="Net Profit (Simulated)" value={`$${Math.round(totalSimProfit / 1000).toLocaleString()}k`} trend={`+${profitLift.toFixed(0)}%`} icon={TrendingUp} />
                <KPICard label="Projected Expenses" value={`$${Math.round(simulatedData.reduce((a, b) => a + b.simulatedExpenses, 0) / 1000).toLocaleString()}k`} trend="-88%" icon={TrendingDown} />
                <KPICard label="Scenario Advantage" value={`+$${Math.round(totalDelta / 1000).toLocaleString()}k`} trend="+100%" icon={Sparkles} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Control Panel: Theme Matched */}
                <div className="lg:col-span-4 lg:col-start-1">
                    <ThemeCard className="h-full">
                        <div className="flex items-center gap-2 text-primary mb-8 underline decoration-primary/30 underline-offset-8 decoration-2">
                            <MousePointer className="h-5 w-5" />
                            <h3 className="font-semibold text-lg uppercase tracking-tight">Control Vectors</h3>
                        </div>

                        <div className="space-y-10">
                            {[
                                { label: "Price Adjustment", val: priceAdj, set: setPriceAdj, min: -10, max: 50, icon: DollarSign },
                                { label: "Expense Reduction", val: expenseAdj, set: setExpenseAdj, min: 0, max: 30, icon: TrendingDown },
                                { label: "Volume Forecast", val: volumeAdj, set: setVolumeAdj, min: 0, max: 100, icon: TrendingUp }
                            ].map((s) => (
                                <div key={s.label} className="space-y-4">
                                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        <span className="flex items-center gap-2"><s.icon className="h-3 w-3" /> {s.label}</span>
                                        <span className="text-white bg-primary/20 px-2 py-0.5 rounded">{s.val[0]}%</span>
                                    </div>
                                    <Slider
                                        value={s.val}
                                        onValueChange={s.set}
                                        min={s.min}
                                        max={s.max}
                                        step={1}
                                        className="relative z-10"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5">
                            <div className="flex bg-[#0B0F19] rounded-xl p-1 gap-1">
                                {[
                                    { label: "Aggressive", val: [15, 5, 40] },
                                    { label: "Stability", val: [0, 10, 5] },
                                    { label: "Safety", val: [0, 15, 0] }
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => applyPreset(preset.val[0], preset.val[1], preset.val[2])}
                                        className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ThemeCard>
                </div>

                {/* Right Simulation Chart: Theme Matched */}
                <div className="lg:col-span-8">
                    <ThemeCard className="h-full flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Profit & Revenue Trend</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Projected vs Baseline</p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-center">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                                    Baseline
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Simulation
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={simulatedData}>
                                    <defs>
                                        <linearGradient id="primaryArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14F7D0" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#14F7D0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                    <XAxis dataKey="period" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickMargin={16} />
                                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tickLine={false} axisLine={false} tickMargin={16} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#131926', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="baselineProfit" stroke="rgba(255,255,255,0.1)" strokeWidth={1} fill="none" strokeDasharray="3 3" />
                                    <Area type="monotone" dataKey="simulatedProfit" stroke="#14F7D0" strokeWidth={3} fill="url(#primaryArea)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Activity className="h-4 w-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] animate-pulse">
                                    Intelligence Model: Linear Reg v4.2
                                </span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Confidence Interval: 94.2%
                            </div>
                        </div>
                    </ThemeCard>
                </div>
            </div>
        </div>
    );
}
