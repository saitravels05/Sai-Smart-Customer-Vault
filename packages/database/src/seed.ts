import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting baseline database seeder for SAI TOURS & TRAVELS...');

  // 1. Seed Madurai Head Office
  const maduraiBranch = await prisma.branch.upsert({
    where: { code: 'IXM-HO' },
    update: {
      name: 'Madurai Head Office',
      phone: '+91 9894821561',
      email: 'info@saitravelservices.com',
      isHeadOffice: true,
      isActive: true,
    },
    create: {
      code: 'IXM-HO',
      name: 'Madurai Head Office',
      address: 'SAI Tours & Travels, Head Office, Madurai, Tamil Nadu, India',
      city: 'Madurai',
      state: 'Tamil Nadu',
      country: 'India',
      phone: '+91 9894821561',
      email: 'info@saitravelservices.com',
      isHeadOffice: true,
      isActive: true,
    },
  });
  console.log(`✅ Seeded Branch: ${maduraiBranch.name} (${maduraiBranch.code})`);

  // 2. Seed Trichy Branch Office
  const trichyBranch = await prisma.branch.upsert({
    where: { code: 'TRZ-BO' },
    update: {
      name: 'Trichy Branch Office',
      phone: '+91 9894619921',
      email: 'trichy@saitravelservices.com',
      isHeadOffice: false,
      isActive: true,
    },
    create: {
      code: 'TRZ-BO',
      name: 'Trichy Branch Office',
      address: 'SAI Tours & Travels, Branch Office, Trichy, Tamil Nadu, India',
      city: 'Trichy',
      state: 'Tamil Nadu',
      country: 'India',
      phone: '+91 9894619921',
      email: 'trichy@saitravelservices.com',
      isHeadOffice: false,
      isActive: true,
    },
  });
  console.log(`✅ Seeded Branch: ${trichyBranch.name} (${trichyBranch.code})`);

  // 3. Seed Initial Super Admin (Argon2id hashed)
  const defaultAdminEmail = 'admin@saitravelservices.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: defaultAdminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash('Admin@SaiVault2026!', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const adminUser = await prisma.user.create({
      data: {
        email: defaultAdminEmail,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        staffProfile: {
          create: {
            branchId: maduraiBranch.id,
            staffCode: 'STAFF-ADMIN-01',
            fullName: 'System Administrator',
            designation: 'Super Administrator',
            contactNumber: '+91 9894821561',
          },
        },
      },
    });

    console.log(`✅ Seeded Initial Super Admin: ${adminUser.email}`);
  } else {
    console.log(`ℹ️ Super Admin already exists: ${existingAdmin.email}`);
  }

  console.log('✨ Baseline seed completed successfully. (ZERO dummy customer records created).');
}

main()
  .catch((e) => {
    console.error('❌ Seeder encountered an error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
