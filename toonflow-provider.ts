/**
 * Toonflow 可编程供应商 — Nusantara Knowledge Graph (v1.1.0)
 * Token：master 权限
 * API：https://nusantara-api.vfvincentwong-881.workers.dev
 */

const API_BASE = "https://nusantara-api.vfvincentwong-881.workers.dev";
const TOKEN = "17bab06f4c40beea77ac8d2cf55aa2f16b28f24342b0d30b2a882e1090139ee4";

async function apiGet(path: string, params?: Record<string, string>) {
  const url = new URL(API_BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!resp.ok) throw new Error(`${path}: ${resp.status}`);
  return resp.json();
}

export async function searchEntities(query: string, opts?: { module?: string; lang?: "en" | "zh" | "id"; limit?: number }) {
  return apiGet("/api/search", {
    q: query,
    ...(opts?.module && { module: opts.module }),
    ...(opts?.lang && { lang: opts.lang }),
    ...(opts?.limit && { limit: String(opts.limit) }),
  });
}

export async function getEntity(id: string) {
  return apiGet(`/api/entities/${encodeURIComponent(id)}`);
}

export async function getRelations(source?: string, target?: string) {
  const params: Record<string, string> = {};
  if (source) params.source = source;
  if (target) params.target = target;
  return apiGet("/api/relations", params);
}

export async function getNeighbors(id: string, depth: 1 | 2 = 1) {
  return apiGet("/api/neighbors", { id, depth: String(depth) });
}

export async function listDarkline(darkline?: string) {
  if (darkline) {
    return apiGet(`/api/darklines/${encodeURIComponent(darkline)}`);
  }
  return apiGet("/api/darklines");
}

export async function getKnowledgeContext(query: string, lang: "en" | "zh" | "id" = "zh") {
  const data: any = await searchEntities(query, { lang, limit: 5 });
  const results = data.results || [];
  const context = results.map((e: any) => {
    const name = e.name?.[lang] || e.name?.en || e.id;
    const summary = e.summary?.[lang] || e.summary?.en || "";
    const tags = (e.tags || []).join(", ");
    const darklines = e.darklines?.length ? ` [暗线: ${e.darklines.join(", ")}]` : "";
    return `【${e.type}】${name}\n  摘要: ${summary}\n  标签: ${tags}${darklines}\n  链接: ${e.url}`;
  }).join("\n\n---\n\n");
  return { context, raw: data, count: results.length };
}
