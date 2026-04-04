import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { learnersTable, performanceTrackingTable, insertPerformanceSchema } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function calcAge(birthday: string): number {
  const b = new Date(birthday);
  const now = new Date();
  return Math.floor((now.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

router.post("/generate-adventure", async (req, res) => {
  const { learnerId, goal } = req.body;
  if (!learnerId || !goal) return res.status(400).json({ error: "learnerId and goal required" });

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const age = calcAge(learner.birthday);

  const prompt = `You are an expert in autism support and behavioral learning.

Generate a structured learning activity for a child.

Child Profile:
- Name: ${learner.name}
- Age: ${age}
- Diagnosis: ${learner.diagnosis || "Not specified"}
- Capabilities: ${(learner.capabilities || []).join(", ") || "Not specified"}
- Challenges: ${(learner.challenges || []).join(", ") || "Not specified"}
- Interests: ${(learner.interests || []).join(", ") || "Not specified"}
- Favorites: ${(learner.favorites || []).join(", ") || "Not specified"}
- Learning Goals: ${(learner.learningGoals || []).join(", ") || "Not specified"}

Goal: ${goal}

Return ONLY valid JSON with this exact structure:
{
  "title": "Adventure title",
  "description": "Brief description of the adventure",
  "coinsPerStep": 2,
  "completionBonus": 5,
  "steps": [
    {
      "instruction": "Simple, clear instruction",
      "mediaSuggestion": "Brief description of what image would help",
      "tip": "Tip for parent/teacher"
    }
  ],
  "rewardSuggestions": [
    {
      "name": "Reward name",
      "cost": 10
    }
  ]
}

Rules:
- Keep instructions simple and concrete (1-2 sentences max)
- Generate 4-7 steps maximum
- Adapt difficulty to the child's age and capabilities
- Use the child's interests and favorites in examples
- Each tip should be actionable and specific
- Coin costs should reflect step difficulty`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return res.status(500).json({ error: "No response from AI" });

  try {
    const adventure = JSON.parse(content);
    res.json(adventure);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

router.post("/suggest-rewards", async (req, res) => {
  const { learnerId } = req.body;
  if (!learnerId) return res.status(400).json({ error: "learnerId required" });

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const age = calcAge(learner.birthday);

  const prompt = `You are an expert in behavioral therapy for children.

Suggest personalized rewards for a child with the following profile:
- Age: ${age}
- Interests: ${(learner.interests || []).join(", ") || "Not specified"}
- Favorites: ${(learner.favorites || []).join(", ") || "Not specified"}
- Challenges: ${(learner.challenges || []).join(", ") || "Not specified"}

Return ONLY valid JSON:
{
  "smallRewards": [{"name": "...", "cost": 5}, ...],
  "mediumRewards": [{"name": "...", "cost": 15}, ...],
  "bigRewards": [{"name": "...", "cost": 30}, ...]
}

Each category should have 3-4 suggestions. Small rewards: 3-8 coins. Medium: 10-20 coins. Big: 25-50 coins.
Make rewards specific to the child's interests and age-appropriate.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return res.status(500).json({ error: "No response from AI" });

  try {
    const rewards = JSON.parse(content);
    res.json(rewards);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

router.post("/copilot-tip", async (req, res) => {
  const { learnerId, stepInstruction, attempts, elapsedSeconds } = req.body;
  if (!learnerId || !stepInstruction) return res.status(400).json({ error: "learnerId and stepInstruction required" });

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const age = calcAge(learner.birthday);

  const prompt = `You are an expert autism support specialist providing a quick tip to a parent or teacher.

Child Profile:
- Age: ${age}
- Capabilities: ${(learner.capabilities || []).join(", ")}
- Challenges: ${(learner.challenges || []).join(", ")}
- Interests: ${(learner.interests || []).join(", ")}

Current step: "${stepInstruction}"
Attempts so far: ${attempts || 1}
Time elapsed: ${elapsedSeconds || 0} seconds

The child is struggling with this step. Provide ONE very short, actionable tip (max 15 words) for the parent/teacher to help right now. Examples of good tips: "Model the action first, then guide the child's hand", "Break into smaller steps", "Use their favorite toy as motivation".

Return ONLY the tip text, no JSON, no quotes.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 100,
    messages: [{ role: "user", content: prompt }],
  });

  const tip = response.choices[0]?.message?.content?.trim();
  res.json({ tip: tip || "Try breaking the step into smaller parts" });
});

router.post("/adaptive-suggestions", async (req, res) => {
  const { learnerId, adventureId, performanceData } = req.body;
  if (!learnerId) return res.status(400).json({ error: "learnerId required" });

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const age = calcAge(learner.birthday);

  const prompt = `You are an expert in adaptive learning for children with special needs.

Child Profile:
- Age: ${age}
- Challenges: ${(learner.challenges || []).join(", ")}
- Capabilities: ${(learner.capabilities || []).join(", ")}

Performance Data:
${JSON.stringify(performanceData || [], null, 2)}

Based on this performance data, provide 2-3 actionable suggestions to improve the learning activity.

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "type": "simplify" | "motivate" | "break_down" | "adjust_time",
      "title": "Short title",
      "description": "One sentence description"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 512,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return res.status(500).json({ error: "No response from AI" });

  try {
    const suggestions = JSON.parse(content);
    res.json(suggestions);
  } catch {
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

router.post("/performance", async (req, res) => {
  const parsed = insertPerformanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  
  const [record] = await db.insert(performanceTrackingTable).values(parsed.data).returning();
  res.status(201).json(record);
});

router.get("/performance/learner/:learnerId", async (req, res) => {
  const learnerId = parseInt(req.params.learnerId);
  const records = await db
    .select()
    .from(performanceTrackingTable)
    .where(eq(performanceTrackingTable.learnerId, learnerId))
    .orderBy(desc(performanceTrackingTable.createdAt))
    .limit(50);
  res.json(records);
});

export default router;
