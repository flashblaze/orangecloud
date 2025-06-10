import type { AppType } from '../index';
import type { Env } from './hono-env.types';

export type ClientType = AppType;

export type AuthHonoEnv = Env;

type Content = {
  Key: string;
  Size: number;
  LastModified: string;
  ETag: string;
  StorageClass: string;
};

type CommonPrefix = {
  Prefix: string;
};

export type BucketContent = {
  '?xml': '';
  ListBucketResult: {
    Name: string;
    Contents: Content | Content[];
    CommonPrefixes?: CommonPrefix | CommonPrefix[];
    Prefix?: string;
    Delimiter?: string;
  };
};

export type FileSystemItem = {
  key: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
  etag?: string;
};

export type CustomDomain = {
  domain: string;
  enabled: boolean;
  status?: {
    ownership: 'active' | 'pending' | 'deactivated';
    ssl: 'active' | 'pending' | 'initializing' | 'error';
  };
  minTLS?: '1.0' | '1.1' | '1.2' | '1.3';
  zoneId?: string;
  zoneName?: string;
};
