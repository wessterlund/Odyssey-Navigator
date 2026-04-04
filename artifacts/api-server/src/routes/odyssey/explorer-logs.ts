import { Router } from "express";
import { db } from "@workspace/db";
import { explorerLogsTable, insertExplorerLogSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/learner/:learnerId", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const logs = await db.select().from(explorerLogsTable).where(eq(explorerLogsTable.learnerId, learnerId));
  res.json(logs);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [log] = await db.select().from(explorerLogsTable).where(eq(explorerLogsTable.id, id));
  if (!log) return res.status(404).json({ error: "Log not found" });
  res.json(log);
});

router.post("/", async (req, res) => {
  const parsed = insertExplorerLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [log] = await db.insert(explorerLogsTable).values(parsed.data).returning();
  res.status(201).json(log);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = insertExplorerLogSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [log] = await db.update(explorerLogsTable).set(parsed.data).where(eq(explorerLogsTable.id, id)).returning();
  if (!log) return res.status(404).json({ error: "Log not found" });
  res.json(log);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(explorerLogsTable).where(eq(explorerLogsTable.id, id));
  res.json({ success: true });
});

export default router;
