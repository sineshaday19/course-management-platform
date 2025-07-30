const { ValidationError, NotFoundError, AuthorizationError } = require('../../middleware/errorHandler');

describe('Custom Error Classes', () => {
  describe('ValidationError', () => {
    it('should create a ValidationError with message', () => {
      const message = 'Invalid input data';
      const error = new ValidationError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe(message);
    });

    it('should create a ValidationError without message', () => {
      const error = new ValidationError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with message', () => {
      const message = 'Resource not found';
      const error = new NotFoundError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe(message);
    });

    it('should create a NotFoundError without message', () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('AuthorizationError', () => {
    it('should create an AuthorizationError with message', () => {
      const message = 'Access denied';
      const error = new AuthorizationError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.name).toBe('AuthorizationError');
      expect(error.message).toBe(message);
    });

    it('should create an AuthorizationError without message', () => {
      const error = new AuthorizationError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.name).toBe('AuthorizationError');
    });
  });
});

describe('Email Validation', () => {
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  it('should validate correct email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      '123@numbers.com',
      'user@subdomain.example.com'
    ];

    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'user@',
      'user@.com',
      'user..name@example.com',
      'user@example..com',
      '',
      'user name@example.com',
      'user@example'
    ];

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});

describe('Password Validation', () => {
  const isValidPassword = (password) => {
    return password && password.length >= 6;
  };

  it('should validate correct passwords', () => {
    const validPasswords = [
      'password123',
      '123456',
      'abcdef',
      'P@ssw0rd',
      'verylongpassword123'
    ];

    validPasswords.forEach(password => {
      expect(isValidPassword(password)).toBe(true);
    });
  });

  it('should reject invalid passwords', () => {
    const invalidPasswords = [
      '12345',
      'pass',
      '',
      null,
      undefined
    ];

    invalidPasswords.forEach(password => {
      expect(isValidPassword(password)).toBe(false);
    });
  });
});

describe('UUID Validation', () => {
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  it('should validate correct UUIDs', () => {
    const validUUIDs = [
      '123e4567-e89b-12d3-a456-426614174000',
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      '6ba7b812-9dad-11d1-80b4-00c04fd430c8'
    ];

    validUUIDs.forEach(uuid => {
      expect(isValidUUID(uuid)).toBe(true);
    });
  });

  it('should reject invalid UUIDs', () => {
    const invalidUUIDs = [
      'not-a-uuid',
      '123e4567-e89b-12d3-a456-42661417400',
      '123e4567-e89b-12d3-a456-4266141740000',
      '123e4567-e89b-12d3-a456-42661417400g',
      '',
      null,
      undefined
    ];

    invalidUUIDs.forEach(uuid => {
      expect(isValidUUID(uuid)).toBe(false);
    });
  });
});

describe('Date Validation', () => {
  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  it('should validate correct dates', () => {
    const validDates = [
      '2024-01-01',
      '2024-12-31',
      '2024-02-29',
      '2023-06-15',
      '2025-03-20'
    ];

    validDates.forEach(date => {
      expect(isValidDate(date)).toBe(true);
    });
  });

  it('should reject invalid dates', () => {
    const invalidDates = [
      '2024-13-01',
      '2024-02-30',
      '2024-04-31',
      'not-a-date',
      '2024/01/01',
      '',
      null,
      undefined
    ];

    invalidDates.forEach(date => {
      expect(isValidDate(date)).toBe(false);
    });
  });
});

describe('Integer Range Validation', () => {
  const isInRange = (value, min, max) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max;
  };

  it('should validate numbers within range', () => {
    expect(isInRange(5, 1, 10)).toBe(true);
    expect(isInRange(1, 1, 10)).toBe(true);
    expect(isInRange(10, 1, 10)).toBe(true);
    expect(isInRange(0, 0, 100)).toBe(true);
    expect(isInRange(100, 0, 100)).toBe(true);
  });

  it('should reject numbers outside range', () => {
    expect(isInRange(0, 1, 10)).toBe(false);
    expect(isInRange(11, 1, 10)).toBe(false);
    expect(isInRange(-1, 0, 100)).toBe(false);
    expect(isInRange(101, 0, 100)).toBe(false);
  });

  it('should reject non-numeric values', () => {
    expect(isInRange('abc', 1, 10)).toBe(false);
    expect(isInRange('', 1, 10)).toBe(false);
    expect(isInRange(null, 1, 10)).toBe(false);
    expect(isInRange(undefined, 1, 10)).toBe(false);
  });
}); 