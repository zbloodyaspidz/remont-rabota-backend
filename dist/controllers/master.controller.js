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
exports.updateProfile = updateProfile;
exports.uploadDocuments = uploadDocuments;
exports.uploadPortfolio = uploadPortfolio;
exports.getStatistics = getStatistics;
const masterService = __importStar(require("../services/master.service"));
async function updateProfile(req, res, next) {
    try {
        const profile = await masterService.updateMasterProfile(req.user.id, req.body);
        res.json(profile);
    }
    catch (err) {
        next(err);
    }
}
async function uploadDocuments(req, res, next) {
    try {
        const files = req.files;
        if (!files?.length) {
            res.status(400).json({ message: 'No files provided' });
            return;
        }
        const result = await masterService.uploadDocuments(req.user.id, files);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function uploadPortfolio(req, res, next) {
    try {
        const files = req.files;
        if (!files?.length) {
            res.status(400).json({ message: 'No files provided' });
            return;
        }
        const result = await masterService.uploadPortfolio(req.user.id, files);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function getStatistics(req, res, next) {
    try {
        const stats = await masterService.getMasterStatistics(req.user.id);
        res.json(stats);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=master.controller.js.map