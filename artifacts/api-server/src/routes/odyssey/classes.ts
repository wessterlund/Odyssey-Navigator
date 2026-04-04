import { Router } from "express";
import { db } from "@workspace/db";
import { classesTable, insertClassSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const classes = await db.select().from(classesTable).orderBy(classesTable.createdAt);
  res.json(classes);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, id));
  if (!cls) return res.status(404).json({ error: "Class not found" });
  res.json(cls);
});

router.post("/", async (req, res) => {
  const parsed = insertClassSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [cls] = await db.insert(classesTable).values(parsed.data).returning();
  res.status(201).json(cls);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = insertClassSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [cls] = await db.update(classesTable).set(parsed.data).where(eq(classesTable.id, id)).returning();
  if (!cls) return res.status(404).json({ error: "Class not found" });
  res.json(cls);
});

router.put("/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(classesTable).where(eq(classesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Class not found" });
  const [cls] = await db.update(classesTable).set({ isActive: !existing.isActive }).where(eq(classesTable.id, id)).returning();
  res.json(cls);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(classesTable).where(eq(classesTable.id, id));
  res.json({ success: true });
});

export default router;
