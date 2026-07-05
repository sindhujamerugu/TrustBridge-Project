import express from 'express';
import Service from '../models/Service.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadFields } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../utils/AppError.js';
import { uploadMultiple, uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import { verifyServiceDocuments } from '../utils/documentVerifier.js';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads/services');
try { mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}

// Save image buffer to disk and return URL path
async function saveImageToDisk(buffer, mimetype) {
  try {
    const sharp = (await import('sharp')).default;
    const resized = await sharp(buffer)
      .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer();
    const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.jpg`;
    const filepath  = path.join(UPLOADS_DIR, filename);
    writeFileSync(filepath, resized);
    // URL served by Express static middleware
    return `/uploads/services/${filename}`;
  } catch {
    // Fallback: save original
    const ext      = mimetype.includes('png') ? 'png' : 'jpg';
    const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
    return `/uploads/services/${filename}`;
  }
}

// Upload image — Cloudinary in prod, disk in dev
async function uploadImage(buffer, mimetype, folder = 'trustbridge/services') {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return uploadToCloudinary(buffer, folder);
  }
  return saveImageToDisk(buffer, mimetype);
}

const router = express.Router();

export const CATEGORIES = [
  'Medical', 'Hospitals', 'Clinics', 'Pharmacies',
  'Grocery Stores', 'Supermarkets', 'Restaurants', 'Cafes',
  'Education', 'Coaching Centers', 'Transportation',
  'Hostels', 'PGs', 'Rentals', 'Emergency Services',
];

export const LOCATIONS = ['Bachupally', 'Miyapur', 'Secunderabad'];

router.get('/categories', (req, res) => {
  res.json({ success: true, data: CATEGORIES });
});

router.get('/locations', (req, res) => {
  res.json({ success: true, data: LOCATIONS });
});

// ── OCR Debug endpoint — returns raw OCR output for any uploaded image ───────
// POST /api/services/ocr-debug  (field name: "file")
// No auth required in dev — remove or protect before production
router.post('/ocr-debug', uploadFields, asyncHandler(async (req, res) => {
  const fileObj = req.files?.file?.[0] || req.files?.aadhaar?.[0] || req.files?.pan?.[0];
  if (!fileObj) {
    return res.status(400).json({ success: false, message: 'Upload a file using field name "file", "aadhaar", or "pan"' });
  }

  const buffer = fileObj.buffer;
  const mime   = fileObj.mimetype;
  const size   = buffer.length;

  // Magic bytes
  const h = buffer;
  const header = `${h[0].toString(16).padStart(2,'0')} ${h[1].toString(16).padStart(2,'0')} ${h[2].toString(16).padStart(2,'0')} ${h[3].toString(16).padStart(2,'0')}`;
  const formats = { jpeg: h[0]===0xFF&&h[1]===0xD8&&h[2]===0xFF, png: h[0]===0x89&&h[1]===0x50&&h[2]===0x4E&&h[3]===0x47, pdf: buffer.slice(0,4).toString()==='%PDF' };
  const detectedFormat = Object.entries(formats).find(([,v])=>v)?.[0] || 'unknown';

  // Preprocessing
  let processed = buffer;
  try {
    const sharp = (await import('sharp')).default;
    processed = await sharp(buffer).grayscale().normalise().sharpen({ sigma: 1.5, m1: 1.5, m2: 0.5 }).jpeg({ quality: 95 }).toBuffer();
  } catch(e) { /* sharp not available */ }

  // Tesseract OCR
  let ocrText = '', ocrConf = 0, ocrError = null;
  try {
    const Tess = (await import('tesseract.js')).default;
    const res1 = await Tess.recognize(processed, 'eng+hin', { logger: () => {} });
    ocrText = res1.data.text || '';
    ocrConf = res1.data.confidence || 0;
  } catch(e) {
    ocrError = e.message;
  }

  // Pattern tests on raw OCR text
  const AADHAAR_NUM   = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/;
  const AADHAAR_KW    = /\b(aadhaar|आधार|uidai|unique\s*identification)\b/i;
  const AADHAAR_GOVT  = /\b(government\s+of\s+india|govt\.?\s*of\s*india|भारत\s+सरकार)\b/i;
  const AADHAAR_EXTRA = /\b(dob|male|female|पुरुष|महिला|s\/o|d\/o|w\/o|vid)\b/i;
  const PAN_NUM       = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
  const DOB_PAT       = /(?:dob|date\s+of\s+birth|जन्म)[:\s.]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i;
  const NAME_PAT1     = /(?:name|नाम)\s*[:\-]\s*([A-Za-z][A-Za-z\s]{2,40})/i;
  const NAME_PAT2     = /(?:^|\n)([A-Z][A-Z\s]{2,40})(?=\s*\n)/m;
  const ADDR_PAT      = /(?:address|पता|s\/o|d\/o|w\/o|c\/o)[:\s]+(.{10,120})/i;

  const numMatch   = ocrText.match(AADHAAR_NUM);
  const panMatch   = ocrText.match(PAN_NUM);
  const dobMatch   = ocrText.match(DOB_PAT);
  const nameMatch1 = ocrText.match(NAME_PAT1);
  const nameMatch2 = ocrText.match(NAME_PAT2);
  const addrMatch  = ocrText.match(ADDR_PAT);
  const yobMatch   = ocrText.match(/\b(19|20)\d{2}\b/);

  const patternResults = {
    aadhaarNumber:  numMatch  ? numMatch[0]   : null,
    aadhaarKeyword: AADHAAR_KW.test(ocrText),
    govtOfIndia:    AADHAAR_GOVT.test(ocrText),
    aadhaarExtra:   AADHAAR_EXTRA.test(ocrText),
    panNumber:      panMatch  ? panMatch[0]   : null,
    dob:            dobMatch  ? dobMatch[1]   : null,
    yob:            yobMatch  ? yobMatch[0]   : null,
    nameFromLabel:  nameMatch1? nameMatch1[1] : null,
    nameFromLine:   nameMatch2? nameMatch2[1] : null,
    address:        addrMatch ? addrMatch[1]  : null,
  };

  // What type would be detected
  let detectedDocType = 'unknown';
  if (AADHAAR_KW.test(ocrText) || AADHAAR_NUM.test(ocrText))        detectedDocType = 'aadhaar';
  else if (/\b(income\s+tax|permanent\s+account\s+number)\b/i.test(ocrText) || PAN_NUM.test(ocrText)) detectedDocType = 'pan';

  // Content strength
  let contentScore = 0;
  if (numMatch)                    contentScore += 40;
  if (AADHAAR_KW.test(ocrText))    contentScore += 25;
  if (AADHAAR_GOVT.test(ocrText))  contentScore += 20;
  if (AADHAAR_EXTRA.test(ocrText)) contentScore += 10;
  if (dobMatch || yobMatch)        contentScore += 10;
  if (nameMatch1 || nameMatch2)    contentScore += 15;
  contentScore = Math.min(100, contentScore);

  const response = {
    success:     true,
    imageInfo:   { size, mime, detectedFormat, header, preprocessed: processed.length !== buffer.length },
    ocr: {
      confidence: ocrConf,
      textLength: ocrText.length,
      error:      ocrError,
      rawText:    ocrText,                  // full raw text
      first500:   ocrText.slice(0, 500),    // preview
    },
    patterns:       patternResults,
    detectedDocType,
    contentScore,
    diagnosis: {
      isReadable:        ocrText.length > 20,
      hasAadhaarKeyword: AADHAAR_KW.test(ocrText),
      hasAadhaarNumber:  !!numMatch,
      hasGovtText:       AADHAAR_GOVT.test(ocrText),
      hasName:           !!(nameMatch1 || nameMatch2),
      hasDOB:            !!(dobMatch || yobMatch),
      likelyAadhaar:     contentScore >= 40,
      wouldPassMinConf:  ocrConf >= 25,
      wouldPassContent:  contentScore >= 50,
    },
  };

  // Also log to server console
  console.log('\n[OCR-DEBUG] ==========================================');
  console.log(`[OCR-DEBUG] File: ${size} bytes | format: ${detectedFormat} | mime: ${mime}`);
  console.log(`[OCR-DEBUG] OCR confidence: ${ocrConf.toFixed(1)}%`);
  console.log(`[OCR-DEBUG] OCR text length: ${ocrText.length} chars`);
  console.log(`[OCR-DEBUG] Raw OCR text:\n${ocrText}`);
  console.log(`[OCR-DEBUG] Patterns: ${JSON.stringify(patternResults, null, 2)}`);
  console.log(`[OCR-DEBUG] Content score: ${contentScore}`);
  console.log('[OCR-DEBUG] ==========================================\n');

  res.json(response);
}));

router.get('/', asyncHandler(async (req, res) => {
  const { category, location, search, featured, minRating, sort } = req.query;
  const filter = { isVisible: true, isActive: true };

  if (category) filter.category = category;
  if (location) filter.location = new RegExp(location, 'i');
  if (featured === 'true') filter.isFeatured = true;
  if (minRating) filter.averageRating = { $gte: Number(minRating) };
  if (search) filter.$text = { $search: search };

  let sortOption = { createdAt: -1 };
  if (sort === 'rating'   || sort === 'featured') sortOption = { isFeatured: -1, averageRating: -1 };
  if (sort === 'top_rated')  sortOption = { averageRating: -1, totalReviews: -1 };
  if (sort === 'popular')    sortOption = { totalBookings: -1 };
  if (sort === 'newest')     sortOption = { createdAt: -1 };
  // 'trusted' and 'nearest' are computed client-side (trust score / geolocation)

  const services = await Service.find(filter)
    .populate('provider', 'name avatar')
    .sort(sortOption)
    .limit(100);

  res.json({ success: true, data: services });
}));

// ── Provider's own services — exclude soft-deleted ───────────────────────────
router.get('/provider/my-services', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const services = await Service.find({
    provider: req.user._id,
    isActive:  true,           // hide soft-deleted
  }).sort({ createdAt: -1 });
  res.json({ success: true, data: services });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate('provider', 'name avatar email phone')
    .populate('recommendedBy', 'name avatar');
  if (!service) throw new AppError('Service not found', 404);
  res.json({ success: true, data: service });
}));

router.post('/', protect, authorize('provider'), uploadFields, asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  console.log("========== CREATE SERVICE ==========");
  console.log("req.files =", req.files);
  console.log("req.body =", req.body);
  let images = [];
  if (req.files?.images) {
    // Use uploadImage (disk in dev, Cloudinary in prod) instead of uploadMultiple
    // which returns a placehold.co URL when Cloudinary is not configured
    images = await Promise.all(
      req.files.images.map(f => uploadImage(f.buffer, f.mimetype))
    );
  }

  // New workflow: service starts as 'draft', not immediately published
  const service = await Service.create({
    ...req.body,
    provider: req.user._id,
    providerProfile: profile?._id,
    images,
    isVisible: false,
    isFeatured: false,
    workflowStatus: 'docs_pending',
  });

  res.status(201).json({ success: true, data: service });
}));

// ── Upload documents for a service ──────────────────────────────────────────
router.post('/:id/documents', protect, authorize('provider'), uploadFields, asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, provider: req.user._id });
  if (!service) throw new AppError('Service not found', 404);

  const receivedFields = Object.keys(req.files || {});
  console.log('[ServiceDocs] req.files keys:', receivedFields);
  console.log('[ServiceDocs] counts:', receivedFields.map(k => `${k}:${req.files[k].length}`).join(' '));

  const DOC_TYPES = ['aadhaar', 'pan', 'gst', 'businessLicense', 'registrationCert'];
  const docBuffers = {};
  const docMimes   = {};

  // Build a $set patch with only the docs that actually arrived
  const docSetPatch = {};

  for (const docType of DOC_TYPES) {
    const fileObj = req.files?.[docType]?.[0];
    if (!fileObj) continue;                        // skip — not uploaded, never write undefined

    docBuffers[docType] = fileObj.buffer;
    docMimes[docType]   = fileObj.mimetype;

    // Upload to Cloudinary (non-fatal)
    try {
      const url = await uploadToCloudinary(fileObj.buffer, `trustbridge/service-docs/${docType}`);
      docSetPatch[`documents.${docType}`] = { url, verified: false };
      console.log(`[ServiceDocs] Uploaded ${docType} → ${url}`);
    } catch (err) {
      console.warn(`[ServiceDocs] Cloudinary failed for ${docType}:`, err.message);
      docSetPatch[`documents.${docType}`] = { url: `dev-placeholder-${docType}`, verified: false };
    }
  }

  const uploadedCount = Object.keys(docBuffers).length;
  if (uploadedCount === 0) {
    throw new AppError('No documents received. Please select files before uploading.', 400);
  }

  // Require at least one identity document
  if (!docBuffers.aadhaar && !docBuffers.pan) {
    throw new AppError('At least one identity document (Aadhaar or PAN) is required.', 400);
  }

  console.log('[ServiceDocs] Writing doc fields:', Object.keys(docSetPatch).join(', '));

  // Use $set with dot-notation so only uploaded docs are touched — no undefined writes
  await Service.findByIdAndUpdate(service._id, {
    $set: {
      ...docSetPatch,
      workflowStatus:                    'verifying',
      'docVerification.score':           0,
      'docVerification.status':          'pending',
      'docVerification.startedAt':       new Date(),
      'docVerification.currentStage':    'Preparing documents for analysis…',
      'docVerification.failureReasons':  [],
      'docVerification.documentResults': {},
      'docVerification.identityPassed':  false,
      'docVerification.businessPassed':  false,
      'docVerification.verificationLevel': 0,
    },
  });

  // Re-fetch for response
  const updated = await Service.findById(service._id);

  // Fetch provider profile for name-matching
  const profile = await ProviderProfile.findOne({ user: req.user._id });

  runDocVerification(service._id, docBuffers, docMimes, profile).catch(err =>
    console.error('[DocVerify] Background error:', err.message)
  );

  res.json({
    success: true,
    data:    updated,
    message: `${uploadedCount} document(s) uploaded. AI verification started.`,
  });
}));

// ── Real AI document verification (runs in background) ──────────────────────
async function runDocVerification(serviceId, docBuffers, docMimes, profile) {
  const providerInfo = {
    name:         profile?.fullName || profile?.name || '',
    businessName: profile?.businessName || '',
  };

  const startMs = Date.now();
  console.log(`[DocVerify] ▶ START service=${serviceId} docs=${Object.keys(docBuffers).join(',')} at=${new Date().toISOString()}`);
  console.log(`[DocVerify] Provider: "${providerInfo.name}" / business: "${providerInfo.businessName}"`);
  console.log(`[DocVerify] OCR_PROVIDER=${process.env.OCR_PROVIDER || 'tesseract'}`);

  const onStage = async (stage) => {
    try { await Service.findByIdAndUpdate(serviceId, { 'docVerification.currentStage': stage }); } catch (_) {}
    console.log(`[DocVerify] Stage → ${stage}`);
  };

  try {
    const verifyResult = await verifyServiceDocuments(docBuffers, docMimes, providerInfo, onStage);

    // Build verified flags patch — only for docs that were actually processed
    const verifiedPatch = {};
    for (const [docType, result] of Object.entries(verifyResult.documentResults || {})) {
      verifiedPatch[`documents.${docType}.verified`] = result.passed === true;
    }

    await Service.findByIdAndUpdate(serviceId, {
      $set: {
        workflowStatus:                    verifyResult.identityPassed ? 'payment_pending' : 'rejected',
        'docVerification.score':           verifyResult.overallScore,
        'docVerification.status':          verifyResult.status,
        'docVerification.checkedAt':       new Date(),
        'docVerification.currentStage':    verifyResult.identityPassed
          ? `✓ Identity Verified (Level ${verifyResult.verificationLevel})`
          : 'Identity verification failed',
        'docVerification.reason':          verifyResult.failureReasons?.[0] || '',
        'docVerification.failureReasons':  verifyResult.failureReasons  || [],
        'docVerification.documentResults': verifyResult.documentResults || {},
        'docVerification.verificationLevel': verifyResult.verificationLevel,
        'docVerification.identityPassed':  verifyResult.identityPassed,
        'docVerification.businessPassed':  verifyResult.businessPassed,
        ...verifiedPatch,
      },
    });

    console.log(`[DocVerify] ✓ DONE service=${serviceId} elapsed=${((Date.now()-startMs)/1000).toFixed(1)}s level=${verifyResult.verificationLevel} identityPassed=${verifyResult.identityPassed}`);
  } catch (err) {
    console.error('[DocVerify] Fatal error:', err.message);
    console.error('[DocVerify] Stack:', err.stack);
    try {
      await Service.findByIdAndUpdate(serviceId, {
        workflowStatus:                   'rejected',
        'docVerification.status':         'failed',
        'docVerification.currentStage':   'Verification failed — system error',
        'docVerification.reason':         err.message,
        'docVerification.failureReasons': [`Verification error: ${err.message}`],
      });
    } catch (dbErr) {
      console.error('[DocVerify] DB update also failed:', dbErr.message);
    }
  }
}

// ── Get verification status ──────────────────────────────────────────────────
router.get('/:id/verification-status', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, provider: req.user._id });
  if (!service) throw new AppError('Service not found', 404);

  const ws  = service.workflowStatus;
  const dv  = service.docVerification;
  const now = Date.now();

  // Detect a stale verification job — happens when the server process was killed
  // mid-OCR (Render dyno restart, OOM, etc.) while workflowStatus is still 'verifying'.
  // If the job has been 'pending'/'verifying' for more than 5 minutes with no checkedAt,
  // and we still have the original document URLs, auto-retrigger OCR.
  const STALE_MS = 5 * 60 * 1000; // 5 minutes
  const startedAt = dv?.startedAt ? new Date(dv.startedAt).getTime() : null;
  const isStale = ws === 'verifying'
    && dv?.status === 'pending'
    && !dv?.checkedAt
    && startedAt
    && (now - startedAt) > STALE_MS;

  if (isStale) {
    console.log(`[DocVerify] Stale verification detected for service ${service._id} — re-triggering OCR`);

    // Rebuild buffers from stored Cloudinary URLs
    const DOC_TYPES = ['aadhaar', 'pan', 'gst', 'businessLicense', 'registrationCert'];
    const docBuffers = {}, docMimes = {};
    let hasDoc = false;

    for (const docType of DOC_TYPES) {
      const doc = service.documents?.[docType];
      if (!doc?.url || doc.url.startsWith('dev-placeholder')) continue;
      try {
        const { data } = await (await import('axios')).default.get(doc.url, { responseType: 'arraybuffer', timeout: 20000 });
        docBuffers[docType] = Buffer.from(data);
        docMimes[docType]   = 'image/jpeg';
        hasDoc = true;
        console.log(`[DocVerify] Re-fetched ${docType} from ${doc.url} — ${docBuffers[docType].length} bytes`);
      } catch (e) {
        console.warn(`[DocVerify] Could not re-fetch ${docType}:`, e.message);
      }
    }

    if (hasDoc) {
      // Reset stage so frontend knows a fresh run started
      await Service.findByIdAndUpdate(service._id, {
        'docVerification.currentStage': 'Re-running AI verification (server restarted)…',
        'docVerification.startedAt':    new Date(),
      });
      const profile = await ProviderProfile.findOne({ user: req.user._id });
      runDocVerification(service._id, docBuffers, docMimes, profile).catch(err =>
        console.error('[DocVerify] Retrigger error:', err.message)
      );
    } else {
      // No documents retrievable — mark as failed so frontend shows error
      await Service.findByIdAndUpdate(service._id, {
        workflowStatus:                   'rejected',
        'docVerification.status':         'failed',
        'docVerification.currentStage':   'Verification failed — please re-upload documents',
        'docVerification.failureReasons': ['Verification server was restarted. Please re-upload your documents.'],
      });
    }

    // Refresh the service object before responding
    const refreshed = await Service.findById(service._id);
    return res.json({
      success: true,
      data: {
        workflowStatus:  refreshed.workflowStatus,
        docVerification: refreshed.docVerification,
      },
    });
  }

  res.json({
    success: true,
    data: {
      workflowStatus:  ws,
      docVerification: dv,
    },
  });
}));

// ── Activate after payment ───────────────────────────────────────────────────
router.post('/:id/activate', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, provider: req.user._id });
  if (!service) throw new AppError('Service not found', 404);

  const profile = await ProviderProfile.findOne({ user: req.user._id });
  const hasPaid = profile?.subscription?.status === 'active';
  if (!hasPaid) throw new AppError('Active subscription required to publish service', 403);

  // Identity verification is the minimum requirement — business docs are optional
  if (!service.docVerification?.identityPassed) {
    throw new AppError('Identity verification required before publishing. Please upload a valid Aadhaar or PAN card.', 403);
  }

  const isFeatured = ['premium','enterprise'].includes(profile.subscription.plan);
  service.isVisible      = true;
  service.isFeatured     = isFeatured;
  service.workflowStatus = 'published';
  await service.save();

  res.json({ success: true, data: service });
}));

router.put('/:id', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, provider: req.user._id });
  if (!service) throw new AppError('Service not found', 404);

  // Critical fields — changing these triggers re-verification for published services
  const CRITICAL = ['category', 'location'];
  const wasPublished = service.workflowStatus === 'published';

  const criticalChanged = wasPublished && CRITICAL.some(
    f => req.body[f] !== undefined && String(req.body[f]) !== String(service[f])
  );

  const allowed = ['title', 'description', 'category', 'subcategory', 'location', 'address',
                   'price', 'priceUnit', 'availability', 'contactNumber', 'businessEmail', 'website'];
  allowed.forEach(f => { if (req.body[f] !== undefined) service[f] = req.body[f]; });

  // Critical change → put back under review
  if (criticalChanged) {
    service.workflowStatus = 'admin_review';
    service.isVisible      = false;
  }

  await service.save();
  res.json({
    success: true,
    data:    service,
    requiresReview: criticalChanged,
    message: criticalChanged
      ? 'Your changes have been saved and submitted for verification.'
      : 'Service updated successfully.',
  });
}));

// ── PATCH /:id/status — pause / activate ─────────────────────────────────────
router.patch('/:id/status', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const { status } = req.body;  // 'paused' | 'published'
  if (!['paused', 'published'].includes(status))
    throw new AppError('Status must be "paused" or "published"', 400);

  const service = await Service.findOne({ _id: req.params.id, provider: req.user._id });
  if (!service) throw new AppError('Service not found', 404);

  // Only allow pausing a published service, or re-activating a paused one
  if (status === 'published' && service.workflowStatus !== 'paused')
    throw new AppError('Only paused services can be re-activated', 400);
  if (status === 'paused' && service.workflowStatus !== 'published')
    throw new AppError('Only published services can be paused', 400);

  service.workflowStatus = status;
  service.isVisible      = status === 'published';
  await service.save();

  res.json({
    success: true,
    data:    service,
    message: status === 'paused' ? 'Service paused.' : 'Service re-activated and visible to customers.',
  });
}));

// ── Upload/replace service images ────────────────────────────────────────────
router.post('/:id/images', protect, authorize('provider'), uploadFields, asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, provider: req.user._id });
  if (!service) throw new AppError('Service not found', 404);

  const files = req.files?.images || [];
  console.log(`[ServiceImages] Received ${files.length} file(s) for service ${req.params.id}`);
  if (!files.length) throw new AppError('No images received', 400);

  const newUrls = await Promise.all(
    files.map(f => uploadImage(f.buffer, f.mimetype))
  );

  service.images = [...service.images.filter(u => !u.includes('placehold.co')), ...newUrls];
  await service.save();

  console.log(`[ServiceImages] Stored image URLs:`, service.images);
  await service.save();

  res.json({ success: true, data: service, message: `${newUrls.length} image(s) uploaded` });
}));

// ── Delete a specific service image ─────────────────────────────────────────
router.delete('/:id/images', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, provider: req.user._id });
  if (!service) throw new AppError('Service not found', 404);

  const { imageUrl } = req.body;
  if (!imageUrl) throw new AppError('imageUrl is required', 400);

  service.images = service.images.filter(img => img !== imageUrl);
  await service.save();

  res.json({ success: true, data: service });
}));

router.delete('/:id', protect, authorize('provider'), asyncHandler(async (req, res) => {
  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, provider: req.user._id },
    { isActive: false, isVisible: false },
    { new: true }
  );
  if (!service) throw new AppError('Service not found', 404);
  res.json({ success: true, message: 'Service deactivated' });
}));

export default router;
