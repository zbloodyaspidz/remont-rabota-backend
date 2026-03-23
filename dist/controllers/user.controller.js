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
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.uploadAvatar = uploadAvatar;
exports.getMasterProfile = getMasterProfile;
const userService = __importStar(require("../services/user.service"));
async function getMe(req, res, next) {
    try {
        const user = await userService.getMe(req.user.id);
        res.json(user);
    }
    catch (err) {
        next(err);
    }
}
async function updateMe(req, res, next) {
    try {
        const user = await userService.updateMe(req.user.id, req.body);
        res.json(user);
    }
    catch (err) {
        next(err);
    }
}
async function uploadAvatar(req, res, next) {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file provided' });
            return;
        }
        const result = await userService.uploadAvatar(req.user.id, req.file);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function getMasterProfile(req, res, next) {
    try {
        const profile = await userService.getMasterPublicProfile(req.params.id);
        res.json(profile);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=user.controller.js.map