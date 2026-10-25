import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { HostelPolicy } from '../src/models/HostelPolicy.js';
import { Parcel } from '../src/models/Parcel.js';
import { Otp } from '../src/models/Otp.js';
import { Authorization } from '../src/models/Authorization.js';

describe('Phase 8: Single-Use Cryptographic OTP & Secure Handover Tests', () => {
  let student1Token;
  let student1User;
  let student2Token;
  let guardTokenBH1;
  let guardUserBH1;
  let guardTokenGH2;
  let receivedParcelId;

  beforeAll(async () => {
    await connectDB();

    // Register Student 1 in BH-1
    const s1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Aditya Roy',
        email: 'aditya.roy@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'BH-1',
        studentId: 'STU601',
        roomNumber: 'E-101',
      });
    student1Token = s1.body.token;
    student1User = s1.body.user;

    // Register Student 2 in BH-1
    const s2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Nikhil Sen',
        email: 'nikhil.sen@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'BH-1',
        studentId: 'STU602',
        roomNumber: 'E-102',
      });
    student2Token = s2.body.token;

    // Register Guard in BH-1
    const g1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Om Prakash (Security)',
        email: 'omprakash.guard@hostel.edu',
        password: 'guardPassword123',
        role: 'GUARD',
        hostelId: 'BH-1',
      });
    guardTokenBH1 = g1.body.token;
    guardUserBH1 = g1.body.user;

    // Register Guard in GH-2
    const g2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kishore Guard (GH-2)',
        email: 'kishore.guard@hostel.edu',
        password: 'guardPassword123',
        role: 'GUARD',
        hostelId: 'GH-2',
      });
    guardTokenGH2 = g2.body.token;

    // Setup standing permission in BH-1
    await HostelPolicy.findOneAndUpdate(
      { hostelId: 'BH-1' },
      { mode: 'STANDING_PERMISSION' },
      { upsert: true }
    );

    // Register an expected parcel and have the guard receive it into custody
    const regRes = await request(app)
      .post('/api/parcels')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        courierName: 'Bluedart',
        trackingNumber: 'BD-COLLECT-01',
        description: 'Semester 5 Laptop Stand',
        consent: true,
      });

    const createdParcelId = regRes.body.data.parcel._id;

    // Guard receives physical parcel at gate
    const recRes = await request(app)
      .post(`/api/parcels/${createdParcelId}/receive`)
      .set('Authorization', `Bearer ${guardTokenBH1}`)
      .send({ storageLocation: 'Locker Shelf C-1' });

    receivedParcelId = recRes.body.parcel._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await HostelPolicy.deleteMany({});
    await Parcel.deleteMany({});
    await Otp.deleteMany({});
    await Authorization.deleteMany({});
    await disconnectDB();
  });

  describe('OTP Generation (POST /api/parcels/:id/collection-otp)', () => {
    it('should generate a 6-digit OTP for a RECEIVED parcel and store only the salted hash', async () => {
      const res = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collection-otp`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.otp).toMatch(/^\d{6}$/); // 6-digit numeric OTP
      expect(res.body.expiresAt).toBeDefined();

      // Verify that database DOES NOT store plaintext OTP
      const otpInDb = await Otp.findOne({ parcelId: receivedParcelId, isUsed: false });
      expect(otpInDb).toBeDefined();
      expect(otpInDb.otpHash).toBeDefined();
      expect(otpInDb.salt).toBeDefined();
      expect(otpInDb.otp).toBeUndefined(); // Plaintext OTP must NEVER exist on the document
    });

    it('should FORBID Student 2 from generating OTP for Student 1 parcel (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collection-otp`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('You can only generate collection OTP for your own parcel');
    });

    it('should REJECT OTP generation for a parcel not yet RECEIVED by guard (Invariant check)', async () => {
      // Register an unreceived expected parcel
      const regRes = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'Delhivery',
          trackingNumber: 'DEL-UNRECEIVED',
          consent: true,
        });

      const unreceivedId = regRes.body.data.parcel._id;

      const res = await request(app)
        .post(`/api/parcels/${unreceivedId}/collection-otp`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('It must be physically received by a guard first');
    });
  });

  describe('OTP Verification & Handover (POST /api/parcels/:id/collect)', () => {
    let validOtp;

    beforeEach(async () => {
      // Generate a fresh OTP for receivedParcelId
      const res = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collection-otp`)
        .set('Authorization', `Bearer ${student1Token}`);
      validOtp = res.body.otp;
    });

    it('should reject wrong OTP and decrement attempts remaining', async () => {
      const res = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp: '000000' }); // Deliberately incorrect OTP

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Incorrect OTP');
      expect(res.body.message).toContain('attempt(s) remaining');
    });

    it('should invalidate OTP after 3 incorrect attempts (rate limiting)', async () => {
      // Attempt 1
      await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp: '111111' });

      // Attempt 2
      await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp: '222222' });

      // Attempt 3 (Max attempts reached)
      const res3 = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp: '333333' });

      expect(res3.statusCode).toBe(400);
      expect(res3.body.message).toContain('Maximum attempts reached');

      // Attempt 4: Even with the correct OTP, it must now be rejected because it was invalidated!
      const res4 = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp: validOtp });

      expect(res4.statusCode).toBe(400);
      expect(res4.body.message).toContain('No active collection OTP found');
    });

    it('should reject an EXPIRED OTP', async () => {
      // Manually set OTP expiresAt in past
      await Otp.findOneAndUpdate(
        { parcelId: receivedParcelId, isUsed: false },
        { expiresAt: new Date(Date.now() - 60000) } // 1 minute in the past
      );

      const res = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp: validOtp });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Collection OTP has expired');
    });

    it('should FORBID guard from GH-2 from collecting parcel of BH-1 (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenGH2}`)
        .send({ otp: validOtp });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('You can only perform parcel handovers within your assigned hostel');
    });

    it('should successfully verify valid OTP, mark parcel COLLECTED, and invalidate OTP', async () => {
      const res = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp: validOtp });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.parcel.status).toBe('COLLECTED');
      expect(res.body.parcel.collectedBy).toBeDefined();
      expect(res.body.parcel.collectedAt).toBeDefined();

      // Check OTP document is marked as used
      const otpInDb = await Otp.findOne({ parcelId: receivedParcelId });
      expect(otpInDb.isUsed).toBe(true);
      expect(otpInDb.usedAt).toBeDefined();

      // Invariant: Single-use check — cannot reuse the same OTP again
      const replayRes = await request(app)
        .post(`/api/parcels/${receivedParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp: validOtp });

      expect(replayRes.statusCode).toBe(400);
      expect(replayRes.body.message).toContain('Parcel has already been collected');
    });
  });
});
