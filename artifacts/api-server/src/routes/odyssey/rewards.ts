import { Router } from "express";
import { db } from "@workspace/db";
import {
  rewardsTable,
  insertRewardSchema,
  walletsTable,
  transactionsTable,
  adventuresTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

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

/**
 * Atomic reward redemption — single DB transaction that:
 * 1. Verifies reward exists and isn't already redeemed
 * 2. Enforces linkedAdventures completion gate (if configured)
 * 3. Checks wallet balance
 * 4. Deducts coins, records transaction, marks reward redeemed — all atomically
 */
router.post("/:id/redeem", async (req, res) => {
  const rewardId = parseInt(req.params.id);
  const learnerId = parseInt(req.body.learnerId);

  if (isNaN(rewardId) || isNaN(learnerId)) {
    return res.status(400).json({ error: "rewardId and learnerId are required" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1 — Fetch reward with row-level intent
      const [reward] = await tx
        .select()
        .from(rewardsTable)
        .where(eq(rewardsTable.id, rewardId));

      if (!reward) throw { status: 404, message: "Reward not found" };
      if (reward.learnerId !== learnerId) throw { status: 403, message: "Reward does not belong to this learner" };
      if (reward.redeemed) throw { status: 409, message: "Reward has already been redeemed" };
      if (!reward.isPublished || reward.isDraft) throw { status: 400, message: "Reward is not published yet" };

      // 2 — Enforce linkedAdventures gate
      const linkedIds: number[] = Array.isArray(reward.linkedAdventures) ? reward.linkedAdventures : [];
      if (linkedIds.length > 0) {
        const adventures = await tx
          .select({ id: adventuresTable.id, lastCompletedAt: adventuresTable.lastCompletedAt })
          .from(adventuresTable)
          .where(inArray(adventuresTable.id, linkedIds));

        const incompleteIds = linkedIds.filter((lid) => {
          const adv = adventures.find((a) => a.id === lid);
          return !adv || !adv.lastCompletedAt;
        });

        if (incompleteIds.length > 0) {
          throw {
            status: 422,
            message: "Complete all linked adventures before redeeming this reward",
            incompleteAdventureIds: incompleteIds,
          };
        }
      }

      // 3 — Check wallet balance
      const [wallet] = await tx
        .select()
        .from(walletsTable)
        .where(eq(walletsTable.learnerId, learnerId));

      if (!wallet) throw { status: 404, message: "Wallet not found" };
      if (wallet.coins < reward.cost) {
        throw {
          status: 402,
          message: `Not enough coins — need ${reward.cost}, have ${wallet.coins}`,
          needed: reward.cost,
          have: wallet.coins,
        };
      }

      // 4 — Atomic: deduct coins + record transaction + mark redeemed
      const [updatedWallet] = await tx
        .update(walletsTable)
        .set({ coins: wallet.coins - reward.cost })
        .where(eq(walletsTable.learnerId, learnerId))
        .returning();

      await tx.insert(transactionsTable).values({
        learnerId,
        type: "redeem",
        amount: reward.cost,
        source: "reward",
        note: `Redeemed: ${reward.name}`,
      });

      const [updatedReward] = await tx
        .update(rewardsTable)
        .set({ redeemed: true })
        .where(eq(rewardsTable.id, rewardId))
        .returning();

      return { reward: updatedReward, wallet: updatedWallet };
    });

    res.json(result);
  } catch (err: any) {
    if (err.status) {
      const { status, message, ...extras } = err;
      return res.status(status).json({ error: message, ...extras });
    }
    console.error("Redeem transaction failed:", err);
    res.status(500).json({ error: "Redemption failed — please try again" });
  }
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
