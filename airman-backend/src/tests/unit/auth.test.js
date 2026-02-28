const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth Unit Tests', () => {
  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    test('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);
      const match = await bcrypt.compare(password, hash);
      expect(match).toBe(true);
    });

    test('should reject wrong password', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);
      const match = await bcrypt.compare('WrongPassword', hash);
      expect(match).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    const secret = 'test-secret';
    const payload = { userId: 'user-1', tenantId: 'tenant-1', role: 'STUDENT' };

    test('should generate a valid JWT', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should decode JWT with correct payload', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });
      const decoded = jwt.verify(token, secret);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.tenantId).toBe(payload.tenantId);
      expect(decoded.role).toBe(payload.role);
    });

    test('should reject tampered JWT', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => jwt.verify(tampered, secret)).toThrow();
    });

    test('should reject expired JWT', async () => {
      const token = jwt.sign(payload, secret, { expiresIn: '1ms' });
      await new Promise((r) => setTimeout(r, 10));
      expect(() => jwt.verify(token, secret)).toThrow('jwt expired');
    });
  });
});
