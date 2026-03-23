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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
const logger_1 = require("./config/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const chat_socket_1 = require("./sockets/chat.socket");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
async function bootstrap() {
    // Redis — optional
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let redisClient = null;
    try {
        const { redis } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
        await redis.connect();
        redisClient = redis;
        logger_1.logger.info('Redis connected');
    }
    catch (err) {
        logger_1.logger.warn('Redis not available, running without cache/queues', { err });
    }
    // MinIO — optional
    try {
        const { ensureBucket } = await Promise.resolve().then(() => __importStar(require('./config/minio')));
        await ensureBucket();
        logger_1.logger.info('MinIO bucket ready');
    }
    catch (err) {
        logger_1.logger.warn('MinIO not available, file uploads disabled', { err });
    }
    const app = (0, express_1.default)();
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server, {
        cors: { origin: config_1.config.cors.origins, credentials: true },
        transports: ['websocket', 'polling'],
    });
    // Socket.io Redis adapter — optional
    if (redisClient) {
        try {
            const { createAdapter } = await Promise.resolve().then(() => __importStar(require('@socket.io/redis-adapter')));
            const pubClient = redisClient.duplicate();
            const subClient = redisClient.duplicate();
            await Promise.all([pubClient.connect(), subClient.connect()]);
            io.adapter(createAdapter(pubClient, subClient));
            logger_1.logger.info('Socket.io Redis adapter initialized');
        }
        catch (err) {
            logger_1.logger.warn('Socket.io Redis adapter not available', { err });
        }
    }
    (0, chat_socket_1.setupChatSocket)(io);
    app.use((0, cors_1.default)({
        origin: config_1.config.cors.origins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }));
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.use((0, morgan_1.default)('combined', { stream: { write: (msg) => logger_1.logger.info(msg.trim()) } }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, express_rate_limit_1.default)({ windowMs: config_1.config.rateLimit.windowMs, max: config_1.config.rateLimit.max }));
    app.use('/auth', auth_routes_1.default);
    app.use('/users', user_routes_1.default);
    app.use('/orders', order_routes_1.default);
    app.use('/categories', category_routes_1.default);
    app.use('/notifications', notification_routes_1.default);
    app.use('/admin', admin_routes_1.default);
    app.use('/', review_routes_1.default);
    app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));
    app.use(errorHandler_1.errorHandler);
    // Background jobs — optional (require Redis)
    if (redisClient) {
        try {
            const { startOrderSearchWorker } = await Promise.resolve().then(() => __importStar(require('./jobs/orderSearch.job')));
            const { scheduleRatingUpdate } = await Promise.resolve().then(() => __importStar(require('./jobs/ratingUpdate.job')));
            await startOrderSearchWorker();
            await scheduleRatingUpdate();
            logger_1.logger.info('Background jobs started');
        }
        catch (err) {
            logger_1.logger.warn('Background jobs not started', { err });
        }
    }
    server.listen(config_1.config.port, () => {
        logger_1.logger.info(`Server running on port ${config_1.config.port} [${config_1.config.nodeEnv}]`);
    });
}
bootstrap().catch((err) => {
    logger_1.logger.error('Failed to start server', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map