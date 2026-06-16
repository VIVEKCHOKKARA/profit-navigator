/**
 * Global role state — replaces the per-component useState in AppSidebar so
 * every page (Pricing approvals, Tutorials, page-visibility) reads the same
 * active role. Persisted to localStorage so a refresh keeps the role.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserRole } from "@/lib/navigation";

const STORAGE_KEY = "active_role";

type RoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    return stored ?? "owner";
  });

  const setRole = (next: UserRole) => {
    setRoleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
