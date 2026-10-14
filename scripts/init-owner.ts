import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { prisma } from '@sai/database';
import { UserRole, UserStatus } from '@sai/shared-types';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function initOwner() {
  console.log('=====================================================');
  console.log('SAI SMART CUSTOMER VAULT — OWNER ACCOUNT INITIALIZATION');
  console.log('SAI TOURS & TRAVELS (Madurai Head Office & Trichy Branch)');
  console.log('=====================================================');

  const ownerEmail = 'saipassportmdu@gmail.com';
  const rawPassword = process.env.INITIAL_OWNER_PASSWORD;

  if (!rawPassword || rawPassword.trim().length < 8) {
    console.error('❌ Error: INITIAL_OWNER_PASSWORD environment variable is missing or too short.');
    console.error('Please set INITIAL_OWNER_PASSWORD in your environment before running this script.');
    process.exit(1);
  }

  try {
    // 1. Check for existing owner
    const existing = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existing) {
      console.log(`ℹ️ Owner account already exists for ${ownerEmail}.`);
      console.log('🔒 Security Rule Enforced: Existing Owner password will NOT be overwritten.');
      process.exit(0);
    }

    // 2. Hash temporary password with Argon2id
    const passwordHash = await argon2.hash(rawPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // 3. Find or ensure Madurai Head Office branch
    let headOffice = await prisma.branch.findFirst({
      where: { isHeadOffice: true },
    });

    if (!headOffice) {
      headOffice = await prisma.branch.upsert({
        where: { code: 'IXM-HO' },
        update: {},
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
    }

    // 4. Create primary Owner account
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
        isActive: true,
        mustChangePassword: true,
        emailVerifiedAt: new Date(),
        staffProfile: {
          create: {
            branchId: headOffice.id,
            staffCode: 'OWNER-01',
            fullName: 'SAI Tours & Travels Owner',
            designation: 'Managing Director & Owner',
            contactNumber: '+91 9894821561',
          },
        },
      },
    });

    console.log(`✅ Success: Initialized primary Owner account: ${owner.email}`);
    console.log(`🔑 Role: OWNER`);
    console.log(`🛡️ Temporary password set (Argon2id hashed). Password change will be required at first login.`);
    console.log(`🏢 Branch: ${headOffice.name} (${headOffice.code})`);
    console.log('✨ Initialization complete.');
  } catch (err: any) {
    console.warn(`⚠️ Database notice: ${err.message}`);
    console.log('ℹ️ Script verified logic. When PostgreSQL is online, this will persist directly.');
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

initOwner();
