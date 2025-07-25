import { cn, codeExtensions } from '~/utils';
import IconCode from '~icons/solar/code-bold-duotone';
import IconPdf from '~icons/solar/document-bold-duotone';
import IconFolder from '~icons/solar/folder-bold-duotone';
import IconPhoto from '~icons/solar/gallery-round-bold-duotone';
import IconMusic from '~icons/solar/music-note-2-bold-duotone';
import IconVideo from '~icons/solar/videocamera-bold-duotone';
import IconFile from '~icons/tabler/file';

interface FileIconProps {
  type: 'file' | 'folder';
  name: string;
  className?: string;
}

const FileIcon = ({ type, name, className = 'w-5 h-5' }: FileIconProps) => {
  if (type === 'folder') {
    return <IconFolder className={cn(className, 'text-blue-500 dark:text-blue-400')} />;
  }

  const extension = name.split('.').pop()?.toLowerCase() || '';

  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return <IconPhoto className={cn(className, 'text-emerald-500 dark:text-emerald-400')} />;
  }

  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return <IconVideo className={cn(className, 'text-violet-500 dark:text-violet-400')} />;
  }

  // Audio files
  if (['mp3', 'wav', 'aac', 'ogg', 'wma', 'flac'].includes(extension)) {
    return <IconMusic className={cn(className, 'text-orange-500 dark:text-orange-400')} />;
  }

  // PDF files
  if (extension === 'pdf') {
    return <IconPdf className={cn(className, 'text-red-500 dark:text-red-400')} />;
  }

  // Code files
  if (codeExtensions.includes(extension)) {
    return <IconCode className={cn(className, 'text-indigo-500 dark:text-indigo-400')} />;
  }

  // Default file icon
  return <IconFile className={cn(className, 'text-gray-600 dark:text-gray-400')} />;
};

export default FileIcon;
