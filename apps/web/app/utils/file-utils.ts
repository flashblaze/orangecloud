const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];

const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', '3gp'];

const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'opus', 'aiff', 'au'];

const pdfExtensions = ['pdf'];

export const codeExtensions = [
  'astro',
  'bat',
  'c',
  'clj',
  'cpp',
  'cs',
  'css',
  'dart',
  'erl',
  'ex',
  'go',
  'groovy',
  'h',
  'hs',
  'html',
  'java',
  'js',
  'json',
  'jsx',
  'kt',
  'lua',
  'm',
  'ml',
  'md',
  'php',
  'pl',
  'ps1',
  'py',
  'r',
  'rb',
  'rs',
  'rtf',
  'scala',
  'scm',
  'sh',
  'sql',
  'swift',
  'toml',
  'ts',
  'tsx',
  'xml',
];

export const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot !== -1 ? fileName.slice(lastDot + 1).toLowerCase() : '';
};

export const isImageFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName);
  return imageExtensions.includes(extension);
};

export const isVideoFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName);
  return videoExtensions.includes(extension);
};

export const isAudioFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName);
  return audioExtensions.includes(extension);
};

export const isPdfFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName);
  return pdfExtensions.includes(extension);
};

export const isCodeFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName);
  return codeExtensions.includes(extension);
};

export const isPreviewableFile = (fileName: string): boolean => {
  return (
    isImageFile(fileName) ||
    isVideoFile(fileName) ||
    isAudioFile(fileName) ||
    isPdfFile(fileName) ||
    isCodeFile(fileName)
  );
};

export const getPreviewType = (
  fileName: string
): 'image' | 'video' | 'audio' | 'pdf' | 'code' | null => {
  if (isImageFile(fileName)) return 'image';
  if (isVideoFile(fileName)) return 'video';
  if (isAudioFile(fileName)) return 'audio';
  if (isPdfFile(fileName)) return 'pdf';
  if (isCodeFile(fileName)) return 'code';
  return null;
};
