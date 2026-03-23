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
exports.createOrder = createOrder;
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.acceptOrder = acceptOrder;
exports.rejectOrder = rejectOrder;
exports.completeOrder = completeOrder;
exports.cancelOrder = cancelOrder;
exports.updateStatus = updateStatus;
exports.getAvailableOrders = getAvailableOrders;
const orderService = __importStar(require("../services/order.service"));
async function createOrder(req, res, next) {
    try {
        const photos = req.files;
        const order = await orderService.createOrder(req.user.id, {
            ...req.body,
            photos,
        });
        res.status(201).json(order);
    }
    catch (err) {
        next(err);
    }
}
async function getOrders(req, res, next) {
    try {
        const result = await orderService.getOrders(req.user.id, req.user.role, {
            status: req.query.status,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function getOrderById(req, res, next) {
    try {
        const order = await orderService.getOrderById(req.params.id, req.user.id, req.user.role);
        res.json(order);
    }
    catch (err) {
        next(err);
    }
}
async function acceptOrder(req, res, next) {
    try {
        const order = await orderService.acceptOrder(req.params.id, req.user.id, req.body.workPrice);
        res.json(order);
    }
    catch (err) {
        next(err);
    }
}
async function rejectOrder(req, res, next) {
    try {
        const result = await orderService.rejectOrder(req.params.id, req.user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function completeOrder(req, res, next) {
    try {
        const order = await orderService.completeOrder(req.params.id, req.user.id);
        res.json(order);
    }
    catch (err) {
        next(err);
    }
}
async function cancelOrder(req, res, next) {
    try {
        const order = await orderService.cancelOrder(req.params.id, req.user.id, req.user.role, req.body.reason);
        res.json(order);
    }
    catch (err) {
        next(err);
    }
}
async function updateStatus(req, res, next) {
    try {
        const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user.id, req.user.role);
        res.json(order);
    }
    catch (err) {
        next(err);
    }
}
async function getAvailableOrders(req, res, next) {
    try {
        const result = await orderService.getAvailableOrdersForMaster(req.user.id, {
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=order.controller.js.map