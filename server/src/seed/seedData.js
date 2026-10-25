import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { HostelPolicy } from '../models/HostelPolicy.js';
import { Parcel } from '../models/Parcel.js';
import { Authorization } from '../models/Authorization.js';
import { DeliveryAttempt } from '../models/DeliveryAttempt.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Otp } from '../models/Otp.js';
import { hashOtp } from '../services/otpService.js';
import crypto from 'crypto';
import { PARCEL_STATUS, AUTHORIZATION_STATUS, DELIVERY_ATTEMPT_STATUS } from '../utils/stateMachine.js';

export async function seedDatabase() {
  console.log('Seeding ParcelTrack demo data...');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    HostelPolicy.deleteMany({}),
    Parcel.deleteMany({}),
    Authorization.deleteMany({}),
    DeliveryAttempt.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
    Otp.deleteMany({}),
  ]);

  // 1. Create Core Role Users
  const password = 'password123'; // Standard test password for all roles

  const [student, guard, warden, admin] = await Promise.all([
    User.create({
      name: 'Aarav Patel',
      email: 'student@hostel.edu',
      password,
      role: 'STUDENT',
      hostelId: 'BH-1',
      studentId: '2026BCS0101',
      roomNumber: 'B-204',
      phone: '+91 98765 43210',
    }),
    User.create({
      name: 'Suraj Singh (Gate Guard)',
      email: 'guard@hostel.edu',
      password,
      role: 'GUARD',
      hostelId: 'BH-1',
      phone: '+91 91234 56780',
    }),
    User.create({
      name: 'Dr. R. K. Srivastava (Chief Warden)',
      email: 'warden@hostel.edu',
      password,
      role: 'WARDEN',
      hostelId: 'BH-1',
      phone: '+91 94567 89012',
    }),
    User.create({
      name: 'System Administrator',
      email: 'admin@hostel.edu',
      password,
      role: 'ADMIN',
      hostelId: 'CAMPUS',
      phone: '+91 99999 00000',
    }),
  ]);

  console.log('Created Users: Student, Guard, Warden, Admin');

  // 2. Create Hostel Policy for BH-1
  const policy = await HostelPolicy.create({
    hostelId: 'BH-1',
    mode: 'HYBRID',
    maxStorageDays: 7,
    allowCOD: false,
    maxParcelSize: 'MEDIUM',
    requireWardenApprovalFor: ['HIGH_VALUE', 'OVERSIZED', 'COD'],
    updatedBy: warden._id,
  });

  // 3. Create Authorization & Parcel in RECEIVED status (Ready for student collection)
  const authReceived = await Authorization.create({
    studentId: student._id,
    hostelId: 'BH-1',
    studentConsent: 'GRANTED',
    studentConsentAt: new Date(Date.now() - 3600000 * 4),
    wardenDecision: 'NOT_REQUIRED',
    status: AUTHORIZATION_STATUS.AUTHORIZED,
    policyApplied: 'HYBRID',
  });

  const parcelReceived = await Parcel.create({
    parcelId: 'PT-20261025-RCV01',
    studentId: student._id,
    hostelId: 'BH-1',
    courierName: 'BlueDart Express',
    trackingNumber: 'BD98273641IN',
    description: 'Course Textbooks & Notebooks',
    category: 'DOCUMENTS',
    status: PARCEL_STATUS.RECEIVED,
    authorizationId: authReceived._id,
    receivedBy: guard._id,
    receivedAt: new Date(Date.now() - 3600000 * 2),
    storageLocation: 'Shelf Rack A-2',
    statusHistory: [
      {
        status: PARCEL_STATUS.AUTHORIZED,
        changedBy: student._id,
        note: 'Expected parcel registered and authorized under hybrid standing policy',
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
      {
        status: PARCEL_STATUS.RECEIVED,
        changedBy: guard._id,
        note: 'Physical parcel received at gate counter by Guard Suraj Singh',
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
    ],
  });

  authReceived.parcelId = parcelReceived._id;
  await authReceived.save();

  // 4. Create an already COLLECTED parcel (Historical record)
  const authCollected = await Authorization.create({
    studentId: student._id,
    hostelId: 'BH-1',
    studentConsent: 'GRANTED',
    studentConsentAt: new Date(Date.now() - 86400000 * 2),
    wardenDecision: 'NOT_REQUIRED',
    status: AUTHORIZATION_STATUS.AUTHORIZED,
    policyApplied: 'HYBRID',
  });

  const parcelCollected = await Parcel.create({
    parcelId: 'PT-20261024-COL02',
    studentId: student._id,
    hostelId: 'BH-1',
    courierName: 'Amazon Prime',
    trackingNumber: 'AMZ-5544332211',
    description: 'Noise Cancelling Headphones',
    category: 'ELECTRONICS',
    status: PARCEL_STATUS.COLLECTED,
    authorizationId: authCollected._id,
    receivedBy: guard._id,
    receivedAt: new Date(Date.now() - 86400000),
    collectedBy: guard._id,
    collectedAt: new Date(Date.now() - 3600000 * 12),
    storageLocation: 'Shelf Rack B-1',
    statusHistory: [
      {
        status: PARCEL_STATUS.AUTHORIZED,
        changedBy: student._id,
        note: 'Pre-registered expected parcel',
        timestamp: new Date(Date.now() - 86400000 * 2),
      },
      {
        status: PARCEL_STATUS.RECEIVED,
        changedBy: guard._id,
        note: 'Received from Amazon driver',
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        status: PARCEL_STATUS.COLLECTED,
        changedBy: guard._id,
        note: 'Handed over to Aarav Patel after OTP verification',
        timestamp: new Date(Date.now() - 3600000 * 12),
      },
    ],
  });

  authCollected.parcelId = parcelCollected._id;
  await authCollected.save();

  // 5. Create Authorization pending Warden approval (Exception in HYBRID: High Value)
  const authPendingWarden = await Authorization.create({
    studentId: student._id,
    hostelId: 'BH-1',
    studentConsent: 'GRANTED',
    studentConsentAt: new Date(Date.now() - 3600000),
    wardenDecision: 'PENDING',
    status: AUTHORIZATION_STATUS.PENDING_WARDEN,
    policyApplied: 'HYBRID',
  });

  const parcelPendingWarden = await Parcel.create({
    parcelId: 'PT-20261025-WRD03',
    studentId: student._id,
    hostelId: 'BH-1',
    courierName: 'Delhivery Surface',
    trackingNumber: 'DEL-HIGH-VAL-99',
    description: 'Gaming Laptop & Accessories',
    category: 'ELECTRONICS',
    isHighValue: true,
    status: PARCEL_STATUS.EXPECTED,
    authorizationId: authPendingWarden._id,
    statusHistory: [
      {
        status: PARCEL_STATUS.EXPECTED,
        changedBy: student._id,
        note: 'Flagged for Warden approval due to High Value exception policy',
        timestamp: new Date(Date.now() - 3600000),
      },
    ],
  });

  authPendingWarden.parcelId = parcelPendingWarden._id;
  await authPendingWarden.save();

  // 6. Create an unexpected delivery attempt at gate (Awaiting student consent)
  const authUnexpected = await Authorization.create({
    studentId: student._id,
    hostelId: 'BH-1',
    studentConsent: 'PENDING',
    wardenDecision: 'NOT_REQUIRED',
    status: AUTHORIZATION_STATUS.PENDING_STUDENT,
    policyApplied: 'HYBRID',
  });

  const deliveryAttempt = await DeliveryAttempt.create({
    studentId: student._id,
    guardId: guard._id,
    hostelId: 'BH-1',
    courierName: 'Shadowfax Delivery',
    trackingNumber: 'SFX-GATE-7711',
    status: DELIVERY_ATTEMPT_STATUS.AWAITING_AUTHORIZATION,
    authorizationId: authUnexpected._id,
    attemptedAt: new Date(Date.now() - 1800000),
  });

  authUnexpected.deliveryAttemptId = deliveryAttempt._id;
  await authUnexpected.save();

  // 7. Seed Notifications
  await Notification.create([
    {
      recipientId: student._id,
      title: 'Parcel Awaiting Collection',
      message: 'Your parcel from BlueDart Express is ready at the gate counter. Generate your OTP to collect.',
      type: 'PARCEL_RECEIVED',
      relatedParcelId: parcelReceived._id,
      isRead: false,
    },
    {
      recipientId: student._id,
      title: 'Courier At Gate - Action Required',
      message: 'Shadowfax Delivery has arrived with an unexpected parcel. Please authorize or reject.',
      type: 'CONSENT_REQUEST',
      relatedAuthorizationId: authUnexpected._id,
      isRead: false,
    },
    {
      recipientId: warden._id,
      title: 'New High-Value Parcel Approval Request',
      message: 'Student Aarav Patel (B-204) registered a high-value parcel requiring your review.',
      type: 'WARDEN_APPROVAL_NEEDED',
      relatedAuthorizationId: authPendingWarden._id,
      isRead: false,
    },
  ]);

  // 8. Seed Activity Logs
  await ActivityLog.create([
    {
      actorId: student._id,
      actorRole: 'STUDENT',
      hostelId: 'BH-1',
      parcelId: parcelReceived._id,
      action: 'PARCEL_REGISTERED',
      newValue: { status: 'AUTHORIZED', courierName: 'BlueDart Express' },
      timestamp: new Date(Date.now() - 3600000 * 4),
    },
    {
      actorId: guard._id,
      actorRole: 'GUARD',
      hostelId: 'BH-1',
      parcelId: parcelReceived._id,
      action: 'PARCEL_RECEIVED',
      newValue: { status: 'RECEIVED', storageLocation: 'Shelf Rack A-2' },
      timestamp: new Date(Date.now() - 3600000 * 2),
    },
    {
      actorId: guard._id,
      actorRole: 'GUARD',
      hostelId: 'BH-1',
      deliveryAttemptId: deliveryAttempt._id,
      action: 'DELIVERY_ATTEMPT_CREATED',
      newValue: { status: 'AWAITING_AUTHORIZATION', courierName: 'Shadowfax Delivery' },
      timestamp: new Date(Date.now() - 1800000),
    },
  ]);

  console.log('✅ Demo database seeded successfully!');
  return { student, guard, warden, admin, policy };
}

// Allow direct CLI execution: node src/seed/seedData.js
if (process.argv[1]?.endsWith('seedData.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('Seed error:', err);
      process.exit(1);
    }
  })();
}
