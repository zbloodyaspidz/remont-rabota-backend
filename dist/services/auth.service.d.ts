import { Role } from '@prisma/client';
export declare function register(data: {
    phone: string;
    email?: string;
    password: string;
    fullName?: string;
    role: Role;
}): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        phone: string;
        email: string | null;
        role: import(".prisma/client").$Enums.Role;
        fullName: string | null;
        avatar: string | null;
    };
}>;
export declare function login(phone: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        phone: string;
        email: string | null;
        role: import(".prisma/client").$Enums.Role;
        fullName: string | null;
        avatar: string | null;
    };
}>;
export declare function refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare function logout(userId: string): Promise<void>;
export declare function sendPhoneVerification(phone: string): Promise<{
    message: string;
}>;
export declare function verifyPhone(phone: string, code: string): Promise<{
    verified: boolean;
}>;
//# sourceMappingURL=auth.service.d.ts.map