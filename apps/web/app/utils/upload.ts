export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  error?: string;
  uploadId?: string; // For multipart uploads
  fileKey?: string; // For multipart uploads
  abortController?: AbortController;
}

interface UploadMultipartFileResponse {
  uploadId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  partCount: number;
  partUrls: string[];
  bucketName: string;
  prefix: string;
}

interface UploadSimpleFileResponse {
  uploadUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  bucketName: string;
  prefix: string;
}

export interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
  speed: number;
  timeRemaining: number;
}

export const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
export const MOBILE_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks for mobile (even smaller for stability)
export const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold
export const MOBILE_MULTIPART_THRESHOLD = 3 * 1024 * 1024; // 3MB threshold for mobile (even lower)

// Enhanced mobile detection with tablet support
const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent;
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const isMobileUA = mobileRegex.test(userAgent);

  // Also check for touch support and screen size
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;

  return isMobileUA || (hasTouch && isSmallScreen);
};

// Connection quality detection
const getConnectionQuality = (): 'fast' | 'medium' | 'slow' => {
  if (typeof window === 'undefined') return 'medium';

  try {
    // Use Network Information API if available
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      const downlink = connection.downlink; // Mbps
      const effectiveType = connection.effectiveType;

      if (effectiveType === '4g' && downlink > 10) return 'fast';
      if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1)) return 'medium';
      return 'slow';
    }
  } catch (error) {
    console.warn('Network Information API error:', error);
  }

  // Fallback: assume medium quality
  return 'medium';
};

// Get optimal settings based on device and connection
const getOptimalSettings = () => {
  const mobile = isMobile();

  if (mobile) {
    // Mobile browsers need very conservative settings
    return {
      chunkSize: MOBILE_CHUNK_SIZE,
      concurrency: 1, // Always sequential on mobile
    };
  }

  // Desktop settings
  return { chunkSize: CHUNK_SIZE, concurrency: 3 };
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s left`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes}m left`;
  }
  const hours = Math.round(seconds / 3600);
  return `${hours}h left`;
};

export const formatUploadSpeed = (bytesPerSecond: number): string => {
  return `${formatFileSize(bytesPerSecond)}/s`;
};

export const calculateProgress = (
  startTime: number,
  uploaded: number,
  total: number
): UploadProgress => {
  const percentage = total > 0 ? Math.round((uploaded / total) * 100) : 0;
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const speed = elapsed > 0 ? uploaded / elapsed : 0;
  const remaining = total - uploaded;
  const timeRemaining = speed > 0 ? remaining / speed : 0;

  return {
    uploaded,
    total,
    percentage,
    speed,
    timeRemaining,
  };
};

const shouldUseMultipart = (fileSize: number): boolean => {
  const threshold = isMobile() ? MOBILE_MULTIPART_THRESHOLD : MULTIPART_THRESHOLD;
  return fileSize > threshold;
};

export const calculatePartCount = (fileSize: number): number => {
  const { chunkSize } = getOptimalSettings();
  return Math.ceil(fileSize / chunkSize);
};

export const createUploadFile = (file: File): UploadFile => {
  return {
    id: generateUniqueId(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    progress: 0,
    status: 'pending',
    speed: 0,
    timeRemaining: 0,
    abortController: new AbortController(),
  };
};

export interface SimpleUploadOptions {
  bucketName: string;
  fileName: string;
  file: File;
  prefix?: string;
  apiUrl: string;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export const simpleUpload = async ({
  bucketName,
  fileName,
  file,
  prefix = '',
  apiUrl,
  onProgress,
  signal,
}: SimpleUploadOptions): Promise<void> => {
  const startTime = Date.now();
  const mobile = isMobile();

  console.info(`[${fileName}] Starting simple upload`, {
    device: mobile ? 'mobile' : 'desktop',
    fileSize: file.size,
    fileType: file.type || 'unknown',
    connection: (typeof navigator !== 'undefined' && (navigator as any).connection) || null,
  });

  // Get presigned URL
  const { data } = await fetchWithRetry(
    `${apiUrl}/buckets/${bucketName}/upload-url?prefix=${encodeURIComponent(prefix)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileSize: file.size,
        contentType: file.type,
      }),
      signal,
    }
  );
  const { uploadUrl } = data as UploadSimpleFileResponse;

  console.log(`[${fileName}] Generated presigned URL for simple upload`);

  // Use fetch API for better mobile compatibility
  const controller = new AbortController();
  // 15 min mobile, 5 min desktop
  const timeoutMs = mobile ? 900000 : 300000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  // Track progress manually for mobile
  let lastProgress = 0;
  const progressInterval = mobile
    ? setInterval(() => {
        if (onProgress && lastProgress < file.size) {
          // Estimate progress for mobile
          const estimatedProgress = Math.min(lastProgress + file.size * 0.05, file.size);
          const progress = calculateProgress(startTime, estimatedProgress, file.size);
          onProgress(progress);
          lastProgress = estimatedProgress;
        }
      }, 200)
    : null;

  try {
    await fetchWithRetry(
      uploadUrl,
      {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
        signal: controller.signal,
      },
      // Don't parse response as JSON for this request
      false
    );

    clearTimeout(timeoutId);
    if (progressInterval) clearInterval(progressInterval);

    // Final progress update
    if (onProgress) {
      const progress = calculateProgress(startTime, file.size, file.size);
      onProgress(progress);
    }

    console.log(`[${fileName}] Simple upload completed successfully`);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (progressInterval) clearInterval(progressInterval);

    if (error.name === 'AbortError') {
      console.error(`[${fileName}] Simple upload aborted`, { signalAborted: signal?.aborted });
      throw new Error(signal?.aborted ? 'Upload cancelled' : 'Upload timeout');
    }
    console.error(`[${fileName}] Simple upload failed`, error);
    throw error;
  }
};

export interface MultipartUploadOptions {
  bucketName: string;
  fileName: string;
  file: File;
  prefix?: string;
  apiUrl: string;
  onProgress?: (progress: UploadProgress) => void;
  onUploadIdReceived?: (uploadId: string, fileKey: string) => void;
  signal?: AbortSignal;
}

export const multipartUpload = async ({
  bucketName,
  fileName,
  file,
  prefix = '',
  apiUrl,
  onProgress,
  onUploadIdReceived,
  signal,
}: MultipartUploadOptions): Promise<void> => {
  const startTime = Date.now();
  const { chunkSize, concurrency } = getOptimalSettings();
  const partCount = Math.ceil(file.size / chunkSize);
  let uploadId: string | undefined;
  let fileKey: string | undefined;

  const connectionQuality = getConnectionQuality();
  console.info(`[${fileName}] Starting multipart upload`, {
    device: isMobile() ? 'mobile' : 'desktop',
    fileSize: file.size,
    fileType: file.type || 'unknown',
    chunkSize,
    partCount,
    concurrency,
    connectionQuality,
    connection: (typeof navigator !== 'undefined' && (navigator as any).connection) || null,
  });

  try {
    // Initialize multipart upload
    const { data: initData } = await fetchWithRetry(
      `${apiUrl}/buckets/${bucketName}/multipart-upload?prefix=${encodeURIComponent(prefix)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileSize: file.size,
          contentType: file.type,
          partCount,
        }),
        signal,
      }
    );

    const {
      uploadId: newUploadId,
      fileKey: newFileKey,
      partUrls,
    } = initData as UploadMultipartFileResponse;
    uploadId = newUploadId;
    fileKey = newFileKey;

    console.log(`[${fileName}] Initialized multipart upload with ID: ${uploadId}`);

    // Notify parent about uploadId and fileKey for cancellation
    if (uploadId && fileKey) {
      onUploadIdReceived?.(uploadId, fileKey);
    }

    // Upload parts with adaptive concurrency
    const uploadedParts: Array<{ partNumber: number; etag: string }> = [];
    let uploadedBytes = 0;

    const uploadPart = async (partNumber: number, partUrl: string): Promise<void> => {
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const partData = file.slice(start, end);

      const controller = new AbortController();
      // 15 min mobile, 5 min desktop per part
      const timeoutMs = isMobile() ? 900000 : 300000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      // Track progress manually
      let lastProgress = 0;
      const progressInterval = setInterval(() => {
        if (onProgress && lastProgress < partData.size) {
          // Estimate progress based on time
          const estimatedProgress = Math.min(lastProgress + partData.size * 0.1, partData.size);
          const totalUploaded = uploadedBytes + estimatedProgress;
          const progress = calculateProgress(startTime, totalUploaded, file.size);
          onProgress(progress);
          lastProgress = estimatedProgress;
        }
      }, 500);

      try {
        await fetchWithRetry(
          partUrl,
          {
            method: 'PUT',
            body: partData,
            signal: controller.signal,
          },
          false, // Don't parse response as JSON
          3, // Retry count for parts
          (response) => {
            const etag = response.headers.get('ETag');
            if (etag) {
              uploadedParts.push({ partNumber, etag: etag.replace(/"/g, '') });
              uploadedBytes += partData.size;

              // Final progress update for this part
              if (onProgress) {
                const progress = calculateProgress(startTime, uploadedBytes, file.size);
                onProgress(progress);
              }
              console.log(`[${fileName}] Part ${partNumber} uploaded successfully`);
            } else {
              // This case should be handled by fetchWithRetry throwing an error, but as a safeguard:
              throw new Error(`Part ${partNumber} upload failed: ETag missing`);
            }
          }
        );
      } catch (error: any) {
        console.warn(`[${fileName}] Part ${partNumber} failed after retries:`, error);
        throw error; // Propagate error to fail the upload
      } finally {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
      }
    };

    // Upload parts with adaptive concurrency control
    for (let i = 0; i < partUrls.length; i += concurrency) {
      const batch = partUrls.slice(i, i + concurrency);
      const batchPromises = batch.map((url: string, index: number) =>
        uploadPart(i + index + 1, url)
      );

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    // Complete multipart upload
    await fetchWithRetry(`${apiUrl}/buckets/${bucketName}/complete-multipart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId,
        fileKey,
        parts: uploadedParts.sort((a, b) => a.partNumber - b.partNumber),
      }),
      signal,
    });

    console.log(`[${fileName}] Completed multipart upload successfully`);
  } catch (error: any) {
    console.error(`[${fileName}] Multipart upload failed.`, error);

    // If we have uploadId and fileKey, and the error is due to cancellation, abort the multipart upload
    if (uploadId && fileKey && (signal?.aborted || error.name === 'AbortError')) {
      try {
        console.log(`[${fileName}] Aborting multipart upload ${uploadId}`);
        await fetchWithRetry(
          `${apiUrl}/buckets/${bucketName}/abort-multipart`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uploadId,
              fileKey,
            }),
          },
          true,
          0 // No retries for abort
        );
        console.log(`[${fileName}] Aborted multipart upload ${uploadId} for ${fileKey}`);
      } catch (abortError) {
        console.error(`[${fileName}] Failed to abort multipart upload:`, abortError);
      }
    }

    if (error.name === 'AbortError') {
      throw new Error(signal?.aborted ? 'Upload cancelled' : 'Upload timeout');
    }
    throw error;
  }
};

export interface UploadFileOptions {
  bucketName: string;
  file: File;
  prefix?: string;
  apiUrl: string;
  onProgress?: (progress: UploadProgress) => void;
  onUploadIdReceived?: (uploadId: string, fileKey: string) => void;
  signal?: AbortSignal;
}

export const uploadFile = async ({
  bucketName,
  file,
  prefix = '',
  apiUrl,
  onProgress,
  onUploadIdReceived,
  signal,
}: UploadFileOptions): Promise<void> => {
  const fileName = file.name;
  const useMultipart = shouldUseMultipart(file.size);

  console.log(
    `[${fileName}] Starting upload. Size: ${formatFileSize(file.size)}. Using ${
      useMultipart ? 'multipart' : 'simple'
    } upload.`
  );

  if (useMultipart) {
    return multipartUpload({
      bucketName,
      fileName,
      file,
      prefix,
      apiUrl,
      onProgress,
      onUploadIdReceived,
      signal,
    });
  }
  return simpleUpload({
    bucketName,
    fileName,
    file,
    prefix,
    apiUrl,
    onProgress,
    signal,
  });
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  parseJson = true,
  retries = 3,
  onSuccess?: (response: Response) => void
): Promise<any> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (options.signal?.aborted) {
        throw new Error('Request aborted before attempting.');
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = `${errorMessage}: ${errorBody}`;
        }
        throw new Error(errorMessage);
      }

      if (onSuccess) {
        onSuccess(response);
      }

      if (parseJson) {
        return await response.json();
      }
      return; // Success, no JSON parsing needed
    } catch (error: any) {
      lastError = error;

      // Detailed log for this failed attempt
      logNetworkError(attempt, url, options, error);

      if (options.signal?.aborted || error.name === 'AbortError') {
        throw lastError; // Don't retry on abort
      }

      if (attempt === retries) {
        break; // Don't wait after the last attempt
      }

      // Exponential backoff with jitter
      const baseDelay = isMobile() ? 2000 : 1000;
      const delay = Math.min(baseDelay * 2 ** (attempt - 1) + Math.random() * 1000, 30000);
      console.warn(`Retrying in ${Math.round(delay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Add a helper to log failed network attempts with rich contextual data
const logNetworkError = (attempt: number, url: string, options: RequestInit, error: any) => {
  console.warn('[upload][network] fetch attempt failed', {
    attempt,
    method: options.method || 'GET',
    url,
    headers: options.headers,
    aborted: options.signal?.aborted,
    errorName: error?.name,
    errorMessage: error?.message,
  });
};
