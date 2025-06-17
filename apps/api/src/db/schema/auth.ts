import { type InferSelectModel, relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timeStamps = {
  createdAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

export const user = sqliteTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: 'boolean' })
    .$defaultFn(() => false)
    .notNull(),
  image: text(),
  ...timeStamps,
});

export type User = InferSelectModel<typeof user>;

export const session = sqliteTable('session', {
  id: text().primaryKey(),
  expiresAt: integer({ mode: 'timestamp' }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ...timeStamps,
});

export type Session = InferSelectModel<typeof session>;

export const account = sqliteTable('account', {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text().notNull(),
  providerId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  accessTokenExpiresAt: integer({ mode: 'timestamp' }),
  refreshTokenExpiresAt: integer({ mode: 'timestamp' }),
  scope: text(),
  idToken: text(),
  password: text(),
  ...timeStamps,
});

export type Account = InferSelectModel<typeof account>;

export const verification = sqliteTable('verification', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer({ mode: 'timestamp' }).notNull(),
  ...timeStamps,
});

export type Verification = InferSelectModel<typeof verification>;

// Relations

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
