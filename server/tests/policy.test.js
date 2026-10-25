import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { HostelPolicy } from '../src/models/HostelPolicy.js';
import * as policyService from '../src/services/policyService.js';

describe('Phase 3: Hostel Policy Model & Evaluation Service Tests', () => {
  let studentToken;
  let studentUser;
  let wardenTokenBH1;
  let wardenUserBH1;
  let wardenTokenGH2;
  let wardenUserGH2;

  beforeAll(async () => {
    await connectDB();

    // Register student in BH-1
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Aman Verma',
        email: 'aman.verma@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'BH-1',
        studentId: 'STU201',
        roomNumber: 'B-101',
      });
    studentToken = studentRes.body.token;
    studentUser = studentRes.body.user;

    // Register warden in BH-1
    const wardenRes1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Ramesh Sharma',
        email: 'ramesh.warden@hostel.edu',
        password: 'wardenPassword123',
        role: 'WARDEN',
        hostelId: 'BH-1',
      });
    wardenTokenBH1 = wardenRes1.body.token;
    wardenUserBH1 = wardenRes1.body.user;

    // Register warden in GH-2
    const wardenRes2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Anita Desai',
        email: 'anita.warden@hostel.edu',
        password: 'wardenPassword123',
        role: 'WARDEN',
        hostelId: 'GH-2',
      });
    wardenTokenGH2 = wardenRes2.body.token;
    wardenUserGH2 = wardenRes2.body.user;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await HostelPolicy.deleteMany({});
    await disconnectDB();
  });

  describe('Hostel Policy Fetch & Default Creation (GET /api/hostel/policy)', () => {
    it('should retrieve default policy if none exists yet', async () => {
      const res = await request(app)
        .get('/api/hostel/policy')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.policy).toBeDefined();
      expect(res.body.policy.hostelId).toBe('BH-1');
      expect(res.body.policy.mode).toBe('INDIVIDUAL_APPROVAL');
      expect(res.body.policy.maxStorageDays).toBe(7);
      expect(res.body.policy.allowCOD).toBe(false);
    });
  });

  describe('Hostel Policy Update (PATCH /api/hostel/policy)', () => {
    it('should allow WARDEN of BH-1 to update policy to STANDING_PERMISSION', async () => {
      const res = await request(app)
        .patch('/api/hostel/policy')
        .set('Authorization', `Bearer ${wardenTokenBH1}`)
        .send({
          hostelId: 'BH-1',
          mode: 'STANDING_PERMISSION',
          allowCOD: true,
          maxStorageDays: 14,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.policy.mode).toBe('STANDING_PERMISSION');
      expect(res.body.policy.allowCOD).toBe(true);
      expect(res.body.policy.maxStorageDays).toBe(14);
      expect(res.body.policy.updatedBy).toBeDefined();
    });

    it('should block STUDENT from updating policy with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/hostel/policy')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ mode: 'STANDING_PERMISSION' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should block WARDEN of GH-2 from updating BH-1 policy with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/hostel/policy')
        .set('Authorization', `Bearer ${wardenTokenGH2}`)
        .send({
          hostelId: 'BH-1',
          mode: 'HYBRID',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized: You cannot access or modify resources belonging to hostel');
    });

    it('should allow WARDEN of BH-1 to update policy to HYBRID mode with exceptions', async () => {
      const res = await request(app)
        .patch('/api/hostel/policy')
        .set('Authorization', `Bearer ${wardenTokenBH1}`)
        .send({
          hostelId: 'BH-1',
          mode: 'HYBRID',
          requireWardenApprovalFor: ['HIGH_VALUE', 'OVERSIZED', 'COD'],
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.policy.mode).toBe('HYBRID');
      expect(res.body.policy.requireWardenApprovalFor).toEqual(
        expect.arrayContaining(['HIGH_VALUE', 'OVERSIZED', 'COD'])
      );
    });
  });

  describe('Policy Evaluation Logic (evaluateAuthorizationNeed)', () => {
    it('INDIVIDUAL_APPROVAL mode: always requires warden approval', async () => {
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'INDIVIDUAL_APPROVAL' }
      );

      const evalResult = await policyService.evaluateAuthorizationNeed({
        hostelId: 'BH-1',
        student: studentUser,
        parcelDetails: { isHighValue: false, isOversized: false },
      });

      expect(evalResult.requiresStudentConsent).toBe(true);
      expect(evalResult.requiresWardenApproval).toBe(true);
      expect(evalResult.policyMode).toBe('INDIVIDUAL_APPROVAL');
    });

    it('STANDING_PERMISSION mode: does not require warden approval for normal student', async () => {
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'STANDING_PERMISSION' }
      );

      const evalResult = await policyService.evaluateAuthorizationNeed({
        hostelId: 'BH-1',
        student: studentUser,
        parcelDetails: { isHighValue: false },
      });

      expect(evalResult.requiresStudentConsent).toBe(true);
      expect(evalResult.requiresWardenApproval).toBe(false);
      expect(evalResult.policyMode).toBe('STANDING_PERMISSION');
    });

    it('STANDING_PERMISSION mode: requires warden approval when student standing permission is suspended', async () => {
      const suspendedStudent = { ...studentUser, standingPermissionSuspended: true };

      const evalResult = await policyService.evaluateAuthorizationNeed({
        hostelId: 'BH-1',
        student: suspendedStudent,
        parcelDetails: { isHighValue: false },
      });

      expect(evalResult.requiresStudentConsent).toBe(true);
      expect(evalResult.requiresWardenApproval).toBe(true);
      expect(evalResult.reason).toContain('suspended');
    });

    it('HYBRID mode: does not require warden approval for standard parcel', async () => {
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'HYBRID', requireWardenApprovalFor: ['HIGH_VALUE', 'OVERSIZED'] }
      );

      const evalResult = await policyService.evaluateAuthorizationNeed({
        hostelId: 'BH-1',
        student: studentUser,
        parcelDetails: { isHighValue: false, isOversized: false },
      });

      expect(evalResult.requiresStudentConsent).toBe(true);
      expect(evalResult.requiresWardenApproval).toBe(false);
    });

    it('HYBRID mode: requires warden approval when exception rule is triggered (e.g., HIGH_VALUE)', async () => {
      const evalResult = await policyService.evaluateAuthorizationNeed({
        hostelId: 'BH-1',
        student: studentUser,
        parcelDetails: { isHighValue: true, isOversized: false },
      });

      expect(evalResult.requiresStudentConsent).toBe(true);
      expect(evalResult.requiresWardenApproval).toBe(true);
      expect(evalResult.reason).toContain('High value item');
    });
  });

  describe('Standing Permission Suspension Management', () => {
    it('should allow WARDEN to suspend a student standing permission', async () => {
      const res = await request(app)
        .patch(`/api/hostel/students/${studentUser._id}/suspension`)
        .set('Authorization', `Bearer ${wardenTokenBH1}`)
        .send({ isSuspended: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.student.standingPermissionSuspended).toBe(true);
    });

    it('should prevent WARDEN of GH-2 from managing student of BH-1 with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/hostel/students/${studentUser._id}/suspension`)
        .set('Authorization', `Bearer ${wardenTokenGH2}`)
        .send({ isSuspended: false });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('You can only manage students in your assigned hostel');
    });

    it('should allow WARDEN of BH-1 to restore student standing permission', async () => {
      const res = await request(app)
        .patch(`/api/hostel/students/${studentUser._id}/suspension`)
        .set('Authorization', `Bearer ${wardenTokenBH1}`)
        .send({ isSuspended: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.student.standingPermissionSuspended).toBe(false);
    });
  });
});
