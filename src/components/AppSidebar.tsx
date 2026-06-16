import { useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { ChevronDown, Zap } from "lucide-react";
import { navItems, roleLabels, type UserRole } from "@/lib/navigation";
import { useRole } from "@/contexts/RoleContext";
import { fetchVisibility } from "@/lib/api";
import { useRealtime } from "@/lib/socket";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role, setRole } = useRole();

  // Pages the Analyst has explicitly hidden for the current role.
  const [hiddenPages, setHiddenPages] = useState<Set<string>>(new Set());

  const loadVisibility = useCallback(async () => {
    // Visibility overrides only apply to owner/manager (the analyst sees all).
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

  // Refetch when the Analyst toggles visibility from another session/tab.
  useRealtime("visibility", loadVisibility);

  const filteredItems = navItems.filter(
    (item) => item.roles.includes(role) && !hiddenPages.has(item.url)
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5">
          <Zap className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-display text-lg font-bold text-foreground tracking-tight">
              Lumina
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/50"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg bg-accent/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span>{roleLabels[role]}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                  {roleLabels[r]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
