"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.blockUser = blockUser;
exports.verifyMaster = verifyMaster;
exports.getAllOrders = getAllOrders;
exports.getStats = getStats;
exports.getPendingReviews = getPendingReviews;
exports.moderateReview = moderateReview;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const adminService = __importStar(require("../services/admin.service"));
async function listUsers(req, res, next) {
    try {
        const result = await adminService.listUsers({
            role: req.query.role,
            isBlocked: req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined,
            search: req.query.search,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function blockUser(req, res, next) {
    try {
        const user = await adminService.blockUser(req.params.id, req.user.id);
        res.json(user);
    }
    catch (err) {
        next(err);
    }
}
async function verifyMaster(req, res, next) {
    try {
        const master = await adminService.verifyMaster(req.params.id, req.body.status, req.user.id);
        res.json(master);
    }
    catch (err) {
        next(err);
    }
}
async function getAllOrders(req, res, next) {
    try {
        const result = await adminService.getAllOrders({
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function getStats(req, res, next) {
    try {
        const stats = await adminService.getStats();
        res.json(stats);
    }
    catch (err) {
        next(err);
    }
}
async function getPendingReviews(req, res, next) {
    try {
        const reviews = await adminService.getPendingReviews();
        res.json(reviews);
    }
    catch (err) {
        next(err);
    }
}
async function moderateReview(req, res, next) {
    try {
        const review = await adminService.moderateReview(req.params.id, req.body.action, req.user.id);
        res.json(review);
    }
    catch (err) {
        next(err);
    }
}
async function getSettings(req, res, next) {
    try {
        const settings = await adminService.getSettings();
        res.json(settings);
    }
    catch (err) {
        next(err);
    }
}
async function updateSettings(req, res, next) {
    try {
        const settings = await adminService.updateSettings(req.body, req.user.id);
        res.json(settings);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=admin.controller.js.map