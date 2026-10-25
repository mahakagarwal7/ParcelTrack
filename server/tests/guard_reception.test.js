import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { HostelPolicy } from '../src/models/HostelPolicy.js';
import { Parcel } from '../src/models/Parcel.js';
import { DeliveryAttempt } from '../src/models/DeliveryAttempt.js';
import { Authorization } from '../src/models/Authorization.js';

describe('Phase 6 & 7: Guard Physical Parcel Reception & Security Tests', () => {
  let student1Token;
  let student1User;
  let guardTokenBH1;
  let guardUserBH1;
  let guardTokenGH2;
  let wardenTokenBH1;

  beforeAll(async () => {
    await connectDB();

    // Register Student 1 in BH-1
    const s1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Rohan Joshi',
        email: 'rohan.joshi@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'BH-1',
        studentId: 'STU501',
        roomNumber: 'D-301',
      });
    student1Token = s1.body.token;
    student1User = s1.body.user;

    // Register Guard in BH-1
    const g1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sardar Singh (Guard)',
        email: 'sardar.guard@hostel.edu',
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
        name: 'Mahesh Guard (GH-2)',
        email: 'mahesh.guard@hostel.edu',
        password: 'guardPassword123',
        role: 'GUARD',
        hostelId: 'GH-2',
      });
    guardTokenGH2 = g2.body.token;

    // Register Warden in BH-1
    const w1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. S. K. Gupta',
        email: 'skgupta.warden@hostel.edu',
        password: 'wardenPassword123',
        role: 'WARDEN',
        hostelId: 'BH-1',
      });
    wardenTokenBH1 = w1.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await HostelPolicy.deleteMany({});
    await Parcel.deleteMany({});
    await DeliveryAttempt.deleteMany({});
    await Authorization.deleteMany({});
    await disconnectDB();
  });

  describe('Guard Reception of Expected Parcels', () => {
    it('should successfully record physical receipt of an AUTHORIZED expected parcel', async () => {
      // Set policy of BH-1 to STANDING_PERMISSION
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'STANDING_PERMISSION' },
        { upsert: true }
      );

      // Student registers expected parcel (auto-authorized under standing permission)
      const regRes = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'DHL Express',
          trackingNumber: 'DHL998877',
          description: 'Winter Jacket',
          consent: true,
        });

      const parcelId = regRes.body.data.parcel._id;
      expect(regRes.body.data.parcel.status).toBe('AUTHORIZED');

      // Guard records physical receipt
      const receiveRes = await request(app)
        .post(`/api/parcels/${parcelId}/receive`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({
          storageLocation: 'Locker Shelf B-4',
          remarks: 'Received safely from DHL courier partner',
        });

      expect(receiveRes.statusCode).toBe(200);
      expect(receiveRes.body.success).toBe(true);
      expect(receiveRes.body.parcel.status).toBe('RECEIVED');
      expect(receiveRes.body.parcel.storageLocation).toBe('Locker Shelf B-4');
      expect(receiveRes.body.parcel.receivedBy.toString()).toBe(guardUserBH1._id.toString());
      expect(receiveRes.body.parcel.receivedAt).toBeDefined();

      // Check status history recorded the event
      const history = receiveRes.body.parcel.statusHistory;
      expect(history.some((h) => h.status === 'RECEIVED')).toBe(true);
    });

    it('should REJECT physical receipt if parcel is NOT AUTHORIZED (Invariant check)', async () => {
      // Set policy of BH-1 to INDIVIDUAL_APPROVAL
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'INDIVIDUAL_APPROVAL' },
        { upsert: true }
      );

      // Student registers parcel (remains EXPECTED until warden approves)
      const regRes = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'FedEx',
          trackingNumber: 'FDX990011',
          consent: true,
        });

      const unauthParcelId = regRes.body.data.parcel._id;
      expect(regRes.body.data.parcel.status).toBe('EXPECTED');

      // Guard attempts physical reception before warden approves
      const receiveRes = await request(app)
        .post(`/api/parcels/${unauthParcelId}/receive`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ storageLocation: 'Shelf 1' });

      expect(receiveRes.statusCode).toBe(400);
      expect(receiveRes.body.success).toBe(false);
      expect(receiveRes.body.message).toContain('Must be AUTHORIZED');
    });

    it('should FORBID guard from GH-2 from receiving parcel of BH-1 (403 Forbidden)', async () => {
      // Create authorized parcel in BH-1
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'STANDING_PERMISSION' },
        { upsert: true }
      );

      const regRes = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'Delhivery',
          trackingNumber: 'DEL554433',
          consent: true,
        });

      const targetParcelId = regRes.body.data.parcel._id;

      // Guard of GH-2 attempts to receive
      const receiveRes = await request(app)
        .post(`/api/parcels/${targetParcelId}/receive`)
        .set('Authorization', `Bearer ${guardTokenGH2}`)
        .send({ storageLocation: 'Shelf X' });

      expect(receiveRes.statusCode).toBe(403);
      expect(receiveRes.body.success).toBe(false);
      expect(receiveRes.body.message).toContain('You cannot accept parcels for another hostel');
    });
  });

  describe('Guard Reception of Unexpected Delivery Attempts', () => {
    it('should successfully receive physical package for an ACCEPTED unexpected delivery', async () => {
      // 1. Guard creates unexpected delivery attempt
      const attemptRes = await request(app)
        .post('/api/delivery-attempts')
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({
          studentId: student1User._id,
          courierName: 'Amazon Logistics',
          trackingNumber: 'AMZ-GATE-1234',
        });

      const attemptId = attemptRes.body.data.deliveryAttempt._id;
      const authId = attemptRes.body.data.authorization._id;

      // 2. Student grants authorization
      await request(app)
        .post(`/api/authorizations/${authId}/student-decision`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ decision: 'GRANT' });

      // 3. Guard receives courier physical parcel at gate
      const receiveRes = await request(app)
        .post(`/api/delivery-attempts/${attemptId}/receive`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({
          storageLocation: 'Gate Shelf Box 3',
          remarks: 'Received from Amazon delivery executive',
        });

      expect(receiveRes.statusCode).toBe(201);
      expect(receiveRes.body.success).toBe(true);
      expect(receiveRes.body.parcel).toBeDefined();
      expect(receiveRes.body.parcel.status).toBe('RECEIVED');
      expect(receiveRes.body.parcel.parcelId).toMatch(/^PT-\d{8}-[A-F0-9]{6}$/);
      expect(receiveRes.body.parcel.storageLocation).toBe('Gate Shelf Box 3');
      expect(receiveRes.body.deliveryAttempt.status).toBe('ACCEPTED');
    });

    it('should REJECT physical reception if delivery attempt has NOT been authorized', async () => {
      // 1. Guard creates unexpected delivery attempt
      const attemptRes = await request(app)
        .post('/api/delivery-attempts')
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({
          studentId: student1User._id,
          courierName: 'SpeedPost',
          trackingNumber: 'SP12345',
        });

      const unauthAttemptId = attemptRes.body.data.deliveryAttempt._id;

      // 2. Guard attempts to receive before student authorizes
      const receiveRes = await request(app)
        .post(`/api/delivery-attempts/${unauthAttemptId}/receive`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ storageLocation: 'Shelf 1' });

      expect(receiveRes.statusCode).toBe(400);
      expect(receiveRes.body.success).toBe(false);
      expect(receiveRes.body.message).toContain('It must be AUTHORIZED');
    });
  });

  describe('Guard Active Custody Parcels & Gate Lookup', () => {
    it('should list all parcels in custody awaiting collection (GET /api/parcels/guard/active)', async () => {
      const res = await request(app)
        .get('/api/parcels/guard/active')
        .set('Authorization', `Bearer ${guardTokenBH1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.parcels.length).toBeGreaterThan(0);
      res.body.parcels.forEach((p) => {
        expect(p.status).toBe('RECEIVED');
        expect(p.hostelId).toBe('BH-1');
      });
    });

    it('should find arriving parcel details using gate lookup (GET /api/parcels/guard/lookup)', async () => {
      const res = await request(app)
        .get('/api/parcels/guard/lookup?trackingNumber=DHL998877')
        .set('Authorization', `Bearer ${guardTokenBH1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.parcels.length).toBe(1);
      expect(res.body.parcels[0].trackingNumber).toBe('DHL998877');
    });
  });
});
