"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureBucket = ensureBucket;
exports.uploadFile = uploadFile;
const logger_1 = require("./logger");
async function ensureBucket() {
    logger_1.logger.info('MinIO not configured, file uploads disabled');
}
async function uploadFile(_buffer, _filename, _mimetype) {
    throw new Error('File uploads not configured');
}
//# sourceMappingURL=minio.js.map