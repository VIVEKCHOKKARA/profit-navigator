/**
 * Route-level access control. The sidebar only hides links; this enforces the
 * same rules when a page is reached by direct URL:
 *   1. The current role must be allowed for the route (navItems.roles).
 *   2. The Financial Analyst must not have hidden the page for owner/manager.
 * Analyst-only admin pages are unaffected by visibility overrides.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { navItems } from "@/lib/navigation";
import { useRole } from "@/contexts/RoleContext";
import { fetchVisibility } from "@/lib/api";
import { useRealtime } from "@/lib/socket";

function Denied({ reason }: { reason: string }) {
  return (
    <div className="glow-card p-12 text-center max-w-md mx-auto mt-12">
      <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
      <h2 className="font-display text-lg font-semibold text-foreground">Access restricted</h2>
      <p className="text-sm text-muted-foreground mt-2">{reason}</p>
      <Link to="/" className="inline-block mt-4 text-sm text-primary hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
}

export function RouteGuard({ children }: { children: ReactNode }) {
  const { role } = useRole();
  const location = useLocation();
  const [hiddenPages, setHiddenPages] = useState<Set<string>>(new Set());

  const loadVisibility = useCallback(async () => {
    if (role === "analyst") {
      setHiddenPages(new Set());
      return;
    }
    try {
      const rows = await fetchVisibility(role);
      setHiddenPages(new Set(rows.filter((r) => !r.visible).map((r) => r.pageUrl)));
    } catch {
      setHiddenPages(new Set());
    }
  }, [role]);

  useEffect(() => {
    loadVisibility();
  }, [loadVisibility]);

  useRealtime("visibility", loadVisibility);

  const item = navItems.find((n) => n.url === location.pathname);

  // Unknown routes (e.g. 404) are not gated here — let them render.
  if (!item) return <>{children}</>;

  if (!item.roles.includes(role)) {
    return <Denied reason={`The ${role} role doesn't have access to this page.`} />;
  }

  if (hiddenPages.has(item.url)) {
    return <Denied reason="The Financial Analyst has hidden this page for your role." />;
  }

  return <>{children}</>;
}
