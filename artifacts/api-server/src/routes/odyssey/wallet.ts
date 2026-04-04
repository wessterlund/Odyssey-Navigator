import { Router } from "express";
import { db } from "@workspace/db";
import {
  walletsTable,
  transactionsTable,
  insertTransactionSchema,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/learner/:learnerId", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.learnerId, learnerId));
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  res.json(wallet);
});

router.post("/learner/:learnerId/earn", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const { amount, source, note } = req.body;
  
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.learnerId, learnerId));
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  
  const [updated] = await db
    .update(walletsTable)
    .set({
      coins: wallet.coins + amount,
      lifetimeCoins: wallet.lifetimeCoins + amount,
    })
    .where(eq(walletsTable.learnerId, learnerId))
    .returning();
  
  await db.insert(transactionsTable).values({
    learnerId,
    type: "earn",
    amount,
    source: source || "step",
    note: note || null,
  });
  
  res.json(updated);
});

router.post("/learner/:learnerId/redeem", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const { amount, note } = req.body;
  
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.learnerId, learnerId));
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });
  if (wallet.coins < amount) return res.status(400).json({ error: "Insufficient coins" });
  
  const [updated] = await db
    .update(walletsTable)
    .set({ coins: wallet.coins - amount })
    .where(eq(walletsTable.learnerId, learnerId))
    .returning();
  
  await db.insert(transactionsTable).values({
    learnerId,
    type: "redeem",
    amount,
    source: "reward",
    note: note || null,
  });
  
  res.json(updated);
});

router.get("/learner/:learnerId/transactions", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.learnerId, learnerId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(50);
  res.json(transactions);
});

export default router;
