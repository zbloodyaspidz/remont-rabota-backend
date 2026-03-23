export declare function getMe(userId: string): Promise<{
    clientProfile: {
        savedAddresses: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
    } | null;
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
    email: string | null;
    role: import(".prisma/client").$Enums.Role;
    fullName: string | null;
    avatar: string | null;
    isBlocked: boolean;
    fcmToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateMe(userId: string, data: {
    fullName?: string;
    email?: string;
    savedAddresses?: unknown;
}): Promise<{
    clientProfile: {
        savedAddresses: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
    } | null;
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
    email: string | null;
    role: import(".prisma/client").$Enums.Role;
    fullName: string | null;
    avatar: string | null;
    isBlocked: boolean;
    fcmToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function uploadAvatar(userId: string, file: Express.Multer.File): Promise<{
    avatar: string;
}>;
export declare function getMasterPublicProfile(masterId: string): Promise<{
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
    fullName: string | null;
    avatar: string | null;
    reviewsAsTarget: {
        id: string;
        createdAt: Date;
        rating: number;
        comment: string | null;
        author: {
            id: string;
            fullName: string | null;
            avatar: string | null;
        };
    }[];
}>;
//# sourceMappingURL=user.service.d.ts.map