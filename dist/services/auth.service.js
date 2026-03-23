"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refreshTokens = refreshTokens;
exports.logout = logout;
exports.sendPhoneVerification = sendPhoneVerification;
exports.verifyPhone = verifyPhone;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const redis_1 = require("../config/redis");
const config_1 = require("../config");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
const REFRESH_PREFIX = 'refresh:';
function generateTokens(payload) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.accessExpiresIn });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, { expiresIn: config_1.config.jwt.refreshExpiresIn });
    return { accessToken, refreshToken };
}
async function register(data) {
    const existing = await prisma_1.prisma.user.findFirst({
        where: { OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] },
    });
    if (existing)
        throw new errorHandler_1.AppError(409, 'User already exists');
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            phone: data.phone,
            email: data.email,
            passwordHash,
            fullName: data.fullName,
            role: data.role,
            clientProfile: data.role === client_1.Role.CLIENT ? { create: {} } : undefined,
            masterProfile: data.role === client_1.Role.MASTER
                ? { create: { verificationStatus: 'PENDING' } }
                : undefined,
        },
        select: { id: true, phone: true, email: true, role: true, fullName: true, avatar: true },
    });
    const tokens = generateTokens({ id: user.id, role: user.role, phone: user.phone });
    await redis_1.redis.set(`${REFRESH_PREFIX}${user.id}`, tokens.refreshToken, 'EX', 7 * 24 * 3600);
    return { user, ...tokens };
}
async function login(phone, password) {
    const user = await prisma_1.prisma.user.findUnique({ where: { phone } });
    if (!user || !user.passwordHash)
        throw new errorHandler_1.AppError(401, 'Invalid credentials');
    if (user.isBlocked)
        throw new errorHandler_1.AppError(403, 'Account blocked');
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        throw new errorHandler_1.AppError(401, 'Invalid credentials');
    const tokens = generateTokens({ id: user.id, role: user.role, phone: user.phone });
    await redis_1.redis.set(`${REFRESH_PREFIX}${user.id}`, tokens.refreshToken, 'EX', 7 * 24 * 3600);
    return {
        user: { id: user.id, phone: user.phone, email: user.email, role: user.role, fullName: user.fullName, avatar: user.avatar },
        ...tokens,
    };
}
async function refreshTokens(refreshToken) {
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(refreshToken, config_1.config.jwt.refreshSecret);
    }
    catch {
        throw new errorHandler_1.AppError(401, 'Invalid refresh token');
    }
    const stored = await redis_1.redis.get(`${REFRESH_PREFIX}${payload.id}`);
    if (stored !== refreshToken)
        throw new errorHandler_1.AppError(401, 'Refresh token revoked');
    const tokens = generateTokens({ id: payload.id, role: payload.role, phone: payload.phone });
    await redis_1.redis.set(`${REFRESH_PREFIX}${payload.id}`, tokens.refreshToken, 'EX', 7 * 24 * 3600);
    return tokens;
}
async function logout(userId) {
    await redis_1.redis.del(`${REFRESH_PREFIX}${userId}`);
}
async function sendPhoneVerification(phone) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await prisma_1.prisma.phoneVerification.create({ data: { phone, code, expiresAt } });
    logger_1.logger.info(`SMS code for ${phone}: ${code}`);
    // In production: integrate with SMS provider (e.g., SMSC.ru, SMSRU)
    return { message: 'Code sent' };
}
async function verifyPhone(phone, code) {
    const record = await prisma_1.prisma.phoneVerification.findFirst({
        where: { phone, code, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
    });
    if (!record)
        throw new errorHandler_1.AppError(400, 'Invalid or expired code');
    await prisma_1.prisma.phoneVerification.update({ where: { id: record.id }, data: { used: true } });
    return { verified: true };
}
//# sourceMappingURL=auth.service.js.map