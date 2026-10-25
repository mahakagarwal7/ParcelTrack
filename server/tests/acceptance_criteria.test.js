import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { HostelPolicy } from '../src/models/HostelPolicy.js';
import { Parcel } from '../src/models/Parcel.js';
import { Authorization } from '../src/models/Authorization.js';
import { DeliveryAttempt } from '../src/models/DeliveryAttempt.js';
import { Otp } from '../src/models/Otp.js';
import { ActivityLog } from '../src/models/ActivityLog.js';
import { seedDatabase } from '../src/seed/seedData.js';

describe('Phase 10: Complete System Acceptance Criteria (Section N)', () => {
  let seeded;
  let studentToken;
  let guardToken;
  let wardenToken;
  let adminToken;
  let externalGuardToken;
  let externalWardenToken;

  beforeAll(async () => {
    await connectDB();
    seeded = await seedDatabase();

    // Login users to acquire tokens
    const [sRes, gRes, wRes, aRes] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'student@hostel.edu', password: 'password123' }),
      request(app).post('/api/auth/login').send({ email: 'guard@hostel.edu', password: 'password123' }),
      request(app).post('/api/auth/login').send({ email: 'warden@hostel.edu', password: 'password123' }),
      request(app).post('/api/auth/login').send({ email: 'admin@hostel.edu', password: 'password123' }),
    ]);

    studentToken = sRes.body.token;
    guardToken = gRes.body.token;
    wardenToken = wRes.body.token;
    adminToken = aRes.body.token;

    // Register a guard and warden in a different hostel (GH-9)
    const [extG, extW] = await Promise.all([
      request(app).post('/api/auth/register').send({
        name: 'Guard Ext',
        email: 'guard.ext@hostel.edu',
        password: 'password123',
        role: 'GUARD',
        hostelId: 'GH-9',
      }),
      request(app).post('/api/auth/register').send({
        name: 'Warden Ext',
        email: 'warden.ext@hostel.edu',
        password: 'password123',
        role: 'WARDEN',
        hostelId: 'GH-9',
      }),
    ]);
    externalGuardToken = extG.body.token;
    externalWardenToken = extW.body.token;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  // Criterion 1: Student registers an expected parcel
  it('Criterion 1: Student registers an expected parcel', async () => {
    const res = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        courierName: 'Amazon',
        trackingNumber: 'AC-TEST-01',
        description: 'Semester Project Hardware',
        consent: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.parcel.courierName).toBe('Amazon');
  });

  // Criterion 2: Individual approval is required and warden approves
  it('Criterion 2: Individual approval is required and warden approves', async () => {
    await HostelPolicy.findOneAndUpdate({ hostelId: 'BH-1' }, { mode: 'INDIVIDUAL_APPROVAL' });

    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'DHL', trackingNumber: 'AC-TEST-02', consent: true });

    const authId = reg.body.data.authorization._id;
    const parcelId = reg.body.data.parcel._id;
    expect(reg.body.data.authorization.status).toBe('PENDING_WARDEN');

    const approve = await request(app)
      .post(`/api/authorizations/${authId}/warden-decision`)
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({ decision: 'APPROVE', comments: 'Approved' });

    expect(approve.statusCode).toBe(200);
    expect(approve.body.authorization.status).toBe('AUTHORIZED');

    const parcelCheck = await request(app)
      .get(`/api/parcels/${parcelId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(parcelCheck.body.parcel.status).toBe('AUTHORIZED');
  });

  // Criterion 3: Warden rejects a request
  it('Criterion 3: Warden rejects a request', async () => {
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'Bluedart', trackingNumber: 'AC-TEST-03', consent: true });

    const authId = reg.body.data.authorization._id;

    const reject = await request(app)
      .post(`/api/authorizations/${authId}/warden-decision`)
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({ decision: 'REJECT', comments: 'Prohibited goods' });

    expect(reject.statusCode).toBe(200);
    expect(reject.body.authorization.status).toBe('REJECTED');
  });

  // Criterion 4: Standing permission allows reception only with active student consent
  it('Criterion 4: Standing permission allows reception only with active student consent', async () => {
    await HostelPolicy.findOneAndUpdate({ hostelId: 'BH-1' }, { mode: 'STANDING_PERMISSION' });

    // With active consent -> auto-authorized
    const regConsent = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'FedEx', trackingNumber: 'AC-TEST-04A', consent: true });
    expect(regConsent.body.data.authorization.status).toBe('AUTHORIZED');

    // Without active consent -> pending student consent
    const regNoConsent = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'FedEx', trackingNumber: 'AC-TEST-04B', consent: false });
    expect(regNoConsent.body.data.authorization.status).toBe('PENDING_STUDENT');
  });

  // Criterion 5: Hybrid policy applies an individual approval exception
  it('Criterion 5: Hybrid policy applies an individual approval exception', async () => {
    await HostelPolicy.findOneAndUpdate(
      { hostelId: 'BH-1' },
      { mode: 'HYBRID', requireWardenApprovalFor: ['HIGH_VALUE'] }
    );

    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        courierName: 'Delhivery',
        trackingNumber: 'AC-TEST-05',
        isHighValue: true, // Triggers exception!
        consent: true,
      });

    expect(reg.body.data.authorization.status).toBe('PENDING_WARDEN');
  });

  // Criterion 6: Guard attempts reception without authorization
  it('Criterion 6: Guard attempts reception without authorization', async () => {
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'Delhivery', trackingNumber: 'AC-TEST-06', isHighValue: true, consent: true });

    const unauthParcelId = reg.body.data.parcel._id;

    const res = await request(app)
      .post(`/api/parcels/${unauthParcelId}/receive`)
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ storageLocation: 'Shelf 1' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Must be AUTHORIZED');
  });

  // Criterion 7: Guard attempts to receive a parcel belonging to another hostel
  it('Criterion 7: Guard attempts to receive a parcel belonging to another hostel', async () => {
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'Amazon', trackingNumber: 'AC-TEST-07', consent: true });

    const parcelId = reg.body.data.parcel._id;

    // External guard tries to receive
    const res = await request(app)
      .post(`/api/parcels/${parcelId}/receive`)
      .set('Authorization', `Bearer ${externalGuardToken}`)
      .send({ storageLocation: 'Shelf Ext' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('You cannot accept parcels for another hostel');
  });

  // Criterion 8: Unexpected delivery request is approved by the student
  it('Criterion 8: Unexpected delivery request is approved by the student', async () => {
    await HostelPolicy.findOneAndUpdate({ hostelId: 'BH-1' }, { mode: 'STANDING_PERMISSION' });

    const attempt = await request(app)
      .post('/api/delivery-attempts')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ studentId: seeded.student._id, courierName: 'Shadowfax', trackingNumber: 'AC-TEST-08' });

    const authId = attempt.body.data.authorization._id;
    const attemptId = attempt.body.data.deliveryAttempt._id;

    const approve = await request(app)
      .post(`/api/authorizations/${authId}/student-decision`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ decision: 'GRANT' });

    expect(approve.statusCode).toBe(200);

    const check = await request(app)
      .get(`/api/delivery-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${guardToken}`);
    expect(check.body.deliveryAttempt.status).toBe('ACCEPTED');
  });

  // Criterion 9: Student rejects an unexpected delivery
  it('Criterion 9: Student rejects an unexpected delivery', async () => {
    const attempt = await request(app)
      .post('/api/delivery-attempts')
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ studentId: seeded.student._id, courierName: 'DTDC', trackingNumber: 'AC-TEST-09' });

    const authId = attempt.body.data.authorization._id;
    const attemptId = attempt.body.data.deliveryAttempt._id;

    const reject = await request(app)
      .post(`/api/authorizations/${authId}/student-decision`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ decision: 'REJECT' });

    expect(reject.statusCode).toBe(200);

    const check = await request(app)
      .get(`/api/delivery-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${guardToken}`);
    expect(check.body.deliveryAttempt.status).toBe('DENIED');
  });

  // Criterion 10: OTP is valid and collection succeeds
  it('Criterion 10: OTP is valid and collection succeeds', async () => {
    // Register & receive a parcel
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'Ecom', trackingNumber: 'AC-TEST-10', consent: true });
    const pId = reg.body.data.parcel._id;

    await request(app).post(`/api/parcels/${pId}/receive`).set('Authorization', `Bearer ${guardToken}`).send({ storageLocation: 'Desk' });

    const otpRes = await request(app).post(`/api/parcels/${pId}/collection-otp`).set('Authorization', `Bearer ${studentToken}`);
    const otp = otpRes.body.otp;

    const collectRes = await request(app)
      .post(`/api/parcels/${pId}/collect`)
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ otp });

    expect(collectRes.statusCode).toBe(200);
    expect(collectRes.body.parcel.status).toBe('COLLECTED');
  });

  // Criterion 11: Expired OTP is rejected
  it('Criterion 11: Expired OTP is rejected', async () => {
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'Ecom', trackingNumber: 'AC-TEST-11', consent: true });
    const pId = reg.body.data.parcel._id;
    await request(app).post(`/api/parcels/${pId}/receive`).set('Authorization', `Bearer ${guardToken}`).send({ storageLocation: 'Desk' });

    const otpRes = await request(app).post(`/api/parcels/${pId}/collection-otp`).set('Authorization', `Bearer ${studentToken}`);
    const otp = otpRes.body.otp;

    // Force expiration in DB
    await Otp.findOneAndUpdate({ parcelId: pId, isUsed: false }, { expiresAt: new Date(Date.now() - 5000) });

    const collectRes = await request(app)
      .post(`/api/parcels/${pId}/collect`)
      .set('Authorization', `Bearer ${guardToken}`)
      .send({ otp });

    expect(collectRes.statusCode).toBe(400);
    expect(collectRes.body.message).toContain('Collection OTP has expired');
  });

  // Criterion 12: Reused OTP is rejected
  it('Criterion 12: Reused OTP is rejected', async () => {
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'Ecom', trackingNumber: 'AC-TEST-12', consent: true });
    const pId = reg.body.data.parcel._id;
    await request(app).post(`/api/parcels/${pId}/receive`).set('Authorization', `Bearer ${guardToken}`).send({ storageLocation: 'Desk' });

    const otpRes = await request(app).post(`/api/parcels/${pId}/collection-otp`).set('Authorization', `Bearer ${studentToken}`);
    const otp = otpRes.body.otp;

    // Collect first time
    await request(app).post(`/api/parcels/${pId}/collect`).set('Authorization', `Bearer ${guardToken}`).send({ otp });

    // Attempt reuse
    const reuse = await request(app).post(`/api/parcels/${pId}/collect`).set('Authorization', `Bearer ${guardToken}`).send({ otp });
    expect(reuse.statusCode).toBe(400);
    expect(reuse.body.message).toContain('Parcel has already been collected');
  });

  // Criterion 13: Two collection requests cannot collect the same parcel twice
  it('Criterion 13: Two collection requests cannot collect the same parcel twice (Atomic lock)', async () => {
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'Ecom', trackingNumber: 'AC-TEST-13', consent: true });
    const pId = reg.body.data.parcel._id;
    await request(app).post(`/api/parcels/${pId}/receive`).set('Authorization', `Bearer ${guardToken}`).send({ storageLocation: 'Desk' });

    const otpRes = await request(app).post(`/api/parcels/${pId}/collection-otp`).set('Authorization', `Bearer ${studentToken}`);
    const otp = otpRes.body.otp;

    // Simulate concurrent double collection
    const [c1, c2] = await Promise.all([
      request(app).post(`/api/parcels/${pId}/collect`).set('Authorization', `Bearer ${guardToken}`).send({ otp }),
      request(app).post(`/api/parcels/${pId}/collect`).set('Authorization', `Bearer ${guardToken}`).send({ otp }),
    ]);

    const statuses = [c1.statusCode, c2.statusCode].sort();
    expect(statuses).toEqual([200, 409]); // Exactly one succeeds (200), duplicate fails with 409 Conflict!
  });

  // Criterion 14: Student cannot access another student's parcel
  it("Criterion 14: Student cannot access another student's parcel", async () => {
    // Create Student B
    const sB = await request(app).post('/api/auth/register').send({
      name: 'Student B',
      email: 'student.b@hostel.edu',
      password: 'password123',
      role: 'STUDENT',
      hostelId: 'BH-1',
    });
    const sBToken = sB.body.token;

    // Student A parcel
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'Private', trackingNumber: 'AC-TEST-14', consent: true });
    const pId = reg.body.data.parcel._id;

    // Student B attempts to read Student A parcel
    const res = await request(app).get(`/api/parcels/${pId}`).set('Authorization', `Bearer ${sBToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('not authorized to view this parcel');
  });

  // Criterion 15: Warden cannot modify another hostel's policy
  it("Criterion 15: Warden cannot modify another hostel's policy", async () => {
    const res = await request(app)
      .patch('/api/hostel/policy')
      .set('Authorization', `Bearer ${externalWardenToken}`)
      .send({ hostelId: 'BH-1', mode: 'INDIVIDUAL_APPROVAL' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('Unauthorized: You cannot access or modify resources belonging to hostel');
  });

  // Criterion 16: Activity log is created for important actions
  it('Criterion 16: Activity log is created for important actions', async () => {
    const reg = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courierName: 'AuditMe', trackingNumber: 'AC-TEST-16', consent: true });
    const pId = reg.body.data.parcel._id;

    const logRes = await request(app)
      .get(`/api/activity-logs?parcelId=${pId}`)
      .set('Authorization', `Bearer ${guardToken}`);

    expect(logRes.statusCode).toBe(200);
    expect(logRes.body.logs.length).toBeGreaterThan(0);
    expect(logRes.body.logs[0].action).toBe('PARCEL_REGISTERED');
  });
});
