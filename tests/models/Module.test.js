const { Module } = require('../../models');

describe('Module Model', () => {
  beforeAll(async () => {
    await require('../../config/database').sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await require('../../config/database').sequelize.close();
  });

  beforeEach(async () => {
    await Module.destroy({ where: {} });
  });

  describe('Validation', () => {
    it('should create a module with valid data', async () => {
      const moduleData = {
        name: 'Advanced Backend Development',
        code: 'CS401',
        description: 'Advanced backend development concepts',
        half: 'H1',
        credits: 15
      };

      const module = await Module.create(moduleData);

      expect(module).toBeDefined();
      expect(module.id).toBeDefined();
      expect(module.name).toBe(moduleData.name);
      expect(module.code).toBe(moduleData.code);
      expect(module.description).toBe(moduleData.description);
      expect(module.half).toBe(moduleData.half);
      expect(module.credits).toBe(moduleData.credits);
      expect(module.isActive).toBe(true);
    });

    it('should not create a module without required fields', async () => {
      const moduleData = {
        name: 'Advanced Backend Development'

      };

      await expect(Module.create(moduleData)).rejects.toThrow();
    });

    it('should not create a module with invalid half', async () => {
      const moduleData = {
        name: 'Advanced Backend Development',
        code: 'CS401',
        half: 'H3',
        credits: 15
      };

      await expect(Module.create(moduleData)).rejects.toThrow();
    });

    it('should not create a module with duplicate code', async () => {
      const moduleData = {
        name: 'Advanced Backend Development',
        code: 'CS401',
        half: 'H1',
        credits: 15
      };

      await Module.create(moduleData);

      await expect(Module.create(moduleData)).rejects.toThrow();
    });

    it('should not create a module with invalid credits', async () => {
      const moduleData = {
        name: 'Advanced Backend Development',
        code: 'CS401',
        half: 'H1',
        credits: 35
      };

      await expect(Module.create(moduleData)).rejects.toThrow();
    });

    it('should not create a module with short name', async () => {
      const moduleData = {
        name: 'A',
        code: 'CS401',
        half: 'H1',
        credits: 15
      };

      await expect(Module.create(moduleData)).rejects.toThrow();
    });

    it('should not create a module with short code', async () => {
      const moduleData = {
        name: 'Advanced Backend Development',
        code: 'C',
        half: 'H1',
        credits: 15
      };

      await expect(Module.create(moduleData)).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should set default values correctly', async () => {
      const module = await Module.create({
        name: 'Advanced Backend Development',
        code: 'CS401',
        half: 'H1'

      });

      expect(module.credits).toBe(0);
      expect(module.isActive).toBe(true);
    });
  });

  describe('Half Validation', () => {
    it('should accept H1 as valid half', async () => {
      const module = await Module.create({
        name: 'Advanced Backend Development',
        code: 'CS401',
        half: 'H1'
      });

      expect(module.half).toBe('H1');
    });

    it('should accept H2 as valid half', async () => {
      const module = await Module.create({
        name: 'Advanced Backend Development',
        code: 'CS401',
        half: 'H2'
      });

      expect(module.half).toBe('H2');
    });

    it('should reject invalid half values', async () => {
      const invalidHalves = ['H3', 'H0', 'FULL', ''];

      for (const half of invalidHalves) {
        await expect(Module.create({
          name: 'Advanced Backend Development',
          code: `CS${half}`,
          half: half
        })).rejects.toThrow();
      }
    });
  });

  describe('Credits Validation', () => {
    it('should accept credits within valid range', async () => {
      const validCredits = [0, 5, 10, 15, 20, 25, 30];

      for (const credits of validCredits) {
        const module = await Module.create({
          name: `Module ${credits}`,
          code: `CS${credits}`,
          half: 'H1',
          credits: credits
        });

        expect(module.credits).toBe(credits);
      }
    });

    it('should reject credits outside valid range', async () => {
      const invalidCredits = [-1, 31, 100];

      for (const credits of invalidCredits) {
        await expect(Module.create({
          name: `Module ${credits}`,
          code: `CS${credits}`,
          half: 'H1',
          credits: credits
        })).rejects.toThrow();
      }
    });
  });

  describe('Code Uniqueness', () => {
    it('should enforce unique codes', async () => {
      const moduleData = {
        name: 'Advanced Backend Development',
        code: 'CS401',
        half: 'H1'
      };

      await Module.create(moduleData);

      await expect(Module.create({
        name: 'Different Module',
        code: 'CS401',
        half: 'H2'
      })).rejects.toThrow();
    });
  });

  describe('Soft Delete', () => {
    it('should support soft delete', async () => {
      const module = await Module.create({
        name: 'Advanced Backend Development',
        code: 'CS401',
        half: 'H1'
      });

      await module.update({ isActive: false });

      const inactiveModule = await Module.findByPk(module.id);
      expect(inactiveModule.isActive).toBe(false);
    });
  });
}); 