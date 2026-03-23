export declare function addNotificationJob(data: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}): Promise<void>;
export declare const notificationQueue: {
    add: (_name: string, data: any) => Promise<void>;
};
export default notificationQueue;
//# sourceMappingURL=notification.job.d.ts.map