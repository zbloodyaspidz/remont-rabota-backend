/**
 * Background worker that processes orders awaiting master search.
 * Runs on an interval, picks orders from queue, finds matching masters, and sends push notifications.
 */
export declare function startOrderSearchWorker(): Promise<void>;
//# sourceMappingURL=orderSearch.job.d.ts.map