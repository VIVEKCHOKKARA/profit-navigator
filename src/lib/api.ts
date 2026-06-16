/**
 * REST API client — replaces Supabase SDK.
 * All data operations go through the Python Flask backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Helper ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API request failed");
  }
  return res.json();
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

// ── Re-export base for direct fetch usage ───────────────────────────────────
export { API_BASE };
