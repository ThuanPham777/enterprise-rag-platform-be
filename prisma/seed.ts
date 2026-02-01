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
    { code: 'MANAGE_DEPARTMENTS', description: 'Manage departments' },
    { code: 'MANAGE_POSITIONS', description: 'Manage positions' },
    { code: 'MANAGE_USER_PROFILES', description: 'Manage user profiles' },
    { code: 'UPLOAD_DOCUMENTS', description: 'Upload documents' },
    { code: 'VIEW_DOCUMENTS', description: 'View documents' },
    { code: 'DELETE_DOCUMENTS', description: 'Delete document' },
    { code: 'QUERY_KNOWLEDGE', description: 'Query internal knowledge' },
    { code: 'MANAGE_DATA_SOURCES', description: 'Manage data sources' },
    { code: 'VIEW_ANALYTICS', description: 'View analytics and query logs' },
    { code: 'VIEW_SYSTEM_LOGS', description: 'View system logs' },
    {
      code: 'MANAGE_SYSTEM',
      description: 'Manage system settings and cleanup',
    },
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

  // ===== ASSIGN PERMISSIONS TO ROLES =====
  const allPermissions = await prisma.permissions.findMany();

  // Admin gets ALL permissions
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

  // Employee gets basic permissions
  const employeePermissions = [
    'VIEW_DOCUMENTS', // View documents they have access to
    'QUERY_KNOWLEDGE', // Query knowledge base via chat
  ];

  for (const permCode of employeePermissions) {
    const perm = allPermissions.find((p) => p.code === permCode);
    if (perm) {
      await prisma.role_permissions.upsert({
        where: {
          role_id_permission_id: {
            role_id: employeeRole.id,
            permission_id: perm.id,
          },
        },
        update: {},
        create: {
          role_id: employeeRole.id,
          permission_id: perm.id,
        },
      });
    }
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

  // ===== DEPARTMENTS =====
  const departments = [
    {
      name: 'Engineering',
      description: 'Software development and engineering',
    },
    { name: 'Product', description: 'Product management and strategy' },
    { name: 'Sales', description: 'Sales and business development' },
    { name: 'Marketing', description: 'Marketing and communications' },
    { name: 'HR', description: 'Human resources and talent management' },
    { name: 'Finance', description: 'Finance and accounting' },
  ];

  const createdDepartments: Array<{
    id: string;
    name: string;
    description: string | null;
  }> = [];
  for (const dept of departments) {
    // Check if department exists by name
    const existing = await prisma.departments.findFirst({
      where: { name: dept.name },
    });

    if (existing) {
      createdDepartments.push(existing);
    } else {
      const department = await prisma.departments.create({
        data: {
          id: randomUUID(),
          name: dept.name,
          description: dept.description,
        },
      });
      createdDepartments.push(department);
    }
  }

  // ===== POSITIONS =====
  const positions = [
    { name: 'Intern', level: 1 },
    { name: 'Junior', level: 2 },
    { name: 'Mid-level', level: 3 },
    { name: 'Senior', level: 4 },
    { name: 'Lead', level: 5 },
    { name: 'Principal', level: 6 },
    { name: 'Manager', level: 5 },
    { name: 'Senior Manager', level: 6 },
    { name: 'Director', level: 7 },
    { name: 'VP', level: 8 },
  ];

  const createdPositions: Array<{ id: string; name: string; level: number }> =
    [];
  for (const pos of positions) {
    // Check if position exists by name
    const existing = await prisma.positions.findFirst({
      where: { name: pos.name },
    });

    if (existing) {
      createdPositions.push(existing);
    } else {
      const position = await prisma.positions.create({
        data: {
          id: randomUUID(),
          name: pos.name,
          level: pos.level,
        },
      });
      createdPositions.push(position);
    }
  }

  // ===== CREATE USER PROFILE FOR ADMIN =====
  const engineeringDept = createdDepartments.find(
    (d) => d.name === 'Engineering',
  );
  const directorPosition = createdPositions.find((p) => p.name === 'Director');

  if (engineeringDept && directorPosition) {
    await prisma.user_profiles.upsert({
      where: { user_id: adminUser.id },
      update: {},
      create: {
        user_id: adminUser.id,
        department_id: engineeringDept.id,
        position_id: directorPosition.id,
        joined_at: new Date('2024-01-01'),
      },
    });
  }

  // ===== CREATE EMPLOYEE USERS =====
  const employeeUsers = [
    // Engineering Department
    {
      email: 'john.doe@company.com',
      fullName: 'John Doe',
      dept: 'Engineering',
      position: 'Senior',
      joinedDate: '2023-03-15',
    },
    {
      email: 'jane.smith@company.com',
      fullName: 'Jane Smith',
      dept: 'Engineering',
      position: 'Mid-level',
      joinedDate: '2023-06-01',
    },
    {
      email: 'mike.johnson@company.com',
      fullName: 'Mike Johnson',
      dept: 'Engineering',
      position: 'Lead',
      joinedDate: '2022-09-10',
    },
    {
      email: 'sarah.williams@company.com',
      fullName: 'Sarah Williams',
      dept: 'Engineering',
      position: 'Junior',
      joinedDate: '2024-01-20',
    },
    {
      email: 'david.brown@company.com',
      fullName: 'David Brown',
      dept: 'Engineering',
      position: 'Principal',
      joinedDate: '2021-11-05',
    },
    {
      email: 'emily.davis@company.com',
      fullName: 'Emily Davis',
      dept: 'Engineering',
      position: 'Senior',
      joinedDate: '2023-02-14',
    },

    // Product Department
    {
      email: 'chris.miller@company.com',
      fullName: 'Chris Miller',
      dept: 'Product',
      position: 'Manager',
      joinedDate: '2022-05-15',
    },
    {
      email: 'lisa.wilson@company.com',
      fullName: 'Lisa Wilson',
      dept: 'Product',
      position: 'Senior',
      joinedDate: '2023-07-22',
    },
    {
      email: 'robert.moore@company.com',
      fullName: 'Robert Moore',
      dept: 'Product',
      position: 'Mid-level',
      joinedDate: '2023-10-08',
    },

    // Sales Department
    {
      email: 'amanda.taylor@company.com',
      fullName: 'Amanda Taylor',
      dept: 'Sales',
      position: 'Senior Manager',
      joinedDate: '2021-12-01',
    },
    {
      email: 'james.anderson@company.com',
      fullName: 'James Anderson',
      dept: 'Sales',
      position: 'Manager',
      joinedDate: '2022-08-20',
    },
    {
      email: 'jennifer.thomas@company.com',
      fullName: 'Jennifer Thomas',
      dept: 'Sales',
      position: 'Mid-level',
      joinedDate: '2023-09-12',
    },
    {
      email: 'william.jackson@company.com',
      fullName: 'William Jackson',
      dept: 'Sales',
      position: 'Junior',
      joinedDate: '2024-02-01',
    },

    // Marketing Department
    {
      email: 'patricia.white@company.com',
      fullName: 'Patricia White',
      dept: 'Marketing',
      position: 'Manager',
      joinedDate: '2022-04-10',
    },
    {
      email: 'michael.harris@company.com',
      fullName: 'Michael Harris',
      dept: 'Marketing',
      position: 'Senior',
      joinedDate: '2023-01-18',
    },
    {
      email: 'linda.martin@company.com',
      fullName: 'Linda Martin',
      dept: 'Marketing',
      position: 'Mid-level',
      joinedDate: '2023-08-30',
    },

    // HR Department
    {
      email: 'richard.thompson@company.com',
      fullName: 'Richard Thompson',
      dept: 'HR',
      position: 'Manager',
      joinedDate: '2022-06-25',
    },
    {
      email: 'susan.garcia@company.com',
      fullName: 'Susan Garcia',
      dept: 'HR',
      position: 'Senior',
      joinedDate: '2023-04-05',
    },

    // Finance Department
    {
      email: 'joseph.martinez@company.com',
      fullName: 'Joseph Martinez',
      dept: 'Finance',
      position: 'Senior Manager',
      joinedDate: '2021-10-15',
    },
    {
      email: 'nancy.robinson@company.com',
      fullName: 'Nancy Robinson',
      dept: 'Finance',
      position: 'Manager',
      joinedDate: '2022-11-12',
    },
  ];

  const createdEmployeeUsers: Array<{ id: string; email: string }> = [];
  const defaultPasswordHash = await bcrypt.hash('Employee@123', 12);

  for (const userData of employeeUsers) {
    const user = await prisma.users.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: randomUUID(),
        email: userData.email,
        password_hash: defaultPasswordHash,
        full_name: userData.fullName,
        status: DEFAULT_USER_STATUS,
      },
    });

    // Assign EMPLOYEE role
    await prisma.user_roles.upsert({
      where: {
        user_id_role_id: {
          user_id: user.id,
          role_id: employeeRole.id,
        },
      },
      update: {},
      create: {
        user_id: user.id,
        role_id: employeeRole.id,
      },
    });

    // Create user profile
    const dept = createdDepartments.find((d) => d.name === userData.dept);
    const position = createdPositions.find((p) => p.name === userData.position);

    if (dept && position) {
      await prisma.user_profiles.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          department_id: dept.id,
          position_id: position.id,
          joined_at: new Date(userData.joinedDate),
        },
      });
    }

    createdEmployeeUsers.push({ id: user.id, email: user.email });
  }

  console.log('✅ Seed completed');
  console.log(`   - ${permissions.length} permissions`);
  console.log(`   - 2 roles`);
  console.log(`   - 1 admin user`);
  console.log(`   - ${createdEmployeeUsers.length} employee users`);
  console.log(`   - ${createdDepartments.length} departments`);
  console.log(`   - ${createdPositions.length} positions`);
  console.log(`   - ${createdEmployeeUsers.length + 1} user profiles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
