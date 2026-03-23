export declare const config: {
    port: number;
    nodeEnv: string;
    db: {
        url: string;
    };
    redis: {
        url: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    minio: {
        endpoint: string;
        port: number;
        accessKey: string;
        secretKey: string;
        bucket: string;
        useSSL: boolean;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
    };
    fcm: {
        serverKey: string;
    };
    cors: {
        origins: string[];
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
};
//# sourceMappingURL=index.d.ts.map