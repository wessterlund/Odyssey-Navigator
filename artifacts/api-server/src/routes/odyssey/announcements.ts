import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable, insertAnnouncementSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const items = await db.select().from(announcementsTable).orderBy(announcementsTable.createdAt);
  res.json(items);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(announcementsTable).where(eq(announcementsTable.id, id));
  if (!item) return res.status(404).json({ error: "Announcement not found" });
  res.json(item);
});

router.post("/", async (req, res) => {
  const parsed = insertAnnouncementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [item] = await db.insert(announcementsTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = insertAnnouncementSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [item] = await db.update(announcementsTable).set(parsed.data).where(eq(announcementsTable.id, id)).returning();
  if (!item) return res.status(404).json({ error: "Announcement not found" });
  res.json(item);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.json({ success: true });
});

export default router;
