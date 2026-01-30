import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import 'dotenv/config';
import { DEFAULT_USER_STATUS } from '../src/users/enums/user-status.enum';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // ===== PERMISSIONS =====
  const permissions = [
    { code: 'MANAGE_USERS', description: 'Manage users' },
    { code: 'MANAGE_ROLES', description: 'Manage roles' },
    { code: 'MANAGE_PERMISSIONS', description: 'Manage permissions' },
    { code: 'UPLOAD_DOCUMENT', description: 'Upload documents' },
    { code: 'QUERY_KNOWLEDGE', description: 'Query internal knowledge' },
  ];

  for (const p of permissions) {
    await prisma.permissions.upsert({
      where: { code: p.code },
      update: {},
      create: {
        id: randomUUID(),
        ...p,
      },
    });
  }

  // ===== ROLES =====
  const adminRole = await prisma.roles.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'ADMIN',
      description: 'System administrator',
    },
  });

  const employeeRole = await prisma.roles.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'EMPLOYEE',
      description: 'Normal employee',
    },
  });

  // ===== ASSIGN ALL PERMISSIONS TO ADMIN =====
  const allPermissions = await prisma.permissions.findMany();

  for (const perm of allPermissions) {
    await prisma.role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: perm.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: perm.id,
      },
    });
  }

  // ===== CREATE ADMIN USER =====
  const adminEmail = 'admin@company.com';
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);

  const adminUser = await prisma.users.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: randomUUID(),
      email: adminEmail,
      password_hash: adminPasswordHash,
      status: DEFAULT_USER_STATUS,
    },
  });

  // ===== ASSIGN ADMIN ROLE =====
  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      user_id: adminUser.id,
      role_id: adminRole.id,
    },
  });

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
