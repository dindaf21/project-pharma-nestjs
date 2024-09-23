import { DataSource, In } from 'typeorm';
import { hash } from 'bcrypt';
import config from '../config/ormconfig';
import { PermissionEntity } from '../modules/auth/entities/permission.entity';
import { RoleEntity } from '../modules/auth/entities/role.entity';
import { UserEntity } from '../modules/auth/entities/user.entity';
import { RolePermissionEntity } from '../modules/auth/entities/role_permissions.entity';
import { UserRoleEntity } from '../modules/auth/entities/user_roles.entity';

export async function seedRolePermission() {
  const dataSource = new DataSource(config);

  try {
    await dataSource.initialize();

    const permissionRepository = dataSource.getRepository(PermissionEntity);
    const roleRepository = dataSource.getRepository(RoleEntity);
    const userRepository = dataSource.getRepository(UserEntity);
    const rolePermissionRepository =
      dataSource.getRepository(RolePermissionEntity);
    const userRoleRepository = dataSource.getRepository(UserRoleEntity);

    // Permissions data
    const permissions = [
      
      { name: 'read:category', description: 'Permission to read category data' },
      { name: 'create:category', description: 'Permission to create category data' },
      { name: 'update:category', description: 'Permission to update category data' },
      { name: 'delete:category', description: 'Permission to delete category data' },

      { name: 'read:product', description: 'Permission to read product data' },
      { name: 'create:product', description: 'Permission to create product data' },
      { name: 'update:product', description: 'Permission to update product data' },
      { name: 'delete:product', description: 'Permission to delete product data' },

      { name: 'read:unit', description: 'Permission to read unit data' },
      { name: 'create:unit', description: 'Permission to create unit data' },
      { name: 'update:unit', description: 'Permission to update unit data' },
      { name: 'delete:unit', description: 'Permission to delete unit data' },

      { name: 'read: supplier', description: 'Permission to read supplier data' },
      { name: 'create: supplier', description: 'Permission to create supplier data' },
      { name: 'update: supplier', description: 'Permission to update supplier data' },
      { name: 'delete: supplier', description: 'Permission to delete supplier data' },

      { name: 'read: warehouse', description: 'Permission to read warehouse data' },
      { name: 'create: warehouse', description: 'Permission to create warehouse data' },
      { name: 'update: warehouse', description: 'Permission to update warehouse data' },
      { name: 'delete: warehouse', description: 'Permission to delete warehouse data' },

      { name: 'read: inventory', description: 'Permission to read inventory' },
      { name: 'create: inventory', description: 'Permission to create inventory' },
      { name: 'update: inventory', description: 'Permission to update inventory' },
      { name: 'delete: inventory', description: 'Permission to deleete inventory' },

      { name: 'read:produk mixtures', description: 'Permission to read produk mixtures' },
      { name: 'create:produk mixtures', description: 'Permission to create produk mixtures' },
      { name: 'update:produk mixtures', description: 'Permission to update produk mixtures' },
      { name: 'delete:produk mixtures', description: 'Permission to deleete produk mixtures' },

      { name: 'read:transactions', description: 'Permission to read transactions' },
      { name: 'create:transactions', description: 'Permission to create transactions' },
      { name: 'update:transactions', description: 'Permission to update transactions' },
      { name: 'delete:transactions', description: 'Permission to deleete transactions' },
      
    ];

    // Roles data
    const roles = [
      { name: 'Admin', description: 'Administrator role with full access' },
      { name: 'User', description: 'Standard user role with limited access' },
    ];

    // Users data
    const users = [
      { username: 'admin', email: 'admin@example.com', password: 'admin123' },
      { username: 'user', email: 'user@example.com', password: 'user123' },
    ];

    // Fetch existing permissions and roles in one query
    const existingPermissions = await permissionRepository.find();
    const existingRoles = await roleRepository.find();

    // Convert fetched permissions/roles to maps for faster lookup
    const existingPermissionMap = new Map(
      existingPermissions.map((p) => [p.name, p]),
    );
    const existingRoleMap = new Map(existingRoles.map((r) => [r.name, r]));

    // Insert permissions (skip duplicates)
    for (const permissionData of permissions) {
      if (!existingPermissionMap.has(permissionData.name)) {
        const newPermission = permissionRepository.create(permissionData);
        await permissionRepository.save(newPermission);
        console.log(`Permission ${permissionData.name} created`);
      } else {
        console.log(`Permission ${permissionData.name} already exists`);
      }
    }

    // Insert roles (skip duplicates)
    for (const roleData of roles) {
      if (!existingRoleMap.has(roleData.name)) {
        const newRole = roleRepository.create(roleData);
        await roleRepository.save(newRole);
        console.log(`Role ${roleData.name} created`);
      } else {
        console.log(`Role ${roleData.name} already exists`);
      }
    }

    // Insert users with encrypted passwords
    for (const userData of users) {
      let user = await userRepository.findOneBy({ email: userData.email });
      if (!user) {
        const hashedPassword = await hash(userData.password, 12);
        user = userRepository.create({ ...userData, password: hashedPassword });
        await userRepository.save(user);
        console.log(`User ${userData.email} created`);
      } else {
        console.log(`User ${userData.email} already exists`);
      }
    }

    // Assign permissions to Admin role
    const adminRole =
      existingRoleMap.get('Admin') ||
      (await roleRepository.findOneBy({ name: 'Admin' }));

    const userRole =
      existingRoleMap.get('User') ||
      (await roleRepository.findOneBy({ name: 'User' }));

    const allPermissions = await permissionRepository.find({
      where: { name: In(permissions.map((p) => p.name)) },
    });

    const existingRolePermissions = await rolePermissionRepository.findBy({
      role: adminRole,
    });

    const existingRolePermissionMap = new Map(
      existingRolePermissions.map((rp) => [rp.permission.name, rp]),
    );

    if (adminRole) {
      for (const permission of allPermissions) {
        if (!existingRolePermissionMap.has(permission.name)) {
          await rolePermissionRepository.save({ role: adminRole, permission });
          console.log(`Permission ${permission.name} assigned to Admin role`);
        }
      }
    }

    // Assign roles to users
    const adminUser = await userRepository.findOneBy({
      email: 'admin@example.com',
    });
    const normalUser = await userRepository.findOneBy({
      email: 'user@example.com',
    });

    if (adminUser && adminRole) {
      const existingAdminUserRole = await userRoleRepository.findOne({
        where: { user: adminUser, role: adminRole },
      });
      if (!existingAdminUserRole) {
        await userRoleRepository.save({ user: adminUser, role: adminRole });
        console.log('Admin user role assigned');
      } else {
        console.log('Admin user already has the Admin role');
      }
    }

    if (normalUser && adminRole) {
      const existingNormalUserRole = await userRoleRepository.findOne({
        where: { user: normalUser, role: userRole },
      });
      if (!existingNormalUserRole) {
        await userRoleRepository.save({ user: normalUser, role: userRole });
        console.log('Normal user role assigned');
      } else {
        console.log('Normal user already has the Admin role');
      }
    }

    console.log('Data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await dataSource.destroy();
  }
}
