export declare function getNotifications(userId: string, page?: number, limit?: number): Promise<{
    notifications: {
        id: string;
        createdAt: Date;
        read: boolean;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        body: string;
        userId: string;
        title: string;
    }[];
    total: number;
    page: number;
    pages: number;
}>;
export declare function markAsRead(notificationId: string, userId: string): Promise<{
    id: string;
    createdAt: Date;
    read: boolean;
    data: import("@prisma/client/runtime/library").JsonValue | null;
    body: string;
    userId: string;
    title: string;
}>;
export declare function createNotification(data: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}): Promise<{
    id: string;
    createdAt: Date;
    read: boolean;
    data: import("@prisma/client/runtime/library").JsonValue | null;
    body: string;
    userId: string;
    title: string;
}>;
export declare function sendPushNotification(data: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}): Promise<void>;
//# sourceMappingURL=notification.service.d.ts.map