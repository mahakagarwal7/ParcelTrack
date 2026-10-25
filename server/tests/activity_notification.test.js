import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { HostelPolicy } from '../src/models/HostelPolicy.js';
import { Parcel } from '../src/models/Parcel.js';
import { Otp } from '../src/models/Otp.js';
import { Authorization } from '../src/models/Authorization.js';
import { Notification } from '../src/models/Notification.js';
import { ActivityLog } from '../src/models/ActivityLog.js';

describe('Phase 9: Activity Logging & Notification Engine Tests', () => {
  let student1Token;
  let student1User;
  let guardTokenBH1;
  let guardUserBH1;

  beforeAll(async () => {
    await connectDB();

    // Register Student in BH-1
    const s1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Pranav Nair',
        email: 'pranav.nair@hostel.edu',
        password: 'password123',
        role: 'STUDENT',
        hostelId: 'BH-1',
        studentId: 'STU701',
        roomNumber: 'F-201',
      });
    student1Token = s1.body.token;
    student1User = s1.body.user;

    // Register Guard in BH-1
    const g1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dharmendra (Security)',
        email: 'dharmendra.guard@hostel.edu',
        password: 'guardPassword123',
        role: 'GUARD',
        hostelId: 'BH-1',
      });
    guardTokenBH1 = g1.body.token;
    guardUserBH1 = g1.body.user;

    // Set standing permission for BH-1
    await HostelPolicy.findOneAndUpdate(
      { hostelId: 'BH-1' },
      { mode: 'STANDING_PERMISSION' },
      { upsert: true }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await HostelPolicy.deleteMany({});
    await Parcel.deleteMany({});
    await Otp.deleteMany({});
    await Authorization.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    await disconnectDB();
  });

  describe('Notifications Engine', () => {
    let createdParcelId;
    let notificationId;

    it('should generate a notification for student when expected parcel is registered', async () => {
      const regRes = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'XpressBees',
          trackingNumber: 'XB-999000',
          description: 'Engineering Textbooks',
          consent: true,
        });

      createdParcelId = regRes.body.data.parcel._id;

      // Check student notifications
      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(notifRes.statusCode).toBe(200);
      expect(notifRes.body.success).toBe(true);
      expect(notifRes.body.notifications.length).toBeGreaterThan(0);

      const notif = notifRes.body.notifications[0];
      expect(notif.type).toBe('PARCEL_EXPECTED');
      expect(notif.isRead).toBe(false);
      expect(notif.title).toContain('Expected Parcel Registered');

      notificationId = notif._id;
    });

    it('should mark a single notification as read (PATCH /api/notifications/:id/read)', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.notification.isRead).toBe(true);
    });

    it('should mark all notifications as read (PATCH /api/notifications/read-all)', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify unread count is 0
      const listRes = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(listRes.body.notifications.length).toBe(0);
      expect(listRes.body.unreadCount).toBe(0);
    });
  });

  describe('Activity Logs & Audit Trail', () => {
    let activeParcelId;

    it('should record ActivityLog when parcel is registered, received, and collected', async () => {
      // 1. Register parcel -> logs PARCEL_REGISTERED
      const regRes = await request(app)
        .post('/api/parcels')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          courierName: 'BlueDart',
          trackingNumber: 'BD-AUDIT-123',
          consent: true,
        });

      activeParcelId = regRes.body.data.parcel._id;

      // 2. Guard physically receives parcel -> logs PARCEL_RECEIVED
      await request(app)
        .post(`/api/parcels/${activeParcelId}/receive`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ storageLocation: 'Shelf Gate 1' });

      // 3. Student generates OTP -> logs OTP_GENERATED
      const otpRes = await request(app)
        .post(`/api/parcels/${activeParcelId}/collection-otp`)
        .set('Authorization', `Bearer ${student1Token}`);

      const otp = otpRes.body.otp;

      // 4. Guard verifies OTP and collects -> logs PARCEL_HANDOVER
      await request(app)
        .post(`/api/parcels/${activeParcelId}/collect`)
        .set('Authorization', `Bearer ${guardTokenBH1}`)
        .send({ otp });

      // Verify activity logs exist for activeParcelId
      const logRes = await request(app)
        .get(`/api/activity-logs?parcelId=${activeParcelId}`)
        .set('Authorization', `Bearer ${guardTokenBH1}`);

      expect(logRes.statusCode).toBe(200);
      expect(logRes.body.success).toBe(true);

      const actions = logRes.body.logs.map((l) => l.action);
      expect(actions).toContain('PARCEL_REGISTERED');
      expect(actions).toContain('PARCEL_RECEIVED');
      expect(actions).toContain('OTP_GENERATED');
      expect(actions).toContain('PARCEL_HANDOVER');
    });

    it('should allow student to view activity logs for their own parcel', async () => {
      const res = await request(app)
        .get(`/api/activity-logs?parcelId=${activeParcelId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });
  });
});
