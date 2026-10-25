import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { HostelPolicy } from '../src/models/HostelPolicy.js';
import { DeliveryAttempt } from '../src/models/DeliveryAttempt.js';
import { Authorization } from '../src/models/Authorization.js';

describe('Phase 5: Unexpected Delivery Attempt Workflow & Guard Search Tests', () => {
  let student1Token;
  let student1User;
  let student2Token;
  let student2User;
  let guardTokenBH1;
  let guardUserBH1;
  let guardTokenGH2;
  let wardenTokenBH1;

  beforeAll(async () => {
    await connectDB();

    // Register Student 1 (BH-1)
    const s1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Karan Mehra',
        email: 'karan.mehra@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'BH-1',
        studentId: 'STU401',
        roomNumber: 'C-201',
      });
    student1Token = s1.body.token;
    student1User = s1.body.user;

    // Register Student 2 (GH-2)
    const s2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Pooja Hegde',
        email: 'pooja.hegde@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'GH-2',
        studentId: 'STU402',
        roomNumber: 'G-101',
      });
    student2Token = s2.body.token;
    student2User = s2.body.user;

    // Register Guard (BH-1)
    const g1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ram Singh (Security)',
        email: 'ram.guard@hostel.edu',
        password: 'guardPassword123',
        role: 'GUARD',
        hostelId: 'BH-1',
      });
    guardTokenBH1 = g1.body.token;
    guardUserBH1 = g1.body.user;

    // Register Guard (GH-2)
    const g2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Baldev Singh (Security)',
        email: 'baldev.guard@hostel.edu',
        password: 'guardPassword123',
        role: 'GUARD',
        hostelId: 'GH-2',
      });
    guardTokenGH2 = g2.body.token;

    // Register Warden (BH-1)
    const w1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Alok Nath',
        email: 'alok.warden@hostel.edu',
        password: 'wardenPassword123',
        role: 'WARDEN',
        hostelId: 'BH-1',
      });
    wardenTokenBH1 = w1.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await HostelPolicy.deleteMany({});
    await DeliveryAttempt.deleteMany({});
    await Authorization.deleteMany({});
    await disconnectDB();
  });

  describe('Guard Student Search (GET /api/delivery-attempts/students/search)', () => {
    it('should allow Guard of BH-1 to search and find Student 1 by room number C-201', async () => {
      const res = await request(app)
        .get('/api/delivery-attempts/students/search?query=C-201')
        .set('Authorization', `Bearer ${guardTokenBH1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.students.length).toBe(1);
      expect(res.body.students[0].email).toBe(student1User.email);
    });

    it('should NOT return students from another hostel (GH-2) to Guard of BH-1', async () => {
      const res = await request(app)
        .get('/api/delivery-attempts/students/search?query=Pooja')
        .set('Authorization', `Bearer ${guardTokenBH1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.students.length).toBe(0); // Cross-hostel student not exposed
    });

    it('should forbid STUDENT from accessing guard student search with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/delivery-attempts/students/search?query=Karan')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Unexpected Delivery Attempt Registration', () => {
    it('should allow Guard of BH-1 to create an unexpected delivery attempt for Student 1', async () => {
      // Set policy of BH-1 to STANDING_PERMISSION
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'STANDING_PERMISSION' },
        { upsert: true }
      );

      const res = await request(app)
        .post('/api/delivery-attempts')
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({
          studentId: student1User._id,
          courierName: 'Shadowfax',
          trackingNumber: 'SFX1234567',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deliveryAttempt).toBeDefined();
      expect(res.body.data.deliveryAttempt.status).toBe('AWAITING_AUTHORIZATION');
      expect(res.body.data.authorization.status).toBe('PENDING_STUDENT');
    });

    it('should block Guard of GH-2 from creating delivery attempt for student in BH-1 with 403', async () => {
      const res = await request(app)
        .post('/api/delivery-attempts')
        .set('Authorization', `Bearer ${guardTokenGH2}`)
        .send({
          studentId: student1User._id,
          courierName: 'DTDC',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Guard cannot create delivery attempts for another hostel');
    });
  });

  describe('Student Authorization Decision on Unexpected Delivery', () => {
    let attemptAuthId;
    let attemptId;

    beforeEach(async () => {
      // Set policy to STANDING_PERMISSION
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'STANDING_PERMISSION' },
        { upsert: true }
      );

      const res = await request(app)
        .post('/api/delivery-attempts')
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({
          studentId: student1User._id,
          courierName: 'Ecom Express',
          trackingNumber: 'ECOM889900',
        });

      attemptAuthId = res.body.data.authorization._id;
      attemptId = res.body.data.deliveryAttempt._id;
    });

    it('should mark delivery attempt ACCEPTED when student grants consent under STANDING_PERMISSION', async () => {
      const res = await request(app)
        .post(`/api/authorizations/${attemptAuthId}/student-decision`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ decision: 'GRANT' });

      expect(res.statusCode).toBe(200);
      expect(res.body.authorization.status).toBe('AUTHORIZED');

      // Verify delivery attempt was updated to ACCEPTED
      const attemptCheck = await request(app)
        .get(`/api/delivery-attempts/${attemptId}`)
        .set('Authorization', `Bearer ${guardTokenBH1}`);

      expect(attemptCheck.body.deliveryAttempt.status).toBe('ACCEPTED');
    });

    it('should mark delivery attempt DENIED when student rejects delivery', async () => {
      const res = await request(app)
        .post(`/api/authorizations/${attemptAuthId}/student-decision`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ decision: 'REJECT' });

      expect(res.statusCode).toBe(200);
      expect(res.body.authorization.status).toBe('REJECTED');

      // Verify delivery attempt was updated to DENIED
      const attemptCheck = await request(app)
        .get(`/api/delivery-attempts/${attemptId}`)
        .set('Authorization', `Bearer ${guardTokenBH1}`);

      expect(attemptCheck.body.deliveryAttempt.status).toBe('DENIED');
      expect(attemptCheck.body.deliveryAttempt.failureReason).toContain('rejected by recipient student');
    });
  });

  describe('Unexpected Delivery under INDIVIDUAL_APPROVAL (Warden Gate)', () => {
    it('should require Warden approval even after student grants consent under INDIVIDUAL_APPROVAL', async () => {
      // Set policy of BH-1 to INDIVIDUAL_APPROVAL
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'INDIVIDUAL_APPROVAL' },
        { upsert: true }
      );

      // 1. Guard registers attempt
      const attemptRes = await request(app)
        .post('/api/delivery-attempts')
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({
          studentId: student1User._id,
          courierName: 'FedEx',
          trackingNumber: 'FDX445566',
        });

      const authId = attemptRes.body.data.authorization._id;
      const attemptId = attemptRes.body.data.deliveryAttempt._id;

      // 2. Student grants consent
      const studentDecisionRes = await request(app)
        .post(`/api/authorizations/${authId}/student-decision`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ decision: 'GRANT' });

      expect(studentDecisionRes.body.authorization.status).toBe('PENDING_WARDEN');

      // Attempt is still AWAITING_AUTHORIZATION because warden has not approved yet
      const midCheck = await request(app)
        .get(`/api/delivery-attempts/${attemptId}`)
        .set('Authorization', `Bearer ${guardTokenBH1}`);
      expect(midCheck.body.deliveryAttempt.status).toBe('AWAITING_AUTHORIZATION');

      // 3. Warden reviews and approves
      const wardenRes = await request(app)
        .post(`/api/authorizations/${authId}/warden-decision`)
        .set('Authorization', `Bearer ${wardenTokenBH1}`)
        .send({
          decision: 'APPROVE',
          comments: 'Warden permits gate acceptance.',
        });

      expect(wardenRes.body.authorization.status).toBe('AUTHORIZED');

      // 4. Verify DeliveryAttempt is now ACCEPTED
      const finalCheck = await request(app)
        .get(`/api/delivery-attempts/${attemptId}`)
        .set('Authorization', `Bearer ${guardTokenBH1}`);

      expect(finalCheck.body.deliveryAttempt.status).toBe('ACCEPTED');
    });
  });
});
