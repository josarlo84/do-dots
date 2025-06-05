import { pgTable, text, serial, integer, boolean, timestamp, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from 'drizzle-orm';
import { z } from "zod";

// Person schema
export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  theme: text("theme").default("default").notNull(),
});

export const insertPersonSchema = createInsertSchema(people).pick({
  name: true,
  role: true,
  theme: true,
});

// Global Task schema
export const globalTasks = pgTable("global_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
});

export const insertGlobalTaskSchema = createInsertSchema(globalTasks).pick({
  title: true,
});

// Personal Task schema
export const personalTasks = pgTable("personal_tasks", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull(),
  title: text("title").notNull(),
});

export const insertPersonalTaskSchema = createInsertSchema(personalTasks).pick({
  personId: true,
  title: true,
});

// Task Completion schema
export const taskCompletions = pgTable("task_completions", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull(),
  taskId: integer("task_id").notNull(),
  taskType: text("task_type").notNull(), // 'global' or 'personal'
  completed: boolean("completed").default(false).notNull(),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
}, (t) => [ unique().on(t.taskId, t.personId, t.taskType, t.date) ]);

export const insertTaskCompletionSchema = createInsertSchema(taskCompletions).pick({
  personId: true,
  taskId: true,
  taskType: true,
  completed: true,
});

// Calendar Record schema
export const calendarRecords = pgTable("calendar_records", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  completedTasks: integer("completed_tasks").default(0).notNull(),
  totalTasks: integer("total_tasks").default(0).notNull(),
  isLevel2: boolean("is_level2").default(false).notNull(),
});

export const insertCalendarRecordSchema = createInsertSchema(calendarRecords).pick({
  personId: true,
  date: true,
  completedTasks: true,
  totalTasks: true,
  isLevel2: true,
});

// Type definitions
export type Person = typeof people.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;

export type GlobalTask = typeof globalTasks.$inferSelect;
export type InsertGlobalTask = z.infer<typeof insertGlobalTaskSchema>;

export type PersonalTask = typeof personalTasks.$inferSelect;
export type InsertPersonalTask = z.infer<typeof insertPersonalTaskSchema>;

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type InsertTaskCompletion = z.infer<typeof insertTaskCompletionSchema>;

export type CalendarRecord = typeof calendarRecords.$inferSelect;
export type InsertCalendarRecord = z.infer<typeof insertCalendarRecordSchema>;

// Frontend-specific types that combine data from multiple tables
export type Task = {
  id: number;
  title: string;
  completed: boolean;
  type: 'global' | 'personal';
};

export type PersonWithTasks = Person & {
  globalTasks: Task[];
  personalTasks: Task[];
  completedTasks: number;
  totalTasks: number;
  progress: number;
  isLevel2: boolean;
};

export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  completedTasks: number;
  totalTasks: number;
  isLevel2: boolean;
};
