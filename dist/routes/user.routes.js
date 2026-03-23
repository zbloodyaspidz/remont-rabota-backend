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
const express_1 = require("express");
const ctrl = __importStar(require("../controllers/user.controller"));
const masterCtrl = __importStar(require("../controllers/master.controller"));
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/me', ctrl.getMe);
router.patch('/me', ctrl.updateMe);
router.post('/me/avatar', upload_1.upload.single('avatar'), ctrl.uploadAvatar);
router.get('/masters/:id', ctrl.getMasterProfile);
// Master-specific routes
router.patch('/masters/profile', (0, auth_1.requireRole)('MASTER'), masterCtrl.updateProfile);
router.post('/masters/documents', (0, auth_1.requireRole)('MASTER'), upload_1.upload.array('documents', 5), masterCtrl.uploadDocuments);
router.post('/masters/portfolio', (0, auth_1.requireRole)('MASTER'), upload_1.upload.array('photos', 10), masterCtrl.uploadPortfolio);
router.get('/masters/statistics', (0, auth_1.requireRole)('MASTER'), masterCtrl.getStatistics);
exports.default = router;
//# sourceMappingURL=user.routes.js.map