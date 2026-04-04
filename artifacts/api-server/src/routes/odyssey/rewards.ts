import { Router } from "express";
import { db } from "@workspace/db";
import { rewardsTable, insertRewardSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/learner/:learnerId", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const rewards = await db.select().from(rewardsTable).where(eq(rewardsTable.learnerId, learnerId));
  res.json(rewards);
});

router.post("/", async (req, res) => {
  const parsed = insertRewardSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  
  const [reward] = await db.insert(rewardsTable).values(parsed.data).returning();
  res.status(201).json(reward);
});

router.post("/bulk", async (req, res) => {
  const { rewards } = req.body;
  if (!Array.isArray(rewards) || rewards.length === 0) {
    return res.status(400).json({ error: "rewards array required" });
  }
  const inserted = await db.insert(rewardsTable).values(rewards).returning();
  res.status(201).json(inserted);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = insertRewardSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  
  const [reward] = await db
    .update(rewardsTable)
    .set(parsed.data)
    .where(eq(rewardsTable.id, id))
    .returning();
  if (!reward) return res.status(404).json({ error: "Reward not found" });
  res.json(reward);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(rewardsTable).where(eq(rewardsTable.id, id));
  res.json({ success: true });
});

export default router;
