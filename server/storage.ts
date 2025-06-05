// import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg'; // Import the entire 'pg' module as default
import * as schema from '@shared/schema'; // Import your schema definitions

import { formatISO, startOfDay, endOfDay, addDays, subDays, parseISO } from "date-fns";
import { eq, and, gt, gte, lt } from "drizzle-orm";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Initialize Postgres connection using Drizzle
const db = drizzle(process.env.DATABASE_URL);

const result2 = await db.select().from(schema.people);
console.log("TEST: Result2 is ", result2);

// Storage interface
export interface IStorage {
  // Person methods
  getPeople(): Promise<Person[]>;
  getPerson(id: number): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined>;
  deletePerson(id: number): Promise<boolean>;

  // Global Task methods
  getGlobalTasks(): Promise<GlobalTask[]>;
  getGlobalTask(id: number): Promise<GlobalTask | undefined>;
  createGlobalTask(task: InsertGlobalTask): Promise<GlobalTask>;
  updateGlobalTask(id: number, task: Partial<InsertGlobalTask>): Promise<GlobalTask | undefined>;
  deleteGlobalTask(id: number): Promise<boolean>;

  // Personal Task methods
  getPersonalTasks(personId: number): Promise<PersonalTask[]>;
  getPersonalTask(id: number): Promise<PersonalTask | undefined>;
  createPersonalTask(task: InsertPersonalTask): Promise<PersonalTask>;
  updatePersonalTask(id: number, task: Partial<InsertPersonalTask>): Promise<PersonalTask | undefined>;
  deletePersonalTask(id: number): Promise<boolean>;

  // Task Completion methods
  getTaskCompletions(personId: number): Promise<TaskCompletion[]>;
  getTaskCompletion(personId: number, taskId: number, taskType: string): Promise<TaskCompletion | undefined>;
  setTaskCompletion(data: InsertTaskCompletion): Promise<TaskCompletion>;
  updateTaskCompletion(id: number, data: Partial<InsertTaskCompletion>): Promise<TaskCompletion | undefined>;

  // Calendar methods
  getCalendarRecords(personId: number, startDate: Date, endDate: Date): Promise<CalendarRecord[]>;
  getAllCalendarRecords(personId: number): Promise<CalendarRecord[]>;
  updateCalendarRecord(personId: number, date: Date, data: Partial<InsertCalendarRecord>): Promise<CalendarRecord>;

  // Combined data methods
  getPersonWithTasks(id: number): Promise<PersonWithTasks | undefined>;
  getPeopleWithTasks(): Promise<PersonWithTasks[]>;
  getCalendarDays(personId: number, year: number, month: number): Promise<CalendarDay[]>;
  getAllPeopleCalendarDays(year: number, month: number): Promise<{ personId: number, name: string, days: CalendarDay[] }[]>;
}

export class DBStorage implements IStorage {
  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    console.log("DEBUG: DATABASE_URL from process.env:", dbUrl);

    const methods = Object.getOwnPropertyNames(db).filter(
      (property) => typeof db[property as keyof MyClass] === 'function'
    );

    console.log("db methods: ", methods);
  }

  private getTaskCompletionKey(personId: number, taskId: number, taskType: string): string {
    return `${personId}-${taskId}-${taskType}`;
  }

  private getCalendarRecordKey(personId: number, date: Date): string {
    return `${personId}-${formatISO(startOfDay(date), { representation: 'date' })}`;
  }

  // Person methods
  // ✅ Store a new person in the database
  async createPerson(person: InsertPerson) {
    console.log("TEST: createPerson(" + person +")");
    const [newPerson] = await db.insert(schema.people).values(person).returning();
    console.log("TEST: createPerson(" + person +")");
    return newPerson;
  }

  // ✅ Retrieve all people from the database
async getPeople() {
  console.log("TEST: getting people");
  try {
    let retV = await db.select().from(schema.people);
    console.log(`TEST: got ${retV.length} people`); // Log the length or actual data
    return retV;
  } catch (error) {
    console.error("TEST: Error getting people:", error);
    // Rethrow the error or handle it as appropriate for your application
    throw error;
  }
}
  // ✅ Get a single person by ID
  async getPerson(id: number) {
    const [person] = await db.select().from(schema.people).where(eq(schema.people.id, id)).limit(1);
    console.log(`TEST: getPerson(${id}) return ${JSON.stringify(person)}`);
    return person;
  }

  async updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined> {
    const existingPerson = await this.getPerson(id);
    if (!existingPerson) return undefined;

    const updatedPerson = { ...existingPerson, ...person };

    db.update(schema.people).set({id: updatedPerson.id, name: updatedPerson.name, role: updatedPerson.role, theme: updatedPerson.theme }).
      where(eq(schema.people.id, updatedPerson.id));
    return updatedPerson;
  }

  async deletePerson(id: number): Promise<boolean> {
    await db.delete(schema.taskCompletions).where(eq(schema.taskCompletions.personId, id));
    await db.delete(schema.personalTasks).where(eq(schema.personalTasks.personId, id));
    await db.delete(schema.calendarRecords).where(eq(schema.calendarRecords.personId, id));
    return await db.delete(schema.people).where(eq(schema.people.id, id));
  }

  // Global Task methods
  async createGlobalTask(task: InsertGlobalTask): Promise<GlobalTask> {
    return db.insert(schema.globalTasks).values(task).returning();

    // // Create task completions for all people
    // const people = await this.getPeople();
    // for (const person of people) {
    //   await this.setTaskCompletion({
    //     personId: person.id,
    //     taskId: newTask.id,
    //     taskType: 'global',
    //     completed: false
    //   });
    // }

  }


  // ✅ Get all global tasks
  async getGlobalTasks() {
    return await db.select().from(schema.globalTasks);
  }

  async getGlobalTask(id: number): Promise<GlobalTask | undefined> {
    return await db.select().from(schema.globalTasks).where(eq(schema.globalTasks.id, id));
  }

  async updateGlobalTask(id: number, task: Partial<InsertGlobalTask>): Promise<GlobalTask | undefined> {
    const existingTask = this.getGlobalTask(id);
    if (!existingTask) return undefined;

    const updatedTask = { ...existingTask, ...task };
    await db.update(schema.globalTasks)
      .set(updatedTask)
      .where(eq(schema.globalTasks.id, id));
    return updatedTask;
  }

  async deleteGlobalTask(id: number): Promise<boolean> {
    const task = await this.getGlobalTask(id);
    if (task == undefined) return false;

    // Delete all related task completions
    const taskCompletions = db.delete(schema.taskCompletions).where(and(
      eq(schema.taskCompletions.id, id),
      eq(schema.taskCompletions.taskType, 'global')));

    // Update all calendar records
    const people = await this.getPeople();
    for (const person of people) {
      const completions = await this.getTaskCompletions(person.id);
      for (const completion of completions) {
        const date = new Date(completion.date);
        await db.delete(schema.calendarRecords).where(and(eq(schema.calendarRecords.personId, person.id),
                                                          eq(schema.calendarRecords.date, date)));
      }
    }

    await db.delete(schema.globalTasks).where(and(eq(schema.globalTasks.id, id)));
    return taskCompletions;
  }

  async getPersonalTask(id: number): Promise<PersonalTask | undefined> {
    const [personalTask] = await db.select().from(schema.personalTasks).where(eq(schema.personalTasks.id, id)).limit(1);
    return personalTask;
  }

  // ✅ Create a personal task
  async createPersonalTask(task: InsertPersonalTask) {
    return db.insert(schema.personalTasks).values(task).returning();
    // const [newTask] = await db.insert(schema.personalTasks).values(task).returning();

    // // Create task completion
    // await this.setTaskCompletion({
    //   personId: task.personId,
    //   taskId: id,
    //   taskType: 'personal',
    //   completed: false
    // });

    // return newTask;
  }

  async updatePersonalTask(id: number, task: Partial<InsertPersonalTask>): Promise<PersonalTask | undefined> {
    const existingTask = await this.getPersonalTask(id);
    if (!existingTask) return undefined;

    const updatedTask = {...existingTask, ...task};

    await db.update(schema.personalTasks)
      .set(updatedTask)
      .where(eq(schema.personalTasks.id, id));

    // await db.update(schema.personalTasks)
    //   .set({ title: updatedTask.title})
    //   .where(eq(schema.personalTasks.id, id));

    return updatedTask;
  }

  async deletePersonalTask(id: number): Promise<boolean> {
    const task = await this.getPersonalTask(id);
    if (!task) return false;

    // Delete all related task completions
    const taskCompletions = db.delete(schema.taskCompletions).where(and(
      eq(schema.taskCompletions.personId, id),
      eq(schema.taskCompletions.taskType, 'personal')
    ));

    // Update calendar records
    const person = await this.getPerson(task.personId);
    if (person) {
      const completions = await this.getTaskCompletions(person.id);
      for (const completion of completions) {
        const date = new Date(completion.date);
        await db.delete(schema.calendarRecords).where(and(eq(schema.calendarRecords.personId, person.id),
                                                          eq(schema.calendarRecords.date, date)));
      }
    }

    await db.delete(schema.personalTasks).where(and(eq(schema.personalTasks.id, id)));
    return true;
  }

  // ✅ Get all personal tasks for a specific person
  async getPersonalTasks(personId: number) {
    return await db
      .select()
      .from(schema.personalTasks)
      .where(eq(schema.personalTasks.personId, personId));
  }

  // ✅ Record task completion
  async setTaskCompletion(data: InsertTaskCompletion) {
    console.log(`TEST: setTaskCompletion(${JSON.stringify(data)})`);
    const today = new Date();
    const [existing] = await db
      .insert(schema.taskCompletions)
      .values(data)
      .onConflictDoUpdate({target: [ schema.taskCompletions.taskId,
                                     schema.taskCompletions.personId,
                                     schema.taskCompletions.taskType,
                                     schema.taskCompletions.date ],
                           set: {
                             completed: data.completed,
                             date: today,
                           },
                          })
      .returning();

    return existing;
  }

  // ✅ Get task completions for a person
  async getTaskCompletions(personId: number) {
    return await db
      .select()
      .from(schema.taskCompletions)
      .where(eq (schema.taskCompletions.personId, personId));
  }

  async getTaskCompletion(personId: number, taskId: number, taskType: string): Promise<TaskCompletion | undefined> {
    const key = this.getTaskCompletionKey(personId, taskId, taskType);
    const [taskCompletion] = db
      .select()
      .from(schema.taskCompletions)
      .where(and(eq(schema.taskCompletions.taskId, taskId),
                 eq(schema.taskCompletions.personId, personId)))
      .limit(1);
    return taskCompletion;
  }

  // Combined data methods
  async getPersonWithTasks(id: number): Promise<PersonWithTasks | undefined> {
    console.log("TEST: getPersonWithTasks");
    const person = await this.getPerson(id);
    if (!person) return undefined;

    console.log("TEST: Retrieve task completions");
    const completions = await this.getTaskCompletions(id);
    console.log("TEST: Retrieve global tasks");
    const globalTasks = await this.getGlobalTasks();
    console.log("TEST: Retrieve personal tasks");
    const personalTasks = await this.getPersonalTasks(id);

    const formattedGlobalTasks: Task[] = globalTasks.map(task => {
      const completion = completions.find(c => c.taskId === task.id && c.taskType === 'global');
      return {
        id: task.id,
        title: task.title,
        completed: completion?.completed || false,
        type: 'global'
      };
    });

    const formattedPersonalTasks: Task[] = personalTasks.map(task => {
      const completion = completions.find(c => c.taskId === task.id && c.taskType === 'personal');
      return {
        id: task.id,
        title: task.title,
        completed: completion?.completed || false,
        type: 'personal'
      };
    });

    const allTasks = [...formattedGlobalTasks, ...formattedPersonalTasks];
    const completedTasks = allTasks.filter(t => t.completed).length;
    const totalTasks = allTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const isLevel2 = totalTasks > 0 ? completedTasks === totalTasks : false;

    const retV = {
      ...person,
      globalTasks: formattedGlobalTasks,
      personalTasks: formattedPersonalTasks,
      completedTasks,
      totalTasks,
      progress,
      isLevel2
    };
    console.log(`TEST: Returning ${JSON.stringify(retV)}`);
    return retV;
  }

  async getPeopleWithTasks(): Promise<PersonWithTasks[]> {
    const people = await this.getPeople();
    const result: PersonWithTasks[] = [];

    for (const person of people) {
      const personWithTasks = await this.getPersonWithTasks(person.id);
      if (personWithTasks) {
        result.push(personWithTasks);
      }
    }

    return result;
  }

  // Calendar methods
  async getCalendarRecords(personId: number, startDate: Date, endDate: Date): Promise<CalendarRecord[]> {
    return db.select().from(calendarRecords).where(and(eq(schema.calendarRecords.personId, personId), gte(calendarRecords.date, startDate)), lt(CalendarRecord.date, endDate));
  }

  async getAllCalendarRecords(personId: number): Promise<CalendarRecord[]> {
    return db.select().from(calendarRecords).where(eq(schema.calendarRecords.personId, personId));
  }

  async updateCalendarRecord(personId: number, date: Date, data: Partial<InsertCalendarRecord>): Promise<CalendarRecord> {
    const existing = db.select().from(calendarRecords).where(and(eq(schema.calendarRecords.personId, personId), eq(calendarRecords.date, date)));

    if (existing) {
      const updated = { ...existing, ...data };
      db.update(schema.calendarRecords).set({personId: updated.personId, date: updated.date, completedTasks: updated.completedTasks, totalTasks: updated.totalTasks, isLevel2: updated.isLevel2}).where(eq(calendarRecords.personId, updated.personId));
      return updated;
    }


    const newRecord: CalendarRecord = {
      personId,
      date,
      completedTasks: data.completedTasks || 0,
      totalTasks: data.totalTasks || 0,
      isLevel2: data.isLevel2 || false
    };

    await db.insert(schema.calendarRecords).values(newRecord);
    return newRecord;
  }

    // Helper method to update calendar when task completion changes
    private async updateCalendarForPerson(personId: number, date: Date): Promise<void> {
      const completions = await this.getTaskCompletions(personId);
      const dayCompletions = completions.filter(c => {
        const completionDate = new Date(c.date);
        return completionDate.getDate() === date.getDate() &&
          completionDate.getMonth() === date.getMonth() &&
          completionDate.getFullYear() === date.getFullYear();
      });

      const totalTasks = dayCompletions.length;
      const completedTasks = dayCompletions.filter(c => c.completed).length;
      const isLevel2 = totalTasks > 0 ? completedTasks === totalTasks : false;

      await this.updateCalendarRecord(personId, date, {
        completedTasks,
        totalTasks,
        isLevel2
      });
    }

    // Combined data methods
    async getCalendarDays(personId: number, year: number, month: number): Promise<CalendarDay[]> {
      // Create the date range for the month
      const startDate = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = new Date(year, month - 1, lastDay);

      // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
      const firstDayOfWeek = startDate.getDay();

      // Calculate previous month days to include
      const prevMonthDays = firstDayOfWeek;
      const startDateWithPrevMonth = subDays(startDate, prevMonthDays);

      // Calculate next month days to include (to make a complete grid)
      const totalDaysToShow = 42; // 6 weeks, always showing a complete grid
      const daysInMonth = lastDay;
      const nextMonthDays = totalDaysToShow - daysInMonth - prevMonthDays;
      const endDateWithNextMonth = addDays(endDate, nextMonthDays);

      // Get calendar records for the extended date range
      const records = await this.getCalendarRecords(personId, startDateWithPrevMonth, endDateWithNextMonth);

      // Create calendar days
      const days: CalendarDay[] = [];
      let currentDate = new Date(startDateWithPrevMonth);

      while (currentDate <= endDateWithNextMonth) {
        const isCurrentMonth =
          currentDate.getMonth() === month - 1 &&
          currentDate.getFullYear() === year;

        const dayKey = this.getCalendarRecordKey(personId, currentDate);
        const record = records.find(r => {
          const recordDate = new Date(r.date);
          return recordDate.getDate() === currentDate.getDate() &&
            recordDate.getMonth() === currentDate.getMonth() &&
            recordDate.getFullYear() === currentDate.getFullYear();
        });

        days.push({
          date: new Date(currentDate),
          isCurrentMonth,
          completedTasks: record?.completedTasks || 0,
          totalTasks: record?.totalTasks || 0,
          isLevel2: record?.isLevel2 || false
        });

        currentDate = addDays(currentDate, 1);
      }

      return days;
    }

    async getAllPeopleCalendarDays(year: number, month: number): Promise<{ personId: number, name: string, days: CalendarDay[] }[]> {
      const people = await this.getPeople();
      const result = [];

      for (const person of people) {
        const days = await this.getCalendarDays(person.id, year, month);
        result.push({
          personId: person.id,
          name: person.name,
          days
        });
      }

      return result;
    }
}

export const storage = new DBStorage();
