import { Router } from "express";
import { db } from "@workspace/db";
import { rewardsTable, insertRewardSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const COMMUNITY_TEMPLATES = [
  { name: "Trip to the Park", description: "A fun trip to the local park to play and explore", cost: 20 },
  { name: "30 Minutes of Arcade", description: "30 minutes of arcade games or video games of choice", cost: 30 },
  { name: "Ice Cream Treat", description: "Pick your favorite ice cream flavor for a sweet treat", cost: 15 },
  { name: "Movie Night", description: "Choose any movie for family movie night with popcorn", cost: 25 },
  { name: "Extra Screen Time", description: "30 extra minutes of tablet or screen time", cost: 10 },
  { name: "Breakfast Choice", description: "Pick what you want for breakfast tomorrow", cost: 8 },
  { name: "Toy Store Visit", description: "Visit the toy store and pick something special", cost: 50 },
  { name: "Sleepover with Friend", description: "Have a friend sleep over for a fun night", cost: 40 },
];

router.get("/community-templates", async (_req, res) => {
  res.json(COMMUNITY_TEMPLATES.map((t, i) => ({ ...t, id: -(i + 1), isTemplate: true })));
});

router.get("/learner/:learnerId", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const rewards = await db
    .select()
    .from(rewardsTable)
    .where(eq(rewardsTable.learnerId, learnerId))
    .orderBy(rewardsTable.createdAt);
  res.json(rewards);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [reward] = await db.select().from(rewardsTable).where(eq(rewardsTable.id, id));
  if (!reward) return res.status(404).json({ error: "Reward not found" });
  res.json(reward);
});

router.post("/", async (req, res) => {
  const parsed = insertRewardSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const [reward] = await db.insert(rewardsTable).values(parsed.data).returning();
  res.status(201).json(reward);
});

router.post("/from-template", async (req, res) => {
  const { templateIndex, learnerId } = req.body;
  const template = COMMUNITY_TEMPLATES[templateIndex];
  if (!template) return res.status(400).json({ error: "Template not found" });
  const parsed = insertRewardSchema.safeParse({
    learnerId: parseInt(learnerId),
    name: template.name,
    description: template.description,
    cost: template.cost,
    isDraft: true,
    isPublished: false,
  });
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

router.put("/:id/publish", async (req, res) => {
  const id = parseInt(req.params.id);
  const [reward] = await db
    .update(rewardsTable)
    .set({ isDraft: false, isPublished: true })
    .where(eq(rewardsTable.id, id))
    .returning();
  if (!reward) return res.status(404).json({ error: "Reward not found" });
  res.json(reward);
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
