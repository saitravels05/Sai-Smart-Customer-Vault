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
      address: '4/166, Melakkal Main Road, Opp: Fenner India, Kochadai, Madurai – 16',
      city: 'Madurai',
      state: 'Tamil Nadu',
      country: 'India',
      phone: '+91 9894821561',
      email: 'saipassportmdu@gmail.com',
      isHeadOffice: true,
      isActive: true,
    },
    create: {
      code: 'IXM-HO',
      name: 'Madurai Head Office',
      address: '4/166, Melakkal Main Road, Opp: Fenner India, Kochadai, Madurai – 16',
      city: 'Madurai',
      state: 'Tamil Nadu',
      country: 'India',
      phone: '+91 9894821561',
      email: 'saipassportmdu@gmail.com',
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
      address: 'No.4, 75/A, Jothi Complex, Nee Road, Thillai Nagar, Trichy – 18',
      city: 'Trichy',
      state: 'Tamil Nadu',
      country: 'India',
      phone: '+91 9894619921',
      email: 'saipassporttry@gmail.com',
      isHeadOffice: false,
      isActive: true,
    },
    create: {
      code: 'TRZ-BO',
      name: 'Trichy Branch Office',
      address: 'No.4, 75/A, Jothi Complex, Nee Road, Thillai Nagar, Trichy – 18',
      city: 'Trichy',
      state: 'Tamil Nadu',
      country: 'India',
      phone: '+91 9894619921',
      email: 'saipassporttry@gmail.com',
      isHeadOffice: false,
      isActive: true,
    },
  });
  console.log(`✅ Seeded Branch: ${trichyBranch.name} (${trichyBranch.code})`);

  // 3. Seed Primary Owner Account if INITIAL_OWNER_PASSWORD is provided
  const ownerEmail = 'saipassportmdu@gmail.com';
  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  const initialOwnerPassword = process.env.INITIAL_OWNER_PASSWORD;

  if (!existingOwner) {
    if (initialOwnerPassword) {
      const passwordHash = await argon2.hash(initialOwnerPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });

      const ownerUser = await prisma.user.create({
        data: {
          email: ownerEmail,
          passwordHash,
          role: UserRole.OWNER,
          isActive: true,
          mustChangePassword: true,
          emailVerifiedAt: new Date(),
          staffProfile: {
            create: {
              branchId: maduraiBranch.id,
              staffCode: 'OWNER-01',
              fullName: 'SAI Tours & Travels Owner',
              designation: 'Managing Director / Owner',
              contactNumber: '+91 9894821561',
            },
          },
        },
      });

      console.log(`✅ Initialized Primary Owner Account: ${ownerUser.email} (Role: OWNER, mustChangePassword: true)`);
    } else {
      console.log('ℹ️ INITIAL_OWNER_PASSWORD not set in environment. Skipping owner creation in seed.');
    }
  } else {
    console.log(`ℹ️ Primary Owner account already exists: ${existingOwner.email}. Preserving existing credentials.`);
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
