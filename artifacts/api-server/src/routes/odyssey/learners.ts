import { Router } from "express";
import { db } from "@workspace/db";
import {
  learnersTable,
  walletsTable,
  insertLearnerSchema,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

router.get("/", async (req, res) => {
  const learners = await db.select().from(learnersTable).orderBy(learnersTable.createdAt);
  res.json(learners);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, id));
  if (!learner) return res.status(404).json({ error: "Learner not found" });
  res.json(learner);
});

router.post("/", async (req, res) => {
  const parsed = insertLearnerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  
  const [learner] = await db.insert(learnersTable).values(parsed.data).returning();
  
  await db.insert(walletsTable).values({ learnerId: learner.id, coins: 0, lifetimeCoins: 0 });
  
  res.status(201).json(learner);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = insertLearnerSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  
  const [learner] = await db
    .update(learnersTable)
    .set(parsed.data)
    .where(eq(learnersTable.id, id))
    .returning();
  if (!learner) return res.status(404).json({ error: "Learner not found" });
  res.json(learner);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(learnersTable).where(eq(learnersTable.id, id));
  res.json({ success: true });
});

export default router;
