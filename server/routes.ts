import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPersonSchema, 
  insertGlobalTaskSchema, 
  insertPersonalTaskSchema,
  insertTaskCompletionSchema,
  insertCalendarRecordSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Health check endpoint
  apiRouter.get("/healthcheck", (_, res) => {
    res.status(200).send("OK");
  });

  // People endpoints
  apiRouter.get("/people", async (req, res) => {
    const people = await storage.getPeopleWithTasks();
    res.json(people);
  });

  apiRouter.get("/people/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const person = await storage.getPersonWithTasks(id);
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json(person);
  });

  apiRouter.post("/people", async (req, res) => {
    try {
      const personData = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(personData);
      res.status(201).json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid person data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create person" });
    }
  });

  apiRouter.patch("/people/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    try {
      const personData = insertPersonSchema.partial().parse(req.body);
      const updatedPerson = await storage.updatePerson(id, personData);
      
      if (!updatedPerson) {
        return res.status(404).json({ message: "Person not found" });
      }

      res.json(updatedPerson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid person data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update person" });
    }
  });

  apiRouter.delete("/people/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deleted = await storage.deletePerson(id);
    if (!deleted) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.status(204).send();
  });

  // Global Tasks endpoints
  apiRouter.get("/global-tasks", async (req, res) => {
    const tasks = await storage.getGlobalTasks();
    res.json(tasks);
  });

  apiRouter.post("/global-tasks", async (req, res) => {
    try {
      const taskData = insertGlobalTaskSchema.parse(req.body);
      const task = await storage.createGlobalTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create global task" });
    }
  });

  apiRouter.patch("/global-tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    try {
      const taskData = insertGlobalTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateGlobalTask(id, taskData);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Global task not found" });
      }

      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update global task" });
    }
  });

  apiRouter.delete("/global-tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deleted = await storage.deleteGlobalTask(id);
    if (!deleted) {
      return res.status(404).json({ message: "Global task not found" });
    }

    res.status(204).send();
  });

  // Personal Tasks endpoints
  apiRouter.get("/people/:id/personal-tasks", async (req, res) => {
    const personId = parseInt(req.params.id);
    if (isNaN(personId)) {
      return res.status(400).json({ message: "Invalid person ID format" });
    }

    const tasks = await storage.getPersonalTasks(personId);
    res.json(tasks);
  });

  apiRouter.post("/personal-tasks", async (req, res) => {
    try {
      const taskData = insertPersonalTaskSchema.parse(req.body);
      const task = await storage.createPersonalTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create personal task" });
    }
  });

  apiRouter.patch("/personal-tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    try {
      const taskData = insertPersonalTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updatePersonalTask(id, taskData);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Personal task not found" });
      }

      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update personal task" });
    }
  });

  apiRouter.delete("/personal-tasks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deleted = await storage.deletePersonalTask(id);
    if (!deleted) {
      return res.status(404).json({ message: "Personal task not found" });
    }

    res.status(204).send();
  });

  // Task Completion endpoints
  apiRouter.post("/task-completions", async (req, res) => {
    try {
      const completionData = insertTaskCompletionSchema.parse(req.body);
      const completion = await storage.setTaskCompletion(completionData);
      
      // Return the updated person with tasks to reflect the new completion status
      const person = await storage.getPersonWithTasks(completionData.personId);
      res.status(201).json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid completion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task completion" });
    }
  });

  // Calendar endpoints
  apiRouter.get("/calendar/:personId/:year/:month", async (req, res) => {
    const personId = parseInt(req.params.personId);
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    if (isNaN(personId) || isNaN(year) || isNaN(month)) {
      return res.status(400).json({ message: "Invalid parameters format" });
    }

    try {
      const days = await storage.getCalendarDays(personId, year, month);
      res.json(days);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });
  
  apiRouter.get("/calendar/all/:year/:month", async (req, res) => {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    if (isNaN(year) || isNaN(month)) {
      return res.status(400).json({ message: "Invalid parameters format" });
    }

    try {
      const peopleCalendarData = await storage.getAllPeopleCalendarDays(year, month);
      res.json(peopleCalendarData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
