export declare function listUsers(filters: {
    role?: string;
    isBlocked?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{
    users: {
        masterProfile: {
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            rating: number;
            totalOrders: number;
        } | null;
        id: string;
        phone: string;
        email: string | null;
        role: import(".prisma/client").$Enums.Role;
        fullName: string | null;
        avatar: string | null;
        isBlocked: boolean;
        createdAt: Date;
    }[];
    total: number;
    page: number;
    pages: number;
}>;
export declare function blockUser(userId: string, adminId: string): Promise<{
    id: string;
    phone: string;
    email: string | null;
    passwordHash: string | null;
    role: import(".prisma/client").$Enums.Role;
    fullName: string | null;
    avatar: string | null;
    isBlocked: boolean;
    fcmToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function verifyMaster(userId: string, status: 'VERIFIED' | 'REJECTED', adminId: string): Promise<{
    specializationIds: string[];
    experience: string | null;
    portfolio: import("@prisma/client/runtime/library").JsonValue | null;
    workRadius: number | null;
    workSchedule: import("@prisma/client/runtime/library").JsonValue | null;
    verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
    documents: import("@prisma/client/runtime/library").JsonValue | null;
    rating: number;
    totalReviews: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    acceptanceRate: number | null;
    isAvailable: boolean;
    workLat: number | null;
    workLng: number | null;
    userId: string;
}>;
export declare function getAllOrders(filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}): Promise<{
    orders: ({
        client: {
            id: string;
            phone: string;
            fullName: string | null;
        };
        category: {
            description: string | null;
            id: string;
            name: string;
            icon: string | null;
            parentId: string | null;
            sortOrder: number;
            isActive: boolean;
        };
        master: {
            id: string;
            phone: string;
            fullName: string | null;
        } | null;
    } & {
        description: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        masterId: string | null;
        categoryId: string;
        address: string;
        addressLat: number | null;
        addressLng: number | null;
        desiredDate: Date;
        desiredTime: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        photos: import("@prisma/client/runtime/library").JsonValue | null;
        workPrice: number | null;
        commission: number | null;
        clientPrice: number | null;
        masterPayout: number | null;
        searchAttempts: number;
        notifiedMasterIds: string[];
        completedAt: Date | null;
        cancelledAt: Date | null;
        cancellationReason: string | null;
    })[];
    total: number;
    page: number;
    pages: number;
}>;
export declare function getStats(): Promise<{
    totalUsers: number;
    totalMasters: number;
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    activeOrders: number;
    ordersByDay: {
        date: string;
        count: number;
    }[];
}>;
export declare function getPendingReviews(): Promise<({
    order: {
        id: string;
        categoryId: string;
    };
    author: {
        id: string;
        fullName: string | null;
    };
    target: {
        id: string;
        fullName: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    orderId: string;
    rating: number;
    isHidden: boolean;
    authorId: string;
    targetId: string;
    comment: string | null;
    isModerated: boolean;
    moderatedBy: string | null;
})[]>;
export declare function moderateReview(reviewId: string, action: 'approve' | 'hide', adminId: string): Promise<{
    id: string;
    createdAt: Date;
    orderId: string;
    rating: number;
    isHidden: boolean;
    authorId: string;
    targetId: string;
    comment: string | null;
    isModerated: boolean;
    moderatedBy: string | null;
}>;
export declare function getSettings(): Promise<{
    id: string;
    updatedAt: Date;
    orderCommission: number;
    defaultRadius: number;
    searchTimeout: number;
    retryInterval: number;
    updatedBy: string | null;
}>;
export declare function updateSettings(data: {
    orderCommission?: number;
    defaultRadius?: number;
    searchTimeout?: number;
    retryInterval?: number;
}, adminId: string): Promise<{
    id: string;
    updatedAt: Date;
    orderCommission: number;
    defaultRadius: number;
    searchTimeout: number;
    retryInterval: number;
    updatedBy: string | null;
}>;
//# sourceMappingURL=admin.service.d.ts.map