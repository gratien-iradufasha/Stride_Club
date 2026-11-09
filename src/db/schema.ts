import { relations } from 'drizzle-orm';
import { integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Runner'),
  avatarUrl: text('avatar_url'),
  paceGroup: text('pace_group').default('Intermediate (5:30/km)'),
  bio: text('bio').default('Marathon trainer & weekend trail runner'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  creatorUid: text('creator_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  distanceKm: numeric('distance_km', { precision: 5, scale: 2 }).notNull(),
  paceCategory: text('pace_category').notNull(), // 'Social / Easy', 'Steady', 'Tempo', 'Intervals', 'All Paces'
  targetPace: text('target_pace').notNull(), // e.g. '5:30 /km'
  runDate: text('run_date').notNull(), // YYYY-MM-DD
  runTime: text('run_time').notNull(), // HH:MM
  locationName: text('location_name').notNull(),
  locationAddress: text('location_address').notNull(),
  terrain: text('terrain').notNull().default('Road'), // 'Road', 'Trail', 'Track', 'Mixed'
  maxParticipants: integer('max_participants').default(30),
  postRunSocial: text('post_run_social'),
  gearNotes: text('gear_notes'),
  elevationMeters: integer('elevation_meters').default(40),
  createdAt: timestamp('created_at').defaultNow(),
});

export const runRsvps = pgTable('run_rsvps', {
  id: serial('id').primaryKey(),
  runId: integer('run_id')
    .notNull()
    .references(() => runs.id, { onDelete: 'cascade' }),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  status: text('status').notNull().default('going'),
  paceNote: text('pace_note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const runComments = pgTable('run_comments', {
  id: serial('id').primaryKey(),
  runId: integer('run_id')
    .notNull()
    .references(() => runs.id, { onDelete: 'cascade' }),
  userUid: text('user_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  authorAvatar: text('author_avatar'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  creatorUid: text('creator_uid')
    .notNull()
    .references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  distanceKm: numeric('distance_km', { precision: 5, scale: 2 }).notNull(),
  difficulty: text('difficulty').notNull().default('Moderate'), // 'Easy', 'Moderate', 'Challenging', 'Epic'
  startLocation: text('start_location').notNull(),
  description: text('description'),
  terrain: text('terrain').notNull().default('Road'),
  elevationMeters: integer('elevation_meters').default(20),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  runs: many(runs),
  rsvps: many(runRsvps),
  comments: many(runComments),
  routes: many(routes),
}));

export const routesRelations = relations(routes, ({ one }) => ({
  creator: one(users, {
    fields: [routes.creatorUid],
    references: [users.uid],
  }),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  creator: one(users, {
    fields: [runs.creatorUid],
    references: [users.uid],
  }),
  rsvps: many(runRsvps),
  comments: many(runComments),
}));

export const runRsvpsRelations = relations(runRsvps, ({ one }) => ({
  run: one(runs, {
    fields: [runRsvps.runId],
    references: [runs.id],
  }),
  user: one(users, {
    fields: [runRsvps.userUid],
    references: [users.uid],
  }),
}));

export const runCommentsRelations = relations(runComments, ({ one }) => ({
  run: one(runs, {
    fields: [runComments.runId],
    references: [runs.id],
  }),
  user: one(users, {
    fields: [runComments.userUid],
    references: [users.uid],
  }),
}));
