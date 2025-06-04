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
