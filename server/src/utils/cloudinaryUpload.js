/**
 * Cloudinary upload utility — signed upload via REST API.
 * No SDK used. Signature computed with Node crypto (SHA-1).
 */
import FormData from 'form-data';
import axios from 'axios';
import crypto from 'crypto';
import { AppError } from './AppError.js';

function signParams(params, apiSecret) {
  // Build the string to sign: sorted key=value pairs joined by &
  // then SHA-1 hash of (string + apiSecret)
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  console.log('[Cloudinary] String to sign:', str);

  return crypto.createHash('sha1').update(str + apiSecret).digest('hex');
}

export const uploadToCloudinary = async (buffer, folder = 'trustbridge') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return `https://placehold.co/400x300?text=TrustBridge+Upload`;
  }

  // Use a simple folder name without slashes to avoid signing issues
  const safeFolder = folder.replace(/\//g, '_');
  const timestamp  = Math.floor(Date.now() / 1000);

  const paramsToSign = { folder: safeFolder, timestamp };
  const signature    = signParams(paramsToSign, apiSecret);

  const form = new FormData();
  form.append('file',      buffer, { filename: 'upload.jpg', contentType: 'image/jpeg' });
  form.append('folder',    safeFolder);
  form.append('timestamp', String(timestamp));
  form.append('api_key',   apiKey);
  form.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  console.log('[Cloudinary] Uploading to:', url);
  console.log('[Cloudinary] folder:', safeFolder, '| timestamp:', timestamp);
  console.log('[Cloudinary] signature:', signature);

  try {
    const response = await axios.post(url, form, {
      headers:          { ...form.getHeaders() },
      maxBodyLength:    Infinity,
      maxContentLength: Infinity,
      timeout:          30000,
    });
    console.log('[Cloudinary] Upload success:', response.data.secure_url);
    return response.data.secure_url;
  } catch (err) {
    const cloudErr = err.response?.data?.error?.message || err.message || 'Upload failed';
    console.error('[Cloudinary] Upload error:', cloudErr);
    console.error('[Cloudinary] Response body:', JSON.stringify(err.response?.data));
    throw new AppError(`Cloudinary upload failed: ${cloudErr}`, 500);
  }
};

export const uploadMultiple = async (files, folder) => {
  if (!files?.length) return [];
  return Promise.all(files.map((f) => uploadToCloudinary(f.buffer, folder)));
};
