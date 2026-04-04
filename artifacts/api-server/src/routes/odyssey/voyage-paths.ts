import { Router } from "express";
import { db } from "@workspace/db";
import {
  voyagePathsTable,
  voyageLogsTable,
  adventuresTable,
  stepsTable,
  rewardsTable,
  insertVoyagePathSchema,
  insertVoyageLogSchema,
} from "@workspace/db";
import { eq, asc, desc, inArray } from "drizzle-orm";

const router = Router();

// GET /voyage-paths/learner/:learnerId  — list all voyage paths for a learner
router.get("/learner/:learnerId", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const paths = await db
    .select()
    .from(voyagePathsTable)
    .where(eq(voyagePathsTable.learnerId, learnerId))
    .orderBy(desc(voyagePathsTable.createdAt));
  res.json(paths);
});

// GET /voyage-paths/:id  — get a single voyage path with full details
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [vp] = await db.select().from(voyagePathsTable).where(eq(voyagePathsTable.id, id));
  if (!vp) return res.status(404).json({ error: "Voyage path not found" });

  // Fetch linked adventures with their steps
  const adventureIds = vp.adventureIds ?? [];
  const adventures =
    adventureIds.length > 0
      ? await db
          .select()
          .from(adventuresTable)
          .where(inArray(adventuresTable.id, adventureIds))
      : [];

  const adventuresWithSteps = await Promise.all(
    adventures.map(async (adv) => {
      const steps = await db
        .select()
        .from(stepsTable)
        .where(eq(stepsTable.adventureId, adv.id))
        .orderBy(asc(stepsTable.order));
      return { ...adv, steps };
    })
  );

  // Fetch linked rewards
  const rewardIds = vp.rewardIds ?? [];
  const rewards =
    rewardIds.length > 0
      ? await db.select().from(rewardsTable).where(inArray(rewardsTable.id, rewardIds))
      : [];

  // Fetch logs
  const logs = await db
    .select()
    .from(voyageLogsTable)
    .where(eq(voyageLogsTable.voyagePathId, id))
    .orderBy(desc(voyageLogsTable.createdAt));

  res.json({ ...vp, adventures: adventuresWithSteps, rewards, logs });
});

// POST /voyage-paths  — create new voyage path
router.post("/", async (req, res) => {
  const parsed = insertVoyagePathSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [vp] = await db.insert(voyagePathsTable).values(parsed.data).returning();
  res.status(201).json(vp);
});

// PUT /voyage-paths/:id  — update voyage path
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { id: _id, createdAt: _createdAt, ...updates } = req.body;
  const [vp] = await db
    .update(voyagePathsTable)
    .set(updates)
    .where(eq(voyagePathsTable.id, id))
    .returning();
  if (!vp) return res.status(404).json({ error: "Voyage path not found" });
  res.json(vp);
});

// PUT /voyage-paths/:id/status  — change status (draft → active → completed)
router.put("/:id/status", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!["draft", "active", "completed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const [vp] = await db
    .update(voyagePathsTable)
    .set({ status })
    .where(eq(voyagePathsTable.id, id))
    .returning();
  res.json(vp);
});

// DELETE /voyage-paths/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(voyagePathsTable).where(eq(voyagePathsTable.id, id));
  res.json({ ok: true });
});

// POST /voyage-paths/:id/logs  — add an execution log entry
router.post("/:id/logs", async (req, res) => {
  const voyagePathId = parseInt(req.params.id);
  const parsed = insertVoyageLogSchema.safeParse({ ...req.body, voyagePathId });
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [log] = await db.insert(voyageLogsTable).values(parsed.data).returning();
  res.status(201).json(log);
});

// GET /voyage-paths/:id/logs  — get all logs for a voyage path
router.get("/:id/logs", async (req, res) => {
  const voyagePathId = parseInt(req.params.id);
  const logs = await db
    .select()
    .from(voyageLogsTable)
    .where(eq(voyageLogsTable.voyagePathId, voyagePathId))
    .orderBy(desc(voyageLogsTable.createdAt));
  res.json(logs);
});

// GET /voyage-paths/:id/logs/adventure/:adventureId  — logs for a specific adventure
router.get("/:id/logs/adventure/:adventureId", async (req, res) => {
  const voyagePathId = parseInt(req.params.id);
  const adventureId = parseInt(req.params.adventureId);
  const logs = await db
    .select()
    .from(voyageLogsTable)
    .where(eq(voyageLogsTable.voyagePathId, voyagePathId))
    .orderBy(desc(voyageLogsTable.createdAt));
  res.json(logs.filter((l) => l.adventureId === adventureId));
});

export default router;
