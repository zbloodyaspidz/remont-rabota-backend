export declare function updateMasterProfile(userId: string, data: {
    specializationIds?: string[];
    experience?: string;
    workRadius?: number;
    workSchedule?: unknown;
    workLat?: number;
    workLng?: number;
    isAvailable?: boolean;
}): Promise<{
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
export declare function uploadDocuments(userId: string, files: Express.Multer.File[]): Promise<{
    documents: string[];
}>;
export declare function uploadPortfolio(userId: string, files: Express.Multer.File[]): Promise<{
    portfolio: string[];
}>;
export declare function getMasterStatistics(userId: string): Promise<{
    rating: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    acceptanceRate: number | null;
    last30DaysOrders: number;
    last30DaysEarnings: number;
}>;
//# sourceMappingURL=master.service.d.ts.map