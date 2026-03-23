"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const prisma_1 = require("../config/prisma");
const redis_1 = require("../config/redis");
const errorHandler_1 = require("../middleware/errorHandler");
const CACHE_KEY = 'categories:all';
const CACHE_TTL = 300; // 5 minutes
async function getCategories() {
    const cached = await redis_1.redis.get(CACHE_KEY);
    if (cached)
        return JSON.parse(cached);
    const categories = await prisma_1.prisma.category.findMany({
        where: { isActive: true },
        include: { children: { where: { isActive: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    await redis_1.redis.set(CACHE_KEY, JSON.stringify(categories), 'EX', CACHE_TTL);
    return categories;
}
async function createCategory(data) {
    const cat = await prisma_1.prisma.category.create({ data });
    await redis_1.redis.del(CACHE_KEY);
    return cat;
}
async function updateCategory(id, data) {
    const cat = await prisma_1.prisma.category.findUnique({ where: { id } });
    if (!cat)
        throw new errorHandler_1.AppError(404, 'Category not found');
    const updated = await prisma_1.prisma.category.update({ where: { id }, data });
    await redis_1.redis.del(CACHE_KEY);
    return updated;
}
async function deleteCategory(id) {
    const cat = await prisma_1.prisma.category.findUnique({ where: { id } });
    if (!cat)
        throw new errorHandler_1.AppError(404, 'Category not found');
    const ordersCount = await prisma_1.prisma.order.count({ where: { categoryId: id } });
    if (ordersCount > 0) {
        await prisma_1.prisma.category.update({ where: { id }, data: { isActive: false } });
    }
    else {
        await prisma_1.prisma.category.delete({ where: { id } });
    }
    await redis_1.redis.del(CACHE_KEY);
    return { message: 'Category removed' };
}
//# sourceMappingURL=category.service.js.map