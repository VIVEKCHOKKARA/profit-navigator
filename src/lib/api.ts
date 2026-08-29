/**
 * REST API client — replaces Supabase SDK.
 * All data operations go through the Python Flask backend.
 */

// When VITE_API_URL is set, use it directly (e.g. production).
// When unset, use "" so requests like "/api/auth/login" go through the
// Vite dev proxy configured in vite.config.ts.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

// ── Auth token ────────────────────────────────────────────────────────────--
// The login flow stores a signed token here; apiFetch attaches it so the
// backend can resolve the current user.

const TOKEN_KEY = "auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// ── Helper ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const url = API_BASE ? `${API_BASE}${path}` : path;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
      // If fetching relative URL or API_BASE fails, try direct localhost:5000 fallback
      if (API_BASE === "") {
        const directUrl = `http://localhost:5000${path}`;
        const res = await fetch(directUrl, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options?.headers || {}),
          },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(errData.error || `Request failed with status ${res.status}`);
        }
        return res.json();
      }
    }
    throw err;
  }
}

// ── Transactions ────────────────────────────────────────────────────────────

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: string;
  created_at?: string;
};

export async function fetchTransactions(): Promise<Transaction[]> {
  return apiFetch<Transaction[]>("/api/transactions");
}

export async function createTransaction(data: {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: string;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
}

// ── Products ────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  units_sold: number;
  revenue: number;
  trend: string;
  cluster: string;
  created_at?: string;
};

export async function fetchProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/api/products");
}

export async function createProduct(data: {
  name: string;
  category: string;
  price: number;
  units_sold?: number;
  revenue?: number;
  trend?: string;
  cluster?: string;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<void> {
  await apiFetch(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── Chat ────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function fetchChatHistory(
  sessionId = "default"
): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(
    `/api/chat/history?session_id=${encodeURIComponent(sessionId)}`
  );
}

export async function saveChatMessage(
  role: string,
  content: string,
  sessionId = "default"
): Promise<void> {
  await apiFetch("/api/chat/save", {
    method: "POST",
    body: JSON.stringify({ role, content, session_id: sessionId }),
  });
}

/**
 * Returns the full URL for streaming chat (used with fetch + ReadableStream).
 */
export function getChatStreamUrl(): string {
  return `${API_BASE}/api/chat`;
}

// ── Pricing (AI suggestions + Analyst approval workflow) ────────────────────

export type PricingRecommendation = {
  id: string;
  productId: string;
  product: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  confidence: number;
  expectedImpact: string;
  modelUsed?: string;
  status: "pending" | "approved" | "rejected" | "applied";
  createdAt?: string;
  reviewedAt?: string | null;
};

export async function generatePricing(): Promise<{
  suggestions: PricingRecommendation[];
  model_used: string;
}> {
  return apiFetch("/api/pricing/generate", { method: "POST" });
}

export async function fetchPricing(
  status?: string
): Promise<PricingRecommendation[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<PricingRecommendation[]>(`/api/pricing${q}`);
}

export async function approvePricing(id: string): Promise<void> {
  await apiFetch(`/api/pricing/${id}/approve`, { method: "POST" });
}

export async function rejectPricing(id: string): Promise<void> {
  await apiFetch(`/api/pricing/${id}/reject`, { method: "POST" });
}

// ── Tutorials ───────────────────────────────────────────────────────────────

export type Tutorial = {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  targetRole: "owner" | "manager" | "both";
  /** Optional per-language YouTube IDs; youtubeId is the default/fallback. */
  videoIds?: Record<string, string>;
  addedAt?: string;
};

export async function fetchTutorials(
  role?: "owner" | "manager"
): Promise<Tutorial[]> {
  const q = role ? `?role=${role}` : "";
  return apiFetch<Tutorial[]>(`/api/tutorials${q}`);
}

export async function createTutorial(data: {
  title: string;
  description?: string;
  youtubeId: string;
  targetRole: "owner" | "manager" | "both";
  videoIds?: Record<string, string>;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/tutorials", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTutorial(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    youtubeId: string;
    targetRole: "owner" | "manager" | "both";
    videoIds: Record<string, string>;
  }>
): Promise<void> {
  await apiFetch(`/api/tutorials/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTutorial(id: string): Promise<void> {
  await apiFetch(`/api/tutorials/${id}`, { method: "DELETE" });
}

// ── Page Visibility (Analyst controls per-role page access) ──────────────────

export type PageVisibility = {
  pageUrl: string;
  role: "owner" | "manager";
  visible: boolean;
};

export async function fetchVisibility(
  role?: "owner" | "manager"
): Promise<PageVisibility[]> {
  const q = role ? `?role=${role}` : "";
  return apiFetch<PageVisibility[]>(`/api/visibility${q}`);
}

export async function setVisibility(
  pageUrl: string,
  role: "owner" | "manager",
  visible: boolean
): Promise<void> {
  await apiFetch("/api/visibility", {
    method: "PUT",
    body: JSON.stringify({ pageUrl, role, visible }),
  });
}

// ── Auth (login / register / current user) ───────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "analyst";
  avatarUrl?: string | null;
};

export type AuthResponse = { token: string; user: AuthUser };

const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  "owner@profitnavigator.com": {
    id: "c5940761-69af-11f1-ba8b-0a002700000b",
    name: "Business Owner",
    email: "owner@profitnavigator.com",
    role: "owner",
  },
  "manager@profitnavigator.com": {
    id: "c5b9b000-69af-11f1-ba8b-0a002700000b",
    name: "Shop Manager",
    email: "manager@profitnavigator.com",
    role: "manager",
  },
  "analyst@profitnavigator.com": {
    id: "c5e0e94b-69af-11f1-ba8b-0a002700000b",
    name: "Financial Analyst",
    email: "analyst@profitnavigator.com",
    role: "analyst",
  },
};

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    return await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (err: any) {
    // If server network error ("Failed to fetch"), check demo credentials as fallback
    if (err instanceof TypeError || (err.message && err.message.includes("Failed to fetch"))) {
      const cleanEmail = email.trim().toLowerCase();
      const demoUser = DEMO_ACCOUNTS[cleanEmail];
      if (demoUser) {
        const token = "demo-token-" + btoa(JSON.stringify(demoUser));
        return { token, user: demoUser };
      }
    }
    throw err;
  }
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: "owner" | "manager" | "analyst";
}): Promise<AuthResponse> {
  try {
    return await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    if (err instanceof TypeError || (err.message && err.message.includes("Failed to fetch"))) {
      const user: AuthUser = {
        id: "demo-" + Date.now(),
        name: data.name,
        email: data.email,
        role: data.role,
      };
      const token = "demo-token-" + btoa(JSON.stringify(user));
      return { token, user };
    }
    throw err;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const token = getAuthToken();
  if (token && token.startsWith("demo-token-")) {
    try {
      const json = atob(token.replace("demo-token-", ""));
      return JSON.parse(json) as AuthUser;
    } catch {
      // Fallback to API if parsing fails
    }
  }
  const res = await apiFetch<{ user: AuthUser }>("/api/auth/me");
  return res.user;
}

export async function updateProfile(data: {
  name?: string;
  avatarUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
}): Promise<AuthUser> {
  const res = await apiFetch<{ user: AuthUser }>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.user;
}

// ── Re-export base for direct fetch usage ───────────────────────────────────
export { API_BASE };
