import { getProjects } from "@/actions/project";
import { getCategories } from "@/actions/project-category";
import CreateProjectForm from "@/components/project/CreateProjectForm";
import ProjectList from "@/components/project/ProjectList";
import CategoryManagerWrapper from "@/components/project/CategoryManagerWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const session = await getServerSession(authOptions);
    const [projects, categories] = await Promise.all([
        getProjects(),
        getCategories()
    ]);

    const canEdit = session?.user.role === "ADMIN" || session?.user.isPM === true;

    return (
        <div className="container" style={{ paddingBottom: "4rem" }}>
            <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "2rem" }}>專案管理</h1>
                    <p style={{ color: "var(--color-text-muted)" }}>管理您的專案與項目</p>
                </div>
                {canEdit && (
                    <CategoryManagerWrapper categories={categories} />
                )}
            </header>

            {canEdit && <CreateProjectForm categories={categories} />}

            <section style={{ marginTop: "2rem" }}>
                <ProjectList projects={projects} categories={categories} />
            </section>
        </div>
    );
}

