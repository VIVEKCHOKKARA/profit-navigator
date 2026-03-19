import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Lightbulb,
  BarChart3,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "owner" | "manager" | "analyst";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: UserRole[];
};

export const navItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["owner", "manager", "analyst"] },
  { title: "Transactions", url: "/transactions", icon: Receipt, roles: ["owner", "manager"] },
  { title: "Forecasting", url: "/forecasting", icon: TrendingUp, roles: ["owner", "analyst"] },
  { title: "Products", url: "/products", icon: ShoppingBag, roles: ["owner", "manager", "analyst"] },
  { title: "Anomalies", url: "/anomalies", icon: AlertTriangle, roles: ["owner", "analyst"] },
  { title: "Pricing", url: "/pricing", icon: DollarSign, roles: ["owner", "manager"] },
  { title: "AI Insights", url: "/insights", icon: Lightbulb, roles: ["owner", "manager", "analyst"] },
];

export const roleLabels: Record<UserRole, string> = {
  owner: "Business Owner",
  manager: "Shop Manager",
  analyst: "Financial Analyst",
};
