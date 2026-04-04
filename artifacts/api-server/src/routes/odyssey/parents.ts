import { Router } from "express";
import { db } from "@workspace/db";
import { parentsTable, insertParentSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const parents = await db.select().from(parentsTable).orderBy(parentsTable.createdAt);
  res.json(parents);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [parent] = await db.select().from(parentsTable).where(eq(parentsTable.id, id));
  if (!parent) return res.status(404).json({ error: "Parent not found" });
  res.json(parent);
});

router.post("/", async (req, res) => {
  const parsed = insertParentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [parent] = await db.insert(parentsTable).values(parsed.data).returning();
  res.status(201).json(parent);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = insertParentSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [parent] = await db.update(parentsTable).set(parsed.data).where(eq(parentsTable.id, id)).returning();
  if (!parent) return res.status(404).json({ error: "Parent not found" });
  res.json(parent);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(parentsTable).where(eq(parentsTable.id, id));
  res.json({ success: true });
});

export default router;
