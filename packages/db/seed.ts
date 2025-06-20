import { PrismaClient, CompanyType, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Wertvoll Dienstleistungen GmbH',
      type: CompanyType.UMZUG,
    },
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@wertvoll.de',
      name: 'Admin User',
      emailVerified: new Date(),
    },
  });

  // Create admin employee
  await prisma.employee.create({
    data: {
      companyId: company.id,
      userId: adminUser.id,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  // Create vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      name: 'Sprinter 1',
      licensePlate: 'B-WD-1234',
      cbmCapacity: 20,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      companyId: company.id,
      name: 'LKW 7.5t',
      licensePlate: 'B-WD-5678',
      cbmCapacity: 40,
    },
  });

  // Create sample customers
  const customer1 = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: 'Max Mustermann',
      email: 'max@example.com',
      address: 'Musterstraße 1, 12345 Berlin',
      phone: '+49 30 123456',
      sqm: 75,
      cbm: 30,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: 'Firma ABC GmbH',
      email: 'info@abc-gmbh.de',
      address: 'Businesspark 10, 10115 Berlin',
      type: 'BUSINESS',
      sqm: 250,
      cbm: 100,
    },
  });

  // Create sample offers
  await prisma.offer.create({
    data: {
      customerId: customer1.id,
      status: 'SENT',
      totalPrice: 1500,
      note: 'Umzug 3-Zimmer-Wohnung inkl. Küche',
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });

  await prisma.offer.create({
    data: {
      customerId: customer2.id,
      status: 'ACCEPTED',
      totalPrice: 4500,
      note: 'Büroumzug mit 20 Arbeitsplätzen',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });