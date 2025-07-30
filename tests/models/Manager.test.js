const { Manager } = require('../../models');
const bcrypt = require('bcryptjs');

describe('Manager Model', () => {
  beforeAll(async () => {
    await require('../../config/database').sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await require('../../config/database').sequelize.close();
  });

  beforeEach(async () => {
    await Manager.destroy({ where: {} });
  });

  describe('Validation', () => {
    it('should create a manager with valid data', async () => {
      const managerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const manager = await Manager.create(managerData);

      expect(manager).toBeDefined();
      expect(manager.id).toBeDefined();
      expect(manager.name).toBe(managerData.name);
      expect(manager.email).toBe(managerData.email);
      expect(manager.role).toBe('manager');
      expect(manager.isActive).toBe(true);
      expect(manager.password).not.toBe(managerData.password);
    });

    it('should not create a manager without required fields', async () => {
      const managerData = {
        name: 'John Doe'

      };

      await expect(Manager.create(managerData)).rejects.toThrow();
    });

    it('should not create a manager with invalid email', async () => {
      const managerData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(Manager.create(managerData)).rejects.toThrow();
    });

    it('should not create a manager with short password', async () => {
      const managerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };

      await expect(Manager.create(managerData)).rejects.toThrow();
    });

    it('should not create a manager with duplicate email', async () => {
      const managerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await Manager.create(managerData);

      await expect(Manager.create(managerData)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password on creation', async () => {
      const managerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const manager = await Manager.create(managerData);

      expect(manager.password).not.toBe(managerData.password);
      expect(manager.password).toMatch(/^\$2[aby]\$\d{1,2}\$/);
    });

    it('should hash password on update', async () => {
      const manager = await Manager.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const originalHash = manager.password;
      await manager.update({ password: 'newpassword123' });

      expect(manager.password).not.toBe(originalHash);
      expect(manager.password).not.toBe('newpassword123');
    });
  });

  describe('Password Comparison', () => {
    it('should compare password correctly', async () => {
      const manager = await Manager.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const isValid = await manager.comparePassword('password123');
      expect(isValid).toBe(true);

      const isInvalid = await manager.comparePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });
  });

  describe('toJSON Method', () => {
    it('should exclude password from JSON output', async () => {
      const manager = await Manager.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const json = manager.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.name).toBe(manager.name);
      expect(json.email).toBe(manager.email);
      expect(json.id).toBe(manager.id);
    });
  });

  describe('Default Values', () => {
    it('should set default values correctly', async () => {
      const manager = await Manager.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(manager.role).toBe('manager');
      expect(manager.isActive).toBe(true);
      expect(manager.lastLoginAt).toBeNull();
    });
  });
}); 