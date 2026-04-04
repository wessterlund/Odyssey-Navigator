import { Router } from "express";
import { db } from "@workspace/db";
import {
  adventuresTable,
  stepsTable,
  insertAdventureSchema,
} from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

const ADVENTURE_TEMPLATES = [
  { name: "Morning Routine", description: "Step-by-step guide for a successful morning", author: "Molly Brown", steps: 5 },
  { name: "Washing Hands", description: "Proper handwashing technique", author: "Phil G", steps: 4 },
  { name: "Getting Dressed", description: "Independently putting on clothes", author: "Casey Dean", steps: 6 },
  { name: "Brushing Teeth", description: "Healthy dental hygiene routine", author: "Farah Brown", steps: 5 },
  { name: "Making a Sandwich", description: "Simple meal prep for independence", author: "Molly Brown", steps: 7 },
  { name: "Taking Turns", description: "Learning to share and wait patiently", author: "Phil G", steps: 4 },
  { name: "Asking for Help", description: "Communicating needs to others", author: "Casey Dean", steps: 3 },
  { name: "Packing a Backpack", description: "Organising items for school", author: "Farah Brown", steps: 5 },
];

router.get("/community-templates", async (_req, res) => {
  res.json(ADVENTURE_TEMPLATES.map((t, i) => ({ ...t, id: -(i + 1), isTemplate: true })));
});

router.get("/learner/:learnerId", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const adventures = await db
    .select()
    .from(adventuresTable)
    .where(eq(adventuresTable.learnerId, learnerId))
    .orderBy(adventuresTable.createdAt);

  const withSteps = await Promise.all(
    adventures.map(async (adv) => {
      const steps = await db
        .select()
        .from(stepsTable)
        .where(eq(stepsTable.adventureId, adv.id))
        .orderBy(asc(stepsTable.order));
      return { ...adv, steps };
    })
  );
  res.json(withSteps);
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
      mediaType: s.mediaType || null,
      thumbnail: s.thumbnail || null,
      tip: s.tip || null,
      order: i,
    }));
    await db.insert(stepsTable).values(stepValues);
  }

  const steps = await db.select().from(stepsTable).where(eq(stepsTable.adventureId, adventure.id)).orderBy(asc(stepsTable.order));
  res.status(201).json({ ...adventure, steps });
});

router.post("/:id/duplicate", async (req, res) => {
  const id = parseInt(req.params.id);
  const { learnerId } = req.body;

  const [original] = await db.select().from(adventuresTable).where(eq(adventuresTable.id, id));
  if (!original) return res.status(404).json({ error: "Adventure not found" });

  const originalSteps = await db
    .select()
    .from(stepsTable)
    .where(eq(stepsTable.adventureId, id))
    .orderBy(asc(stepsTable.order));

  const [newAdventure] = await db
    .insert(adventuresTable)
    .values({
      learnerId: learnerId || original.learnerId,
      title: `${original.title} (Copy)`,
      description: original.description,
      coinsPerStep: original.coinsPerStep,
      completionBonus: original.completionBonus,
      isTemplate: false,
      usageCount: 0,
    })
    .returning();

  if (originalSteps.length > 0) {
    const stepValues = originalSteps.map((s, i) => ({
      adventureId: newAdventure.id,
      instruction: s.instruction,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      thumbnail: s.thumbnail,
      tip: s.tip,
      order: i,
    }));
    await db.insert(stepsTable).values(stepValues);
  }

  const newSteps = await db.select().from(stepsTable).where(eq(stepsTable.adventureId, newAdventure.id)).orderBy(asc(stepsTable.order));
  res.status(201).json({ ...newAdventure, steps: newSteps });
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
      mediaType: s.mediaType || null,
      thumbnail: s.thumbnail || null,
      tip: s.tip || null,
      order: i,
    }));
    if (stepValues.length > 0) await db.insert(stepsTable).values(stepValues);
  }

  const steps = await db.select().from(stepsTable).where(eq(stepsTable.adventureId, id)).orderBy(asc(stepsTable.order));
  res.json({ ...adventure, steps });
});

router.put("/:id/complete", async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(adventuresTable).where(eq(adventuresTable.id, id));
  if (!existing) return res.status(404).json({ error: "Adventure not found" });

  const [adventure] = await db
    .update(adventuresTable)
    .set({
      lastCompletedAt: new Date(),
      usageCount: (existing.usageCount ?? 0) + 1,
    })
    .where(eq(adventuresTable.id, id))
    .returning();
  res.json(adventure);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(adventuresTable).where(eq(adventuresTable.id, id));
  res.json({ success: true });
});

export default router;
