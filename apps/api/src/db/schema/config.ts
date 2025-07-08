import { type InferSelectModel, relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { customAlphabet } from 'nanoid';

import { userTable } from './auth';

const nanoid = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
  24
);

const timeStamps = {
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

export const configTable = sqliteTable('config', {
  id: text().primaryKey().$defaultFn(nanoid),
  encryptedCredentials: text().notNull(), // AES-256-GCM encrypted JSON
  wrappedDek: text().notNull(), // DEK wrapped with user's KEK
  salt: text().notNull(), // For PBKDF2 key derivation
  iv: text().notNull(), // Initialization vector for AES-GCM
  userId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  ...timeStamps,
});

export type Config = InferSelectModel<typeof configTable>;

export const configRelations = relations(configTable, ({ one }) => ({
  user: one(userTable, {
    fields: [configTable.userId],
    references: [userTable.id],
  }),
}));
