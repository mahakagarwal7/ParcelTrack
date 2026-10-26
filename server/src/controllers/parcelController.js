import * as parcelService from '../services/parcelService.js';
import * as otpService from '../services/otpService.js';

export async function registerParcel(req, res, next) {
  try {
    const result = await parcelService.registerExpectedParcel(req.user, req.body);

    res.status(201).json({
      success: true,
      message: 'Expected parcel registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyParcels(req, res, next) {
  try {
    const { status, page, limit, search } = req.query;
    const result = await parcelService.getStudentParcels(req.user._id, {
      status,
      page,
      limit,
      search,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getParcel(req, res, next) {
  try {
    const parcel = await parcelService.getParcelById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      parcel,
    });
  } catch (error) {
    next(error);
  }
}

export async function receiveParcel(req, res, next) {
  try {
    const { storageLocation, remarks, photoUrl } = req.body;
    const parcel = await parcelService.receiveExpectedParcel(req.params.id, req.user, {
      storageLocation,
      remarks,
      photoUrl,
    });

    res.status(200).json({
      success: true,
      message: `Parcel ${parcel.parcelId} recorded as physically received by guard`,
      parcel,
    });
  } catch (error) {
    next(error);
  }
}

export async function getGuardActiveParcels(req, res, next) {
  try {
    const { search, page, limit } = req.query;
    const result = await parcelService.getGuardActiveParcels(req.user, {
      search,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function lookupGateAuthorization(req, res, next) {
  try {
    const { trackingNumber, studentId } = req.query;
    const result = await parcelService.lookupGateAuthorization(req.user, {
      trackingNumber,
      studentId,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function requestCollectionOtp(req, res, next) {
  try {
    const otpData = await otpService.generateCollectionOtp(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: 'Secure collection OTP generated. Present this OTP to the hostel guard.',
      ...otpData,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtpAndCollect(req, res, next) {
  try {
    const { otp } = req.body;
    const result = await otpService.verifyOtpAndHandover(req.params.id, otp, req.user);

    res.status(200).json({
      success: true,
      message: `Parcel ${result.parcel.parcelId} securely handed over and collected.`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
