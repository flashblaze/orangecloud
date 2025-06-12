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
export const MOBILE_CHUNK_SIZE = 3 * 1024 * 1024; // 3MB chunks for mobile (reduced for stability)
export const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold
export const MOBILE_MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB threshold for mobile (use multipart for better reliability)

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

  console.log(`Starting simple upload on ${mobile ? 'mobile' : 'desktop'} device:`, {
    fileName,
    fileSize: file.size,
  });

  // Get presigned URL
  const urlResponse = await fetch(
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

  if (!urlResponse.ok) {
    const error = await urlResponse.json().catch(() => ({ message: 'Failed to get upload URL' }));
    // @ts-expect-error
    throw new Error(error.message || 'Failed to get upload URL');
  }

  const { data } = (await urlResponse.json()) as { data: UploadSimpleFileResponse };
  const { uploadUrl } = data;

  console.log('Generated presigned URL for simple upload');

  // Use fetch API for better mobile compatibility
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), mobile ? 300000 : 120000); // 5 min mobile, 2 min desktop

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
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (progressInterval) clearInterval(progressInterval);

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    // Final progress update
    if (onProgress) {
      const progress = calculateProgress(startTime, file.size, file.size);
      onProgress(progress);
    }

    console.log('Simple upload completed successfully');
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (progressInterval) clearInterval(progressInterval);

    if (error.name === 'AbortError') {
      throw new Error(signal?.aborted ? 'Upload cancelled' : 'Upload timeout');
    }
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
  console.log(`Starting multipart upload on ${isMobile() ? 'mobile' : 'desktop'} device:`, {
    fileName,
    fileSize: file.size,
    chunkSize,
    partCount,
    concurrency,
    connectionQuality,
  });

  try {
    // Initialize multipart upload
    const initResponse = await fetch(
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

    if (!initResponse.ok) {
      const error = await initResponse
        .json()
        .catch(() => ({ message: 'Failed to initialize multipart upload' }));
      // @ts-expect-error
      throw new Error(error.message || 'Failed to initialize multipart upload');
    }

    const { data } = (await initResponse.json()) as { data: UploadMultipartFileResponse };
    uploadId = data.uploadId;
    fileKey = data.fileKey;
    const { partUrls } = data;

    // Notify parent about uploadId and fileKey for cancellation
    if (uploadId && fileKey) {
      onUploadIdReceived?.(uploadId, fileKey);
    }

    // Upload parts with adaptive concurrency
    const uploadedParts: Array<{ partNumber: number; etag: string }> = [];
    let uploadedBytes = 0;

    const uploadPart = async (partNumber: number, partUrl: string, retries = 3): Promise<void> => {
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const partData = file.slice(start, end);

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // Use fetch API for better mobile compatibility
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

          if (signal) {
            signal.addEventListener('abort', () => controller.abort());
          }

          // Track progress manually
          let lastProgress = 0;
          const progressInterval = setInterval(() => {
            if (onProgress && lastProgress < partData.size) {
              // Estimate progress based on time (fallback when fetch doesn't provide progress)
              const estimatedProgress = Math.min(lastProgress + partData.size * 0.1, partData.size);
              const totalUploaded = uploadedBytes + estimatedProgress;
              const progress = calculateProgress(startTime, totalUploaded, file.size);
              onProgress(progress);
              lastProgress = estimatedProgress;
            }
          }, 500);

          const response = await fetch(partUrl, {
            method: 'PUT',
            body: partData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          clearInterval(progressInterval);

          if (!response.ok) {
            throw new Error(`Part ${partNumber} upload failed with status ${response.status}`);
          }

          const etag = response.headers.get('ETag');
          if (etag) {
            uploadedParts.push({ partNumber, etag: etag.replace(/"/g, '') });
            uploadedBytes += partData.size;

            // Final progress update for this part
            if (onProgress) {
              const progress = calculateProgress(startTime, uploadedBytes, file.size);
              onProgress(progress);
            }
          }

          // Success - break retry loop
          console.log(`Part ${partNumber} uploaded successfully`);
          break;
        } catch (error: any) {
          console.warn(`Part ${partNumber} attempt ${attempt} failed:`, error);

          if (attempt === retries) {
            throw error; // Last attempt failed
          }

          // Shorter retry delay for mobile
          const delay = Math.min(500 * 2 ** (attempt - 1), 2000);
          console.log(`Retrying part ${partNumber} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
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
    const completeResponse = await fetch(`${apiUrl}/buckets/${bucketName}/complete-multipart`, {
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

    if (!completeResponse.ok) {
      const error = await completeResponse
        .json()
        .catch(() => ({ message: 'Failed to complete multipart upload' }));
      // @ts-expect-error
      throw new Error(error.message || 'Failed to complete multipart upload');
    }
  } catch (error) {
    // If we have uploadId and fileKey, and the error is due to cancellation, abort the multipart upload
    if (uploadId && fileKey && signal?.aborted) {
      try {
        await fetch(`${apiUrl}/buckets/${bucketName}/abort-multipart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uploadId,
            fileKey,
          }),
        });
        console.log(`Aborted multipart upload ${uploadId} for ${fileKey}`);
      } catch (abortError) {
        console.error('Failed to abort multipart upload:', abortError);
      }
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

  if (shouldUseMultipart(file.size)) {
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
