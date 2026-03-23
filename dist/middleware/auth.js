"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const prisma_1 = require("../config/prisma");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, role: true, phone: true, isBlocked: true },
        });
        if (!user || user.isBlocked) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        req.user = { id: user.id, role: user.role, phone: user.phone };
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    next();
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map