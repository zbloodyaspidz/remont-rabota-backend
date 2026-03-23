"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = void 0;
exports.addNotificationJob = addNotificationJob;
const logger_1 = require("../config/logger");
async function addNotificationJob(data) {
    logger_1.logger.info('Notification job queued (in-memory)', { userId: data.userId, title: data.title });
}
exports.notificationQueue = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    add: (_name, data) => addNotificationJob(data),
};
exports.default = exports.notificationQueue;
//# sourceMappingURL=notification.job.js.map