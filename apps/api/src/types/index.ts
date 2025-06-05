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

export type BucketContent = {
  '?xml': '';
  ListBucketResult: {
    Name: string;
    Contents: Content | Content[];
  };
};
