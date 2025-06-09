import { cn } from '~/utils';
import IconCode from '~icons/solar/code-bold-duotone';
import IconFileText from '~icons/solar/file-bold-duotone';
import IconFolder from '~icons/solar/folder-bold-duotone';
import IconPhoto from '~icons/solar/gallery-round-bold-duotone';
import IconMusic from '~icons/solar/music-note-2-bold-duotone';
import IconVideo from '~icons/solar/videocamera-record-bold-duotone';
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

  // Code files
  if (
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'html',
      'css',
      'json',
      'xml',
      'py',
      'java',
      'cpp',
      'c',
      'php',
      'rb',
      'go',
      'rs',
    ].includes(extension)
  ) {
    return <IconCode className={cn(className, 'text-indigo-500 dark:text-indigo-400')} />;
  }

  // Text files
  if (['txt', 'md', 'doc', 'docx', 'pdf', 'rtf'].includes(extension)) {
    return <IconFileText className={cn(className, 'text-gray-600 dark:text-gray-400')} />;
  }

  // Default file icon
  return <IconFile className={cn(className, 'text-gray-600 dark:text-gray-400')} />;
};

export default FileIcon;
