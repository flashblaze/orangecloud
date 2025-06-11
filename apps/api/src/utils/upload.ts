import type { AwsClient } from 'aws4fetch';

interface MultipartUploadPart {
  partNumber: number;
  etag: string;
  size?: number;
}

export const generatePresignedUploadUrl = async (
  aws: AwsClient,
  accountId: string,
  bucketName: string,
  key: string,
  expiresIn = 7200 // 2 hours
): Promise<string> => {
  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(key)}`;
  const urlObj = new URL(url);
  urlObj.searchParams.set('X-Amz-Expires', expiresIn.toString());

  const request = new Request(urlObj.toString(), { method: 'GET' });
  const signedUrl = await aws.sign(request, {
    aws: {
      signQuery: true,
    },
  });

  return signedUrl.url;
};

export const initializeMultipartUpload = async (
  aws: AwsClient,
  accountId: string,
  bucketName: string,
  key: string,
  contentType: string | undefined
): Promise<string> => {
  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(key)}?uploads`;

  const headers: Record<string, string> = {
    'Content-Type': contentType || 'application/octet-stream',
  };

  const response = await aws.fetch(url, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to initialize multipart upload: ${response.status}`);
  }

  const text = await response.text();
  const uploadIdMatch = text.match(/<UploadId>([^<]+)<\/UploadId>/);

  if (!uploadIdMatch) {
    throw new Error('Failed to extract upload ID from response');
  }

  return uploadIdMatch[1];
};

export const generateMultipartUploadUrls = async (
  aws: AwsClient,
  accountId: string,
  bucketName: string,
  key: string,
  uploadId: string,
  partCount: number,
  expiresIn = 7200 // 2 hours
): Promise<string[]> => {
  const urls: string[] = [];

  for (let partNumber = 1; partNumber <= partCount; partNumber++) {
    const url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(key)}`;
    const urlObj = new URL(url);
    urlObj.searchParams.set('partNumber', partNumber.toString());
    urlObj.searchParams.set('uploadId', uploadId);
    urlObj.searchParams.set('X-Amz-Expires', expiresIn.toString());

    const request = new Request(urlObj.toString(), { method: 'PUT' });
    const signedUrl = await aws.sign(request, {
      aws: {
        signQuery: true,
      },
    });

    urls.push(signedUrl.url);
  }

  return urls;
};

export const completeMultipartUpload = async (
  aws: AwsClient,
  accountId: string,
  bucketName: string,
  key: string,
  uploadId: string,
  parts: MultipartUploadPart[]
): Promise<void> => {
  const url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(key)}?uploadId=${uploadId}`;

  // Sort parts by part number
  const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);

  // Create XML body for completion
  const partsXml = sortedParts
    .map(
      (part) => `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${part.etag}</ETag></Part>`
    )
    .join('');

  const completeBody = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`;

  const response = await aws.fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
    },
    body: completeBody,
  });

  if (!response.ok) {
    throw new Error(`Failed to complete multipart upload: ${response.status}`);
  }
};
