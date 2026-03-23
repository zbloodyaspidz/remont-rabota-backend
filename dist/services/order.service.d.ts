import { OrderStatus } from '@prisma/client';
export declare function createOrder(clientId: string, data: {
    categoryId: string;
    address: string;
    addressLat?: number;
    addressLng?: number;
    description: string;
    desiredDate: string;
    desiredTime?: string;
    workPrice?: number;
    photos?: Express.Multer.File[];
}): Promise<{
    client: {
        id: string;
        fullName: string | null;
        avatar: string | null;
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
}>;
export declare function startSearching(orderId: string): Promise<void>;
export declare function getOrders(userId: string, role: 'CLIENT' | 'MASTER' | 'ADMIN', filters: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
}): Promise<{
    orders: ({
        client: {
            id: string;
            fullName: string | null;
            avatar: string | null;
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
        review: {
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
        } | null;
        master: {
            id: string;
            fullName: string | null;
            avatar: string | null;
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
export declare function getOrderById(orderId: string, userId: string, role: string): Promise<{
    client: {
        id: string;
        phone: string;
        fullName: string | null;
        avatar: string | null;
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
    review: {
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
    } | null;
    messages: ({
        sender: {
            id: string;
            fullName: string | null;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        read: boolean;
        orderId: string;
        text: string | null;
        imageUrl: string | null;
        senderId: string;
    })[];
    master: {
        masterProfile: {
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
        } | null;
        id: string;
        phone: string;
        fullName: string | null;
        avatar: string | null;
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
}>;
export declare function acceptOrder(orderId: string, masterId: string, workPrice?: number): Promise<{
    client: {
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
        email: string | null;
        passwordHash: string | null;
        role: import(".prisma/client").$Enums.Role;
        fullName: string | null;
        avatar: string | null;
        isBlocked: boolean;
        fcmToken: string | null;
        createdAt: Date;
        updatedAt: Date;
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
}>;
export declare function rejectOrder(orderId: string, masterId: string): Promise<{
    message: string;
}>;
export declare function completeOrder(orderId: string, masterId: string): Promise<{
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
}>;
export declare function cancelOrder(orderId: string, userId: string, role: string, reason?: string): Promise<{
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
}>;
export declare function getAvailableOrdersForMaster(masterId: string, filters: {
    page?: number;
    limit?: number;
}): Promise<{
    orders: ({
        client: {
            id: string;
            fullName: string | null;
            avatar: string | null;
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
export declare function updateOrderStatus(orderId: string, newStatus: OrderStatus, userId: string, role: string): Promise<{
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
}>;
//# sourceMappingURL=order.service.d.ts.map