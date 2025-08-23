import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchPickups() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;
  const res = await fetch(`${baseUrl}/api/pickups/list`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
    },
  });
  const json = await res.json();
  return json as { pickups: any[]; schemaUsed?: string; error?: string };
}

export default async function AdminPickupsPage() {
  const { pickups = [], schemaUsed, error } = await fetchPickups();

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Pickup Locations</h1>
        <a href="/admin/pickups-debug" style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #ccc", textDecoration: "none" }}>Open Debug View</a>
      </div>

      <div style={{ marginTop: 8, background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: 10 }}>
        <b>Debug:</b> schemaUsed = <code>{schemaUsed ?? "(unknown)"}</code>, count = <b>{pickups.length}</b>
        {error && (<span style={{ color: "crimson" }}>&nbsp; error: {error}</span>)}
      </div>

      <div style={{ marginTop: "1rem", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Address</th>
              <th style={th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {pickups.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: "1rem", textAlign: "center", color: "#666" }}>No pickup locations.</td></tr>
            ) : (
              pickups.map((p: any) => (
                <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{p.address}</td>
                  <td style={td}>{p.notes ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "0.8rem", fontWeight: 600, fontSize: 14, color: "#333" };
const td: React.CSSProperties = { padding: "0.8rem", fontSize: 14 };
