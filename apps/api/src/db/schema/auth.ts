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

export const userTable = sqliteTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: 'boolean' })
    .$defaultFn(() => false)
    .notNull(),
  image: text(),
  filesViewMode: text().$type<'list' | 'grid'>().default('list'),
  ...timeStamps,
});

export type User = InferSelectModel<typeof userTable>;

export const sessionTable = sqliteTable('session', {
  id: text().primaryKey(),
  expiresAt: integer({ mode: 'timestamp' }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  ...timeStamps,
});

export type Session = InferSelectModel<typeof sessionTable>;

export const accountTable = sqliteTable('account', {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
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

export type Account = InferSelectModel<typeof accountTable>;

export const verificationTable = sqliteTable('verification', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer({ mode: 'timestamp' }).notNull(),
  ...timeStamps,
});

export type Verification = InferSelectModel<typeof verificationTable>;

// Relations

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));
