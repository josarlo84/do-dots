import { 
  Person, InsertPerson, 
  GlobalTask, InsertGlobalTask,  globalTasks,
  PersonalTask, InsertPersonalTask, 
  TaskCompletion, InsertTaskCompletion, taskCompletions,
  CalendarRecord, InsertCalendarRecord,
  Task, PersonWithTasks, CalendarDay, people, personalTasks
} from "@shared/schema";
import { formatISO, startOfDay, endOfDay, addDays, subDays, parseISO } from "date-fns";
import { createClient } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

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
  updateCalendarRecord(personId: number, date: Date, data: Partial<InsertCalendarRecord>): Promise<CalendarRecord>;

  // Combined data methods
  getPersonWithTasks(id: number): Promise<PersonWithTasks | undefined>;
  getPeopleWithTasks(): Promise<PersonWithTasks[]>;
  getCalendarDays(personId: number, year: number, month: number): Promise<CalendarDay[]>;
  getAllPeopleCalendarDays(year: number, month: number): Promise<{ personId: number, name: string, days: CalendarDay[] }[]>;
}

export class DBStorage implements IStorage {
  private db;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    console.log("DEBUG: DATABASE_URL from process.env:", dbUrl);
    // Initialize Postgres connection using Drizzle
    const client = createClient({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(client);
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
    const [newPerson] = await this.db.insert(people).values(person).returning();
    console.log("TEST: createPerson(" + person +")");
    return newPerson;
  }

  // ✅ Retrieve all people from the database
async getPeople() {
  console.log("TEST: getting people");
  try {
    let retV = await this.db.select().from(people);
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
    return await this.db.select().from(people).where(sql`${people.id} = ${id}`).limit(1);
  }

  async updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined> {
    const existingPerson = this.people.get(id);
    if (!existingPerson) return undefined;

    const updatedPerson = { ...existingPerson, ...person };
    this.people.set(id, updatedPerson);
    return updatedPerson;
  }

  async deletePerson(id: number): Promise<boolean> {
    if (!this.people.has(id)) return false;

    // Delete all related task completions
    for (const [key, completion] of this.taskCompletions.entries()) {
      if (completion.personId === id) {
        this.taskCompletions.delete(key);
      }
    }

    // Delete all personal tasks
    for (const [key, task] of this.personalTasks.entries()) {
      if (task.personId === id) {
        this.personalTasks.delete(key);
      }
    }

    // Delete all calendar records
    for (const [key, record] of this.calendarRecords.entries()) {
      if (record.personId === id) {
        this.calendarRecords.delete(key);
      }
    }

    return this.people.delete(id);
  }

  // Global Task methods
  // ✅ Create a new global task
  async createGlobalTask(task: InsertGlobalTask) {
    return newTask;
  }
  async createGlobalTask(task: InsertGlobalTask): Promise<GlobalTask> {
    const id = this.currentGlobalTaskId++;
    const [newTask] = await this.db.insert(globalTasks).values(task).returning();
    this.globalTasks.set(id, newTask);

    // Create task completions for all people
    const people = await this.getPeople();
    for (const person of people) {
      await this.setTaskCompletion({
        personId: person.id,
        taskId: id,
        taskType: 'global',
        completed: false
      });
    }

    return newTask;
  }


  // ✅ Get all global tasks
  async getGlobalTasks() {
    return await this.db.select().from(globalTasks);
  }

  async getGlobalTask(id: number): Promise<GlobalTask | undefined> {
    return await this.db.select().from(globalTasks).where(sql `${global_tasks.id} = ${id}`);
  }

  async updateGlobalTask(id: number, task: Partial<InsertGlobalTask>): Promise<GlobalTask | undefined> {
    const existingTask = this.getGlobalTask(id);
    if (!existingTask) return undefined;

    const updatedTask = { ...existingTask, ...task };
    this.db.update(globalTasks).set({id: updatedTask.id, text: updatedTask.text});
    return updatedTask;
  }

  async deleteGlobalTask(id: number): Promise<boolean> {
    const task = await this.getGlobalTask(id);
    if (task == undefined) return false;

    // Delete all related task completions
    const taskCompletions = this.db.delete(taskCompletions).where(and(
      eq(taskCompletions.id, id),
      eq(taskCompletions.taskType, 'global')));

    // Update all calendar records
    const people = await this.getPeople();
    for (const person of people) {
      const completions = await this.getTaskCompletions(person.id);
      for (const completion of completions) {
        const date = new Date(completion.date);
        const key = this.getCalendarRecordKey(person.id, date);
        const record = this.calendarRecords.get(key);
        if (record) {
          const totalTasks = record.totalTasks - 1;
          const completedTasks = completion.completed ? record.completedTasks - 1 : record.completedTasks;
          const isLevel2 = totalTasks > 0 ? completedTasks === totalTasks : false;

          this.calendarRecords.set(key, {
            ...record,
            totalTasks,
            completedTasks,
            isLevel2
          });
        }
      }
    }

    return taskCompletions;
  }

  async getPersonalTask(id: number): Promise<PersonalTask | undefined> {
    return await this.db.select().from(personalTasks).where(sql `${personal_tasks.id} = ${id}`).limit(1);
  }

  // ✅ Create a personal task
  async createPersonalTask(task: InsertPersonalTask) {
    const [newTask] = await this.db.insert(personalTasks).values(task).returning();

    // Create task completion
    await this.setTaskCompletion({
      personId: task.personId,
      taskId: id,
      taskType: 'personal',
      completed: false
    });

    return newTask;
  }

  async updatePersonalTask(id: number, task: Partial<InsertPersonalTask>): Promise<PersonalTask | undefined> {
    const existingTask = this.getPersonalTask(id);
    if (!existingTask) return undefined;

    const updatedTask = { ...existingTask, ...task };
    this.db.update(personalTasks).values(updatedTask);
    return updatedTask;
  }

  async deletePersonalTask(id: number): Promise<boolean> {
    const task = this.getPersonalTask(id);
    if (!task) return false;

    this.db.delete(personal_tasks);
    const taskCompletions = this.db.delete(personalTasks).where(
      eq(personalTasks.id, id));

    // Update calendar records
    const person = await this.getPerson(task.personId);
    if (person) {
      const completions = await this.getTaskCompletions(person.id);
      for (const completion of completions) {
        const date = new Date(completion.date);
        const key = this.getCalendarRecordKey(person.id, date);
        const record = this.calendarRecords.get(key);
        if (record) {
          const totalTasks = record.totalTasks - 1;
          const completedTasks = completion.completed ? record.completedTasks - 1 : record.completedTasks;
          const isLevel2 = totalTasks > 0 ? completedTasks === totalTasks : false;

          this.calendarRecords.set(key, {
            ...record,
            totalTasks,
            completedTasks,
            isLevel2
          });
        }
      }
    }

    return personalTasks;
  }

  // ✅ Get all personal tasks for a specific person
  async getPersonalTasks(personId: number) {
    return await this.db
      .select()
      .from(personalTasks)
      .where(sql`${personal_tasks.personId} = ${personId}`);
  }

  // ✅ Record task completion
  async setTaskCompletion(data: InsertTaskCompletion) {
    const [existing] = await this.db.insert(taskCompletions).values(data).returning();

    if (existing) {
      const updated = { ...existing, ...data };
      this.taskCompletions.set(key, updated);

      // Update calendar record
      await this.updateCalendarForPerson(data.personId, new Date());

      return updated;
    }

      const id = this.currentTaskCompletionId++;
      const newCompletion: TaskCompletion = {
        id,
        personId: data.personId,
        taskId: data.taskId,
        taskType: data.taskType,
        completed: data.completed ?? false,
        date: new Date()
      };
      this.taskCompletions.set(key, newCompletion);

      // Update calendar record
      await this.updateCalendarForPerson(data.personId, new Date());

      return newCompletion;
    }

    async updateTaskCompletion(id: number, data: Partial<InsertTaskCompletion>): Promise<TaskCompletion | undefined> {
      // Find the completion by id
      let foundKey: string | undefined;
      let foundCompletion: TaskCompletion | undefined;

      for (const [key, completion] of this.taskCompletions.entries()) {
        if (completion.id === id) {
          foundKey = key;
          foundCompletion = completion;
          break;
        }
      }

      if (!foundKey || !foundCompletion) return undefined;

      const updatedCompletion = { ...foundCompletion, ...data };
      this.taskCompletions.set(foundKey, updatedCompletion);

      // Update calendar record
      await this.updateCalendarForPerson(updatedCompletion.personId, new Date(updatedCompletion.date));

      return updatedCompletion;
    }

  // ✅ Get task completions for a person
  async getTaskCompletions(personId: number) {
    return await this.db
      .select()
      .from(taskCompletions)
      .where(sql`${task_completions.personId} = ${personId}`);
  }

  async getTaskCompletion(personId: number, taskId: number, taskType: string): Promise<TaskCompletion | undefined> {
    const key = this.getTaskCompletionKey(personId, taskId, taskType);
    const [taskCompletion] = this.db
      .select()
      .from(taskCompletions)
      .where(sql `${taksCompletions.id} = ${taskCompletionKey}`)
      .limit(1);
    return this.taskCompletions.get(key);
  }

  // Combined data methods
  async getPersonWithTasks(id: number): Promise<PersonWithTasks | undefined> {
    const person = await this.getPerson(id);
    if (!person) return undefined;

    const completions = await this.getTaskCompletions(id);
    const globalTasks = await this.getGlobalTasks();
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

    return {
      ...person,
      globalTasks: formattedGlobalTasks,
      personalTasks: formattedPersonalTasks,
      completedTasks,
      totalTasks,
      progress,
      isLevel2
    };
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
      const result: CalendarRecord[] = [];
      const start = startOfDay(startDate);
      const end = endOfDay(endDate);

      for (const record of this.calendarRecords.values()) {
        if (record.personId === personId) {
          const recordDate = new Date(record.date);
          if (recordDate >= start && recordDate <= end) {
            result.push(record);
          }
        }
      }

      return result;
    }

    async updateCalendarRecord(personId: number, date: Date, data: Partial<InsertCalendarRecord>): Promise<CalendarRecord> {
      const key = this.getCalendarRecordKey(personId, date);
      const existing = this.calendarRecords.get(key);

      if (existing) {
        const updated = { ...existing, ...data };
        this.calendarRecords.set(key, updated);
        return updated;
      }

      const id = this.currentCalendarRecordId++;
      const newRecord: CalendarRecord = {
        id,
        personId,
        date,
        completedTasks: data.completedTasks || 0,
        totalTasks: data.totalTasks || 0,
        isLevel2: data.isLevel2 || false
      };

      this.calendarRecords.set(key, newRecord);
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
