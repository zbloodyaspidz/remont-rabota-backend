"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRatingUpdate = scheduleRatingUpdate;
const logger_1 = require("../config/logger");
async function scheduleRatingUpdate() {
    logger_1.logger.info('Rating update scheduler not configured (Redis required)');
}
//# sourceMappingURL=ratingUpdate.job.js.map