import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { HostelPolicy } from '../src/models/HostelPolicy.js';
import { Parcel } from '../src/models/Parcel.js';
import { Authorization } from '../src/models/Authorization.js';

describe('Phase 4: Expected Parcel & Authorization Workflows Tests', () => {
  let student1Token;
  let student1User;
  let student2Token;
  let student2User;
  let wardenTokenBH1;
  let wardenTokenGH2;

  beforeAll(async () => {
    await connectDB();

    // Register Student 1 (BH-1)
    const stu1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Arjun Das',
        email: 'arjun.das@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'BH-1',
        studentId: 'STU301',
        roomNumber: 'A-101',
      });
    student1Token = stu1Res.body.token;
    student1User = stu1Res.body.user;

    // Register Student 2 (BH-1)
    const stu2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Vikas Roy',
        email: 'vikas.roy@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'BH-1',
        studentId: 'STU302',
        roomNumber: 'A-102',
      });
    student2Token = stu2Res.body.token;
    student2User = stu2Res.body.user;

    // Register Warden (BH-1)
    const war1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Warden Sharma',
        email: 'warden.bh1@hostel.edu',
        password: 'wardenPassword123',
        role: 'WARDEN',
        hostelId: 'BH-1',
      });
    wardenTokenBH1 = war1Res.body.token;

    // Register Warden (GH-2)
    const war2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Warden Mukherjee',
        email: 'warden.gh2@hostel.edu',
        password: 'wardenPassword123',
        role: 'WARDEN',
        hostelId: 'GH-2',
      });
    wardenTokenGH2 = war2Res.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await HostelPolicy.deleteMany({});
    await Parcel.deleteMany({});
    await Authorization.deleteMany({});
    await disconnectDB();
  });

  describe('Expected Parcel Registration under STANDING_PERMISSION', () => {
    beforeAll(async () => {
      // Set policy of BH-1 to STANDING_PERMISSION
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'STANDING_PERMISSION' },
        { upsert: true }
      );
    });

    it('should register expected parcel and automatically AUTHORIZE it with student consent', async () => {
      const res = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'BlueDart',
          trackingNumber: 'BD12345678',
          description: 'Textbooks for Semester 5',
          category: 'DOCUMENTS',
          consent: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parcel).toBeDefined();
      expect(res.body.data.parcel.status).toBe('AUTHORIZED');
      expect(res.body.data.parcel.parcelId).toMatch(/^PT-\d{8}-[A-F0-9]{6}$/);
      expect(res.body.data.authorization.status).toBe('AUTHORIZED');
      expect(res.body.data.authorization.wardenDecision).toBe('NOT_REQUIRED');
      expect(res.body.data.parcel.statusHistory.length).toBeGreaterThan(0);
    });
  });

  describe('Expected Parcel Registration under INDIVIDUAL_APPROVAL', () => {
    let pendingParcel;
    let pendingAuthId;

    beforeAll(async () => {
      // Set policy of BH-1 to INDIVIDUAL_APPROVAL
      await HostelPolicy.findOneAndUpdate(
        { hostelId: 'BH-1' },
        { mode: 'INDIVIDUAL_APPROVAL' },
        { upsert: true }
      );
    });

    it('should register parcel in EXPECTED status and authorization in PENDING_WARDEN', async () => {
      const res = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'Amazon',
          trackingNumber: 'AMZ98765432',
          description: 'Mechanical Keyboard',
          category: 'ELECTRONICS',
          consent: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.parcel.status).toBe('EXPECTED');
      expect(res.body.data.authorization.status).toBe('PENDING_WARDEN');

      pendingParcel = res.body.data.parcel;
      pendingAuthId = res.body.data.authorization._id;
    });

    it('should appear in warden pending approvals queue', async () => {
      const res = await request(app)
        .get('/api/authorizations/pending')
        .set('Authorization', `Bearer ${wardenTokenBH1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.authorizations.some((a) => a._id === pendingAuthId)).toBe(true);
    });

    it('should allow WARDEN of BH-1 to APPROVE the request and transition parcel to AUTHORIZED', async () => {
      const res = await request(app)
        .post(`/api/authorizations/${pendingAuthId}/warden-decision`)
        .set('Authorization', `Bearer ${wardenTokenBH1}`)
        .send({
          decision: 'APPROVE',
          comments: 'Approved by Warden. Reception permitted.',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.authorization.status).toBe('AUTHORIZED');
      expect(res.body.authorization.wardenDecision).toBe('APPROVED');

      // Verify parcel status was updated to AUTHORIZED
      const parcelCheck = await request(app)
        .get(`/api/parcels/${pendingParcel._id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(parcelCheck.body.parcel.status).toBe('AUTHORIZED');
    });

    it('should allow WARDEN to REJECT a pending request', async () => {
      // Register another parcel requiring approval
      const regRes = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'Delhivery',
          trackingNumber: 'DEL112233',
          description: 'Expensive Headphones',
          consent: true,
        });

      const newAuthId = regRes.body.data.authorization._id;

      const rejectRes = await request(app)
        .post(`/api/authorizations/${newAuthId}/warden-decision`)
        .set('Authorization', `Bearer ${wardenTokenBH1}`)
        .send({
          decision: 'REJECT',
          comments: 'Exceeds maximum allowable value.',
        });

      expect(rejectRes.statusCode).toBe(200);
      expect(rejectRes.body.authorization.status).toBe('REJECTED');
      expect(rejectRes.body.authorization.wardenDecision).toBe('REJECTED');
    });
  });

  describe('Student Parcel Listing & Access Control', () => {
    it('should list only parcels belonging to logged-in student (GET /api/parcels/my)', async () => {
      const res = await request(app)
        .get('/api/parcels/my')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.parcels.length).toBeGreaterThan(0);
      res.body.parcels.forEach((p) => {
        expect(p.studentId.toString()).toBe(student1User._id.toString());
      });
    });

    it('should forbid Student 2 from viewing Student 1 parcel (403 Forbidden)', async () => {
      // Get one parcel of Student 1
      const student1Parcels = await request(app)
        .get('/api/parcels/my')
        .set('Authorization', `Bearer ${student1Token}`);

      const targetParcelId = student1Parcels.body.parcels[0]._id;

      const res = await request(app)
        .get(`/api/parcels/${targetParcelId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized to view this parcel');
    });

    it('should forbid Warden of GH-2 from viewing Student 1 parcel belonging to BH-1 (403 Forbidden)', async () => {
      const student1Parcels = await request(app)
        .get('/api/parcels/my')
        .set('Authorization', `Bearer ${student1Token}`);

      const targetParcelId = student1Parcels.body.parcels[0]._id;

      const res = await request(app)
        .get(`/api/parcels/${targetParcelId}`)
        .set('Authorization', `Bearer ${wardenTokenGH2}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('You can only view parcels within your assigned hostel');
    });
  });
});
