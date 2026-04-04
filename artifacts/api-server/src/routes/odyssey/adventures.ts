import { Router } from "express";
import { db } from "@workspace/db";
import {
  adventuresTable,
  stepsTable,
  insertAdventureSchema,
  insertStepSchema,
} from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/learner/:learnerId", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const adventures = await db
    .select()
    .from(adventuresTable)
    .where(eq(adventuresTable.learnerId, learnerId))
    .orderBy(adventuresTable.createdAt);
  res.json(adventures);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [adventure] = await db.select().from(adventuresTable).where(eq(adventuresTable.id, id));
  if (!adventure) return res.status(404).json({ error: "Adventure not found" });
  
  const steps = await db
    .select()
    .from(stepsTable)
    .where(eq(stepsTable.adventureId, id))
    .orderBy(asc(stepsTable.order));
  
  res.json({ ...adventure, steps });
});

router.post("/", async (req, res) => {
  const { steps: stepsData, ...adventureData } = req.body;
  const parsed = insertAdventureSchema.safeParse(adventureData);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  
  const [adventure] = await db.insert(adventuresTable).values(parsed.data).returning();
  
  if (stepsData && Array.isArray(stepsData)) {
    const stepValues = stepsData.map((s: any, i: number) => ({
      adventureId: adventure.id,
      instruction: s.instruction,
      mediaUrl: s.mediaUrl || null,
      tip: s.tip || null,
      order: i,
    }));
    await db.insert(stepsTable).values(stepValues);
  }
  
  const steps = await db.select().from(stepsTable).where(eq(stepsTable.adventureId, adventure.id)).orderBy(asc(stepsTable.order));
  res.status(201).json({ ...adventure, steps });
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { steps: stepsData, ...adventureData } = req.body;
  const parsed = insertAdventureSchema.partial().safeParse(adventureData);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  
  const [adventure] = await db
    .update(adventuresTable)
    .set(parsed.data)
    .where(eq(adventuresTable.id, id))
    .returning();
  if (!adventure) return res.status(404).json({ error: "Adventure not found" });
  
  if (stepsData && Array.isArray(stepsData)) {
    await db.delete(stepsTable).where(eq(stepsTable.adventureId, id));
    const stepValues = stepsData.map((s: any, i: number) => ({
      adventureId: id,
      instruction: s.instruction,
      mediaUrl: s.mediaUrl || null,
      tip: s.tip || null,
      order: i,
    }));
    if (stepValues.length > 0) await db.insert(stepsTable).values(stepValues);
  }
  
  const steps = await db.select().from(stepsTable).where(eq(stepsTable.adventureId, id)).orderBy(asc(stepsTable.order));
  res.json({ ...adventure, steps });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(adventuresTable).where(eq(adventuresTable.id, id));
  res.json({ success: true });
});

export default router;
