import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // System settings
  const existing = await prisma.systemSettings.findFirst();
  if (!existing) {
    await prisma.systemSettings.create({ data: { orderCommission: 250, defaultRadius: 10 } });
    console.log('Created system settings');
  }

  // Categories
  const categories = [
    { name: 'Электрика', icon: '⚡', children: ['Замена проводки', 'Установка розеток', 'Монтаж щитка', 'Диагностика электросети'] },
    { name: 'Сантехника', icon: '🔧', children: ['Замена труб', 'Установка сантехники', 'Устранение засоров', 'Установка счётчиков'] },
    { name: 'Отделочные работы', icon: '🏠', children: ['Покраска стен', 'Поклейка обоев', 'Укладка плитки', 'Шпаклёвка'] },
    { name: 'Мебель и сборка', icon: '🪑', children: ['Сборка мебели', 'Установка кухни', 'Монтаж шкафов'] },
    { name: 'Двери и окна', icon: '🚪', children: ['Установка дверей', 'Замена замков', 'Ремонт окон', 'Утепление'] },
    { name: 'Полы', icon: '🔨', children: ['Укладка ламината', 'Стяжка пола', 'Циклёвка', 'Паркет'] },
    { name: 'Потолки', icon: '✨', children: ['Натяжные потолки', 'Гипсокартон', 'Покраска потолка'] },
    { name: 'Климат', icon: '❄️', children: ['Установка кондиционера', 'Вентиляция', 'Тёплый пол'] },
  ];

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { name: cat.name },
      create: { name: cat.name, icon: cat.icon },
      update: {},
    });

    for (const childName of cat.children) {
      await prisma.category.upsert({
        where: { name: childName },
        create: { name: childName, parentId: parent.id },
        update: {},
      });
    }
  }
  console.log('Categories seeded');

  // Admin user
  const adminPhone = '+79000000000';
  const adminExists = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        phone: adminPhone,
        email: 'admin@remont-rabota.ru',
        passwordHash: await bcrypt.hash('Admin123!', 10),
        fullName: 'Администратор',
        role: 'ADMIN',
      },
    });
    console.log(`Admin created: ${adminPhone} / Admin123!`);
  }

  // Test client
  const clientPhone = '+79111111111';
  const clientExists = await prisma.user.findUnique({ where: { phone: clientPhone } });
  if (!clientExists) {
    await prisma.user.create({
      data: {
        phone: clientPhone,
        passwordHash: await bcrypt.hash('Client123!', 10),
        fullName: 'Тестовый Клиент',
        role: 'CLIENT',
        clientProfile: { create: {} },
      },
    });
    console.log(`Test client created: ${clientPhone} / Client123!`);
  }

  // Test master
  const masterPhone = '+79222222222';
  const masterExists = await prisma.user.findUnique({ where: { phone: masterPhone } });
  if (!masterExists) {
    const electricCat = await prisma.category.findUnique({ where: { name: 'Электрика' } });
    await prisma.user.create({
      data: {
        phone: masterPhone,
        passwordHash: await bcrypt.hash('Master123!', 10),
        fullName: 'Иван Мастеров',
        role: 'MASTER',
        masterProfile: {
          create: {
            specializationIds: electricCat ? [electricCat.id] : [],
            experience: '5 лет опыта работы электриком',
            workRadius: 15,
            verificationStatus: 'VERIFIED',
            rating: 4.8,
            totalOrders: 47,
            completedOrders: 45,
            workLat: 55.7558,
            workLng: 37.6173,
          },
        },
      },
    });
    console.log(`Test master created: ${masterPhone} / Master123!`);
  }

  console.log('Seeding completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
