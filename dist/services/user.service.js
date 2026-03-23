"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.uploadAvatar = uploadAvatar;
exports.getMasterPublicProfile = getMasterPublicProfile;
const prisma_1 = require("../config/prisma");
const minio_1 = require("../config/minio");
const errorHandler_1 = require("../middleware/errorHandler");
async function getMe(userId) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        include: { clientProfile: true, masterProfile: true },
    });
    if (!user)
        throw new errorHandler_1.AppError(404, 'User not found');
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
}
async function updateMe(userId, data) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new errorHandler_1.AppError(404, 'User not found');
    const updated = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            fullName: data.fullName,
            email: data.email,
            clientProfile: user.role === 'CLIENT' && data.savedAddresses
                ? { update: { savedAddresses: data.savedAddresses } }
                : undefined,
        },
        include: { clientProfile: true, masterProfile: true },
    });
    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return safe;
}
async function uploadAvatar(userId, file) {
    const url = await (0, minio_1.uploadFile)(file.buffer, file.originalname, file.mimetype);
    await prisma_1.prisma.user.update({ where: { id: userId }, data: { avatar: url } });
    return { avatar: url };
}
async function getMasterPublicProfile(masterId) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: masterId },
        select: {
            id: true,
            fullName: true,
            avatar: true,
            masterProfile: true,
            reviewsAsTarget: {
                where: { isHidden: false },
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    author: { select: { id: true, fullName: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            },
        },
    });
    if (!user || !user.masterProfile)
        throw new errorHandler_1.AppError(404, 'Master not found');
    return user;
}
//# sourceMappingURL=user.service.js.map