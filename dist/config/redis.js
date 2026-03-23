"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
const index_1 = require("./index");
const logger_1 = require("./logger");
exports.redis = new ioredis_1.Redis(index_1.config.redis.url, {
    retryStrategy: () => null,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
});
exports.redis.on('connect', () => logger_1.logger.info('Redis connected'));
exports.redis.on('error', (err) => logger_1.logger.error('Redis error', err));
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map