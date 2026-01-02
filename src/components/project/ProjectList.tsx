"use client";

import { submitDeleteProjectRequest } from "@/actions/approval";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import EditProjectButton from "./EditProjectButton";

type Project = {
    id: number;
    title: string;
    description: string | null;
    codePrefix: string;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        items: number;
    }
};

export default function ProjectList({ projects }: { projects: Project[] }) {
    const { data: session } = useSession();
    const [isPending, startTransition] = useTransition();
    const [deleteStatus, setDeleteStatus] = useState<{ projectId: number; message?: string; error?: string } | null>(null);

    const canEdit = session?.user.role === "ADMIN" || session?.user.role === "EDITOR" || session?.user.role === "INSPECTOR";

    const handleDelete = (project: Project) => {
        // Confirmation dialog with project name
        const confirmed = confirm(
            `Are you sure you want to request deletion of project "${project.title}"?\n\n` +
            `This will submit a deletion request that requires approval.\n` +
            `Note: Projects with existing items cannot be deleted.`
        );

        if (confirmed) {
            startTransition(async () => {
                const result = await submitDeleteProjectRequest(project.id);
                if (result.error) {
                    setDeleteStatus({ projectId: project.id, error: result.error });
                    // Clear error after 5 seconds
                    setTimeout(() => setDeleteStatus(null), 5000);
                } else {
                    setDeleteStatus({ projectId: project.id, message: result.message });
                    // Reload after showing success
                    setTimeout(() => {
                        setDeleteStatus(null);
                        window.location.reload();
                    }, 2000);
                }
            });
        }
    };

    if (projects.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                <p>No projects found. Create one to get started.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {projects.map((project) => (
                <div key={project.id} className="glass" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h3 style={{ fontSize: "1.25rem" }}>
                                <Link href={`/projects/${project.id}`} style={{ textDecoration: "none", color: "var(--color-primary)" }} className="hover:underline">
                                    {project.title}
                                </Link>
                            </h3>
                            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", backgroundColor: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                                {project.codePrefix}
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {canEdit && (
                                <EditProjectButton project={project} />
                            )}
                            {session?.user.role === "ADMIN" && (
                                <button
                                    onClick={() => handleDelete(project)}
                                    disabled={isPending}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--color-danger)",
                                        cursor: isPending ? "not-allowed" : "pointer",
                                        fontSize: "0.9rem",
                                        padding: "0.25rem 0.5rem",
                                        opacity: isPending ? 0.5 : 1
                                    }}
                                    title="Request Delete Project"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Messages */}
                    {deleteStatus?.projectId === project.id && deleteStatus.error && (
                        <div style={{
                            padding: "0.5rem 0.75rem",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid var(--color-danger)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-danger)",
                            fontSize: "0.85rem"
                        }}>
                            {deleteStatus.error}
                        </div>
                    )}
                    {deleteStatus?.projectId === project.id && deleteStatus.message && (
                        <div style={{
                            padding: "0.5rem 0.75rem",
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            border: "1px solid var(--color-success)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-success)",
                            fontSize: "0.85rem"
                        }}>
                            {deleteStatus.message}
                        </div>
                    )}

                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", flex: 1 }}>
                        {project.description || "No description"}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        <span>{project._count.items} Items</span>
                        <span>{new Date(project.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
