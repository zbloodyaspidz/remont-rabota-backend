export declare function getCategories(): Promise<any>;
export declare function createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    parentId?: string;
    sortOrder?: number;
}): Promise<{
    description: string | null;
    id: string;
    name: string;
    icon: string | null;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
}>;
export declare function updateCategory(id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    parentId?: string;
    sortOrder?: number;
    isActive?: boolean;
}): Promise<{
    description: string | null;
    id: string;
    name: string;
    icon: string | null;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
}>;
export declare function deleteCategory(id: string): Promise<{
    message: string;
}>;
//# sourceMappingURL=category.service.d.ts.map