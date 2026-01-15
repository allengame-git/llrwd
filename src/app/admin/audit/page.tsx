import { getLoginLogs, getLoginStats } from "@/actions/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    const { logs, total } = await getLoginLogs({ limit: 100 });
    const stats = await getLoginStats(7);

    return (
        <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ marginBottom: "2rem" }}>
                <Link href="/admin" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                    ← 返回管理後台
                </Link>
            </div>

            <h1 style={{ marginBottom: "1.5rem" }}>🔐 登入審計日誌</h1>

            {/* Stats Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem"
            }}>
                <StatCard label="過去 7 天登入次數" value={stats.totalLogins} />
                <StatCard label="成功登入" value={stats.successfulLogins} color="var(--color-success)" />
                <StatCard label="失敗嘗試" value={stats.failedLogins} color="var(--color-error)" />
                <StatCard label="不重複使用者" value={stats.uniqueUsers} color="var(--color-primary)" />
                <StatCard label="成功率" value={`${stats.successRate}%`} />
            </div>

            {/* Logs Table */}
            <div style={{
                backgroundColor: "var(--color-bg-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                overflow: "hidden"
            }}>
                <div style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <h2 style={{ margin: 0, fontSize: "1.1rem" }}>最近登入紀錄</h2>
                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                        共 {total} 筆記錄
                    </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ backgroundColor: "var(--color-bg-alt)" }}>
                                <th style={thStyle}>時間</th>
                                <th style={thStyle}>使用者</th>
                                <th style={thStyle}>狀態</th>
                                <th style={thStyle}>IP 位址</th>
                                <th style={thStyle}>瀏覽器</th>
                                <th style={thStyle}>備註</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={{
                                    borderBottom: "1px solid var(--color-border)",
                                    backgroundColor: log.success ? undefined : "rgba(239, 68, 68, 0.05)"
                                }}>
                                    <td style={tdStyle}>
                                        {new Date(log.createdAt).toLocaleString("zh-TW")}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ fontWeight: 500 }}>{log.username}</span>
                                        {log.user && (
                                            <span style={{
                                                marginLeft: "0.5rem",
                                                fontSize: "0.75rem",
                                                color: "var(--color-text-muted)",
                                                backgroundColor: "var(--color-bg-alt)",
                                                padding: "0.125rem 0.375rem",
                                                borderRadius: "var(--radius-sm)"
                                            }}>
                                                {log.user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.25rem",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "var(--radius-sm)",
                                            fontSize: "0.85rem",
                                            backgroundColor: log.success
                                                ? "rgba(34, 197, 94, 0.1)"
                                                : "rgba(239, 68, 68, 0.1)",
                                            color: log.success
                                                ? "var(--color-success)"
                                                : "var(--color-error)"
                                        }}>
                                            {log.success ? "✓ 成功" : "✗ 失敗"}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "0.85rem" }}>
                                        {log.ipAddress || "-"}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: "0.8rem", color: "var(--color-text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {log.userAgent ? formatUserAgent(log.userAgent) : "-"}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                                        {log.failReason || "-"}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                                        目前沒有登入紀錄
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
        <div style={{
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1rem 1.25rem",
            textAlign: "center"
        }}>
            <div style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: color || "var(--color-text)",
                marginBottom: "0.25rem"
            }}>
                {value}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                {label}
            </div>
        </div>
    );
}

function formatUserAgent(ua: string): string {
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return ua.substring(0, 30) + "...";
}

const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "0.75rem 1rem",
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "var(--color-text-muted)",
    whiteSpace: "nowrap"
};

const tdStyle: React.CSSProperties = {
    padding: "0.75rem 1rem",
    verticalAlign: "middle"
};
