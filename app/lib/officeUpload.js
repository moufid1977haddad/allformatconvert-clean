// One entry point for the document tools (Word/Excel/PowerPoint/HTML/EPUB/MOBI to PDF, PDF to Word):
// small files go through the tool's route as a plain multipart request (unchanged behaviour); files above
// OFFICE_STAGED_THRESHOLD_BYTES -- and everything the Vercel body ceiling would refuse -- go through the
// chunked, direct-to-service upload (app/lib/mediaJob.js -> runStagedConversion).
//
// When the media service is not configured (NEXT_PUBLIC_MEDIA_SERVICE_URL absent) the tools keep exactly
// their previous ceiling and message: officeMaxBytes() falls back to the platform limit.
import { runStagedConversion, mediaServiceConfigured, MediaJobError } from './mediaJob';
import {
  MAX_PLATFORM_UPLOAD_BYTES, MAX_OFFICE_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES, PLATFORM_LIMIT_HINT,
} from '@/lib/quota/limits';

const MIB = 1024 * 1024;

/** The ceiling that really applies to this deployment, in bytes. */
export const officeMaxBytes = () => (mediaServiceConfigured() ? MAX_OFFICE_STAGED_BYTES : MAX_PLATFORM_UPLOAD_BYTES);
export const officeMaxLabel = () => `${Math.round(officeMaxBytes() / MIB)} MB`;

/** Pre-upload check: the honest reason and the real limit, before any byte is sent. */
export function checkOfficeSize(file) {
  const max = officeMaxBytes();
  if (!file || file.size <= max) return { ok: true };
  const fileMb = (file.size / MIB).toFixed(1);
  const tail = mediaServiceConfigured() ? 'Larger files are not supported.' : PLATFORM_LIMIT_HINT;
  return { ok: false, message: `This file is ${fileMb} MB but this tool accepts files up to ${Math.round(max / MIB)} MB — ${tail}` };
}

/** Short label for the button while a conversion runs. */
export function officeStageLabel(stage) {
  if (!stage) return 'Converting...';
  if (stage.stage === 'upload') return `Uploading ${Math.floor(stage.pct || 0)}%`;
  if (stage.stage === 'converting') return 'Converting...';
  if (stage.stage === 'download') return `Downloading ${Math.floor(stage.pct || 0)}%`;
  return 'Preparing...';
}

/**
 * @param {{file: File|Blob & {name?: string}, endpoint: string, fields?: Record<string,string>, onStage?: (s: object) => void, signal?: AbortSignal}} opts
 * @returns {Promise<{blob: Blob, detectedFonts: string[]}>}
 * @throws {Error} with a message that is safe to show as is
 */
export async function convertOffice({ file, endpoint, fields, onStage, signal }) {
  const stage = onStage || (() => {});
  const staged = mediaServiceConfigured() && file.size > OFFICE_STAGED_THRESHOLD_BYTES;

  if (staged) {
    try {
      const r = await runStagedConversion({ file, endpoint, fields, onStage: stage, signal });
      return { blob: r.blob, detectedFonts: r.detectedFonts };
    } catch (e) {
      if (e instanceof MediaJobError && e.code === 'cancelled') throw new Error('Cancelled.');
      throw e;
    }
  }

  const formData = new FormData();
  formData.append('file', file, file.name);
  Object.entries(fields || {}).forEach(([k, v]) => formData.append(k, v));
  const res = await fetch(endpoint, { method: 'POST', body: formData, signal });
  if (!res.ok) {
    if (res.status === 413) throw new Error(`This file is over the ${Math.round(MAX_PLATFORM_UPLOAD_BYTES / MIB)} MB limit — ${PLATFORM_LIMIT_HINT}`);
    let message = 'Conversion failed. Please try again.';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // Response wasn't JSON; fall back to the generic message above.
    }
    throw new Error(message);
  }
  const header = res.headers.get('X-Detected-Symbol-Fonts');
  return { blob: await res.blob(), detectedFonts: header ? header.split(',') : [] };
}
