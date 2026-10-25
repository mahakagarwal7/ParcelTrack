import request from 'supertest';
import express from 'express';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { protect } from '../src/middleware/auth.js';
import { authorize } from '../src/middleware/role.js';
import { enforceHostelScope } from '../src/middleware/hostelScope.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

describe('Phase 2: Authentication & Role Middleware Tests', () => {
  let middlewareTestApp;

  beforeAll(async () => {
    await connectDB();

    // Isolated express app to test protect, authorize, and enforceHostelScope middlewares
    middlewareTestApp = express();
    middlewareTestApp.use(express.json());

    middlewareTestApp.get(
      '/api/test-role-warden',
      protect,
      authorize('WARDEN', 'ADMIN'),
      (req, res) => res.json({ success: true, message: 'Warden area' })
    );

    middlewareTestApp.post(
      '/api/test-hostel-scope',
      protect,
      enforceHostelScope((req) => req.body.hostelId),
      (req, res) => res.json({ success: true, message: 'Hostel matches' })
    );

    middlewareTestApp.use(errorHandler);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  const studentPayload = {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@hostel.edu',
    password: 'password123',
    role: 'STUDENT',
    hostelId: 'BH-1',
    studentId: 'STU101',
    roomNumber: 'A-204',
    phone: '9876543210',
  };

  const wardenPayload = {
    name: 'Dr. Suresh Kumar',
    email: 'suresh.warden@hostel.edu',
    password: 'wardenPassword123',
    role: 'WARDEN',
    hostelId: 'BH-1',
  };

  describe('User Registration (POST /api/auth/register)', () => {
    it('should register a new student user and return token + user object', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(studentPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(studentPayload.email);
      expect(res.body.user.role).toBe('STUDENT');
      expect(res.body.user.password).toBeUndefined(); // Password must never be returned!
    });

    it('should reject registration if email is already taken', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(studentPayload);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject registration if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Incomplete User' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('User Login (POST /api/auth/login)', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: studentPayload.email,
          password: studentPayload.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(studentPayload.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should fail login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: studentPayload.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should fail login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@hostel.edu',
          password: 'password123',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected Route & Current User (GET /api/auth/me)', () => {
    let studentToken;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: studentPayload.email,
          password: studentPayload.password,
        });
      studentToken = loginRes.body.token;
    });

    it('should allow access to /api/auth/me with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(studentPayload.email);
    });

    it('should reject access to /api/auth/me without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject access to /api/auth/me with malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Role Authorization & Hostel Scope Middleware', () => {
    let studentToken;
    let wardenToken;

    beforeAll(async () => {
      // Register warden
      const wardenRes = await request(app)
        .post('/api/auth/register')
        .send(wardenPayload);
      wardenToken = wardenRes.body.token;

      // Student token
      const studentRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: studentPayload.email,
          password: studentPayload.password,
        });
      studentToken = studentRes.body.token;
    });

    it('should block STUDENT from accessing WARDEN route with 403 Forbidden', async () => {
      const res = await request(middlewareTestApp)
        .get('/api/test-role-warden')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('is not authorized');
    });

    it('should allow WARDEN to access WARDEN route with 200 OK', async () => {
      const res = await request(middlewareTestApp)
        .get('/api/test-role-warden')
        .set('Authorization', `Bearer ${wardenToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow access when target hostelId matches user hostelId (BH-1)', async () => {
      const res = await request(middlewareTestApp)
        .post('/api/test-hostel-scope')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ hostelId: 'BH-1' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block access when target hostelId (GH-2) differs from user hostelId (BH-1) with 403', async () => {
      const res = await request(middlewareTestApp)
        .post('/api/test-hostel-scope')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ hostelId: 'GH-2' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized: You cannot access or modify resources belonging to hostel');
    });
  });
});
