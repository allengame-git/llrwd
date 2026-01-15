"use client";

import { useRouter } from "next/navigation";
import CategoryManager from "./CategoryManager";

interface Category {
    id: number;
    name: string;
    description: string | null;
    sortOrder: number;
    _count: { projects: number };
}

interface CategoryManagerWrapperProps {
    categories: Category[];
}

export default function CategoryManagerWrapper({ categories }: CategoryManagerWrapperProps) {
    const router = useRouter();

    return (
        <CategoryManager
            categories={categories}
            onUpdate={() => router.refresh()}
        />
    );
}
