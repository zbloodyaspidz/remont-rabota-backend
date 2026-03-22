import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';

const CACHE_KEY = 'categories:all';
const CACHE_TTL = 300; // 5 minutes

export async function getCategories() {
  const cached = await redis.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { children: { where: { isActive: true } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  await redis.set(CACHE_KEY, JSON.stringify(categories), 'EX', CACHE_TTL);
  return categories;
}

export async function createCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
}) {
  const cat = await prisma.category.create({ data });
  await redis.del(CACHE_KEY);
  return cat;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    parentId?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new AppError(404, 'Category not found');
  const updated = await prisma.category.update({ where: { id }, data });
  await redis.del(CACHE_KEY);
  return updated;
}

export async function deleteCategory(id: string) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new AppError(404, 'Category not found');
  const ordersCount = await prisma.order.count({ where: { categoryId: id } });
  if (ordersCount > 0) {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.category.delete({ where: { id } });
  }
  await redis.del(CACHE_KEY);
  return { message: 'Category removed' };
}
