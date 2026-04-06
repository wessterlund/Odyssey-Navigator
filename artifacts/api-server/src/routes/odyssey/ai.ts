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

function buildLearnerContext(learner: any, age: number): string {
  const capabilities = (learner.capabilities || []).join(", ") || "Not specified";
  const challenges = (learner.challenges || []).join(", ") || "Not specified";
  const interests = (learner.interests || []).join(", ") || "Not specified";
  const favorites = (learner.favorites || []).join(", ") || "Not specified";
  const therapies = (learner.therapies || []).join(", ") || "None";
  const diagnosis = learner.diagnosis || "Not specified";

  const isMinimalVerbal = challenges.toLowerCase().includes("verbal") ||
    diagnosis.toLowerCase().includes("nonverbal") ||
    diagnosis.toLowerCase().includes("non-verbal");

  const isSeverely = diagnosis.toLowerCase().includes("severe") ||
    challenges.toLowerCase().includes("self-injur") ||
    challenges.toLowerCase().includes("aggress");

  const defaults = `Default assumptions (apply when data is missing): visual-first, most-to-least prompting, continuous reinforcement, moderate–severe ASD profile.`;

  return `Child Profile:
- Name: ${learner.name}
- Age: ${age}
- Diagnosis: ${diagnosis}
- Communication: ${isMinimalVerbal ? "Minimally verbal / non-verbal" : "Verbal or emerging verbal"}
- Severity: ${isSeverely ? "Moderate–severe" : "Mild–moderate"}
- Therapies: ${therapies}
- Capabilities: ${capabilities}
- Challenges: ${challenges}
- Interests: ${interests}
- Favorites: ${favorites}
- Learning Goals: ${(learner.learningGoals || []).join(", ") || "Not specified"}

${defaults}`;
}

router.post("/generate-adventure", async (req, res) => {
  const { learnerId, goal } = req.body;
  if (!learnerId || !goal) return res.status(400).json({ error: "learnerId and goal required" });

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const age = calcAge(learner.birthday);
  const learnerContext = buildLearnerContext(learner, age);

  const prompt = `You are a BCBA (Board Certified Behavior Analyst) and special education specialist.
Your task: generate a clinically structured, adaptive Adventure using TEACCH, Task Analysis, and ABA principles.

${learnerContext}

Goal: ${goal}

Return ONLY valid JSON with this exact structure. Use short bullet-style text everywhere — no long paragraphs.

{
  "title": "Short, motivating adventure title",
  "description": "1 sentence overview of the skill.",
  "coinsPerStep": 2,
  "completionBonus": 5,

  "teacch": {
    "environmentSetup": "Short description: where, how the space is arranged, distractions removed",
    "visualSchedule": "What visual cues/cards are used to show the sequence",
    "workSystem": "Clear start cue → clear finish cue (e.g. 'box on left = to do, box on right = done')"
  },

  "promptingPlan": {
    "strategy": "Most-to-Least",
    "hierarchy": ["Full physical", "Partial physical", "Gestural", "Verbal", "Independent"],
    "fadingPlan": "Reduce 1 prompt level after 2 consecutive successful trials"
  },

  "reinforcementPlan": {
    "schedule": "Continuous (every step) — shift to 3:1 after 5 successful sessions",
    "type": "Immediate preferred sensory or tangible + verbal praise",
    "reinforcers": ["Based on favorites — e.g. preferred toy, high five, sticker"],
    "saturationPrevention": "Rotate reinforcers every 2–3 sessions"
  },

  "videoModeling": {
    "recommended": true,
    "type": "POV (point-of-view) or adult model",
    "duration": "30–60 seconds",
    "description": "Short description of what the video should show"
  },

  "generalizationPlan": [
    "Practice with different adult (parent + teacher)",
    "Change 1 material (different brand/color)",
    "Practice in 2 different settings"
  ],

  "dataTracking": {
    "metrics": ["Steps completed independently", "Prompt level per step", "% independence per session"]
  },

  "steps": [
    {
      "instruction": "One simple, concrete action (1 sentence max)",
      "mediaSuggestion": "What image/video would help show this step",
      "tip": "Short coaching tip for parent/teacher (max 15 words)",
      "promptLevel": "Full Physical",
      "supportStrategy": "Specific prompt action (e.g. 'Hand-over-hand from behind. Say the word as you assist.')"
    }
  ],

  "rewardSuggestions": [
    { "name": "Reward name", "cost": 10 }
  ]
}

RULES:
- Steps: 5–8 micro steps (task analysis — break each action into its smallest parts)
- Keep every text field SHORT — bullet-point style, no paragraphs
- Prompt levels must be one of: "Full Physical" | "Partial Physical" | "Gestural" | "Verbal" | "Independent"
- Assign prompt level per step: harder steps = higher prompt level
- Reinforcers MUST match the child's favorites/interests
- If communication is minimal: use visual-first strategies, physical prompts first
- If learner has sensory challenges: choose sensory-compatible reinforcers
- Video modeling: recommended for motor/ADL skills`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 3000,
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
  const challenges = (learner.challenges || []).join(", ") || "";
  const sensoryNote = challenges.toLowerCase().includes("sensory")
    ? "This learner has sensory sensitivities — prioritize sensory-compatible reinforcers."
    : "";

  const prompt = `You are a BCBA specializing in reinforcement systems for children with ASD.
Generate an intelligent, personalized reward system — NOT generic rewards.

Child Profile:
- Age: ${age}
- Interests: ${(learner.interests || []).join(", ") || "Not specified"}
- Favorites: ${(learner.favorites || []).join(", ") || "Not specified"}
- Challenges: ${challenges || "Not specified"}
${sensoryNote}

Your reward system must:
1. Match reinforcers to the child's specific preferences (interests + favorites)
2. Include a reinforcement schedule recommendation
3. Recommend token economy if appropriate
4. Include rotation guidance to prevent saturation
5. Consider sensory profile if relevant

Return ONLY valid JSON:
{
  "reinforcementSchedule": {
    "phase": "Continuous",
    "recommendation": "1 short sentence: when and how to give reward",
    "transition": "1 short sentence: when to shift to intermittent schedule"
  },
  "tokenEconomy": {
    "recommended": true,
    "system": "Short description (e.g. '5 tokens = 10 min preferred activity')",
    "reason": "1 sentence why token economy fits this learner"
  },
  "rotationStrategy": "Short tip: how often to rotate reinforcers to prevent saturation",
  "adaptiveRule": "IF learner shows low motivation → switch to highest-preference item immediately",
  "smallRewards": [
    {"name": "...", "cost": 5, "type": "sensory|activity|tangible|social", "why": "Short reason tied to learner interests"}
  ],
  "mediumRewards": [
    {"name": "...", "cost": 15, "type": "activity|tangible|social", "why": "Short reason"}
  ],
  "bigRewards": [
    {"name": "...", "cost": 30, "type": "activity|tangible|social", "why": "Short reason"}
  ]
}

Rules:
- 3–4 rewards per category
- Small: 3–8 coins. Medium: 10–20 coins. Big: 25–50 coins
- Every reward MUST connect to the child's specific interests/favorites
- No generic rewards (no "sticker chart" without context)
- Token economy: recommended for learners who can understand delayed reinforcement`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1500,
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
  const { learnerId, stepInstruction, attempts, elapsedSeconds, currentPromptLevel } = req.body;
  if (!learnerId || !stepInstruction) return res.status(400).json({ error: "learnerId and stepInstruction required" });

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const age = calcAge(learner.birthday);
  const isStruggling = (attempts || 1) >= 3 || (elapsedSeconds || 0) >= 60;
  const promptContext = currentPromptLevel
    ? `Current prompt level in use: ${currentPromptLevel}`
    : "Prompt level: unknown — default to physical prompt";

  const prompt = `You are a BCBA providing a real-time support tip using ABA principles.

Child: Age ${age}
Capabilities: ${(learner.capabilities || []).join(", ") || "not specified"}
Challenges: ${(learner.challenges || []).join(", ") || "not specified"}
Interests: ${(learner.interests || []).join(", ") || "not specified"}

Current step: "${stepInstruction}"
${promptContext}
Attempts: ${attempts || 1}
Time on step: ${elapsedSeconds || 0} seconds
${isStruggling ? "⚠ Learner is STRUGGLING — increase prompt level or simplify." : ""}

Adaptive rules to apply:
- If failing (3+ attempts or 60+ seconds) → increase prompt level (more support), simplify task, increase reinforcement
- If prompt dependent → introduce time delay before prompting
- If low motivation → suggest switching to highest-preference reinforcer

Give ONE short, actionable tip (max 15 words) for the adult helping right now.
Examples: "Move to full physical prompt — guide hands gently from behind", "Offer their favorite [item] immediately after any attempt"

Return ONLY the tip text, no JSON, no quotes.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 80,
    messages: [{ role: "user", content: prompt }],
  });

  const tip = response.choices[0]?.message?.content?.trim();
  res.json({ tip: tip || "Move to full physical prompt — guide hands gently from behind" });
});

router.post("/adaptive-suggestions", async (req, res) => {
  const { learnerId, adventureId, performanceData } = req.body;
  if (!learnerId) return res.status(400).json({ error: "learnerId required" });

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const age = calcAge(learner.birthday);

  const data = performanceData || [];
  const totalAttempts = data.reduce((sum: number, d: any) => sum + (d.attempts || 1), 0);
  const totalSuccess = data.filter((d: any) => d.success).length;
  const failRate = data.length > 0 ? (data.length - totalSuccess) / data.length : 0;
  const avgAttempts = data.length > 0 ? totalAttempts / data.length : 1;

  const performanceSummary = data.length === 0
    ? "No performance data yet."
    : `${totalSuccess}/${data.length} steps successful. Avg attempts per step: ${avgAttempts.toFixed(1)}. Failure rate: ${Math.round(failRate * 100)}%.`;

  const adaptiveContext =
    failRate > 0.5 ? "⚠ LEARNER IS STRUGGLING — increase prompts, simplify steps, increase reinforcement frequency"
    : failRate < 0.2 && avgAttempts < 1.5 ? "✅ LEARNER IS SUCCEEDING — consider fading prompts, increasing independence, slightly delaying reinforcement"
    : avgAttempts > 3 ? "⚠ PROMPT DEPENDENCY DETECTED — introduce time delay before prompting, gradually reduce intensity"
    : "Performance is moderate — monitor for trends";

  const prompt = `You are a BCBA analyzing adaptive learning data for a child with ASD.

Child: Age ${age}
Challenges: ${(learner.challenges || []).join(", ") || "not specified"}
Capabilities: ${(learner.capabilities || []).join(", ") || "not specified"}

Performance Summary: ${performanceSummary}
Adaptive Signal: ${adaptiveContext}

Adaptive rules to apply:
• IF failing (>50% failure rate) → increase prompt level, simplify task, increase reinforcement
• IF succeeding (<20% failure, <1.5 avg attempts) → fade prompts, increase independence, delay reinforcement
• IF prompt dependent (avg >3 attempts) → introduce time delay, reduce prompt intensity
• IF low motivation detected → switch reinforcer, consider token system

Provide 2–3 specific, actionable suggestions using these rules.

Return ONLY valid JSON:
{
  "adaptiveSignal": "failing|succeeding|prompt_dependent|moderate",
  "suggestions": [
    {
      "type": "increase_prompts|fade_prompts|simplify|increase_reinforcement|switch_reinforcer|add_time_delay",
      "title": "Short title (5 words max)",
      "description": "One clear sentence — what to do and why",
      "urgency": "immediate|this_week|monitor"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 600,
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

router.post("/generate-iep", async (req, res) => {
  const { learnerId, communicationLevel, environment, priorityBehaviors, additionalContext } = req.body;
  if (!learnerId) return res.status(400).json({ error: "learnerId required" });

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
  if (!learner) return res.status(404).json({ error: "Learner not found" });

  const age = calcAge(learner.birthday);

  const systemPrompt = `You are a licensed special education specialist and board-certified behavior analyst (BCBA) with deep expertise in creating Individualized Education Plans (IEPs) for children with autism spectrum disorder and other developmental disabilities.

Your IEPs are:
- Evidence-based, drawing from ABA, PECS, PRT, AAC, and sensory integration frameworks
- Written in observable, measurable behavioral terms
- Organized by priority tier (immediate needs first)
- Practical and actionable for parents, teachers, and therapists
- Sensitive to the child's strengths, interests, and motivators

Generate a comprehensive, personalized IEP plan based on the learner profile provided.`;

  const userMessage = `Learner Profile:
- Name: ${learner.name}
- Age: ${age} years old
- Diagnosis: ${learner.diagnosis || "Not specified"}
- Communication Level: ${communicationLevel || "Not specified"}
- Therapies: ${(learner.therapies || []).join(", ") || "None specified"}
- Strengths / Capabilities: ${(learner.capabilities || []).join(", ") || "Not specified"}
- Interests: ${(learner.interests || []).join(", ") || "Not specified"}
- Favorites: ${(learner.favorites || []).join(", ") || "Not specified"}
- Challenges: ${(learner.challenges || []).join(", ") || "Not specified"}
- Current Learning Goals: ${(learner.learningGoals || []).join(", ") || "Not specified"}
- Long-term Goals: ${(learner.longTermGoals || []).join(", ") || "Not specified"}
- Priority Behaviors to Address: ${priorityBehaviors || "Not specified"}
- Learning Environment: ${environment || "School and home"}
- Additional Context: ${additionalContext || "None"}

Return ONLY valid JSON with this exact structure:
{
  "missionTitle": "A motivating, specific title for this IEP voyage path (e.g., 'Building Communication & Independence')",
  "missionDescription": "A clear, jargon-free description of the IEP's overall goals and approach for this child (2-3 sentences, written for parents and teachers)",
  "priorityMap": {
    "tier1": ["Immediate, highest-priority skill or goal (observable, specific)"],
    "tier2": ["Important secondary goal to address within 3-6 months"],
    "tier3": ["Generalization or maintenance goal for after tier1/2 mastery"]
  },
  "goals": [
    {
      "id": "G1",
      "domain": "communication",
      "shortTitle": "Brief goal title",
      "behavior": "Observable, measurable behavior (what the child will DO)",
      "condition": "Under what conditions / given what prompt level",
      "criterion": "Mastery criterion (e.g., '80% accuracy across 3 consecutive sessions with 2 different adults')",
      "interventions": ["Evidence-based strategy 1", "Strategy 2"],
      "dataCollection": "How to collect data (e.g., 'trial-by-trial data using partial interval recording')",
      "generalization": ["Generalization target: different setting", "Generalization target: different communication partner"]
    }
  ],
  "behaviorPlan": {
    "targetBehavior": "Specific description of the challenging behavior to reduce (topography, frequency, intensity)",
    "antecedents": ["Common antecedent / trigger 1", "Trigger 2"],
    "functions": ["escape", "attention"],
    "replacementBehaviors": ["Functionally equivalent replacement behavior 1"],
    "preventionStrategies": ["Proactive strategy to prevent the behavior 1"],
    "reinforcementStrategies": ["Specific reinforcement schedule and type 1"]
  },
  "atRecommendations": [
    {
      "tool": "Tool or technology name",
      "purpose": "Why this AT is recommended for this child",
      "implementation": "Specific implementation guidance"
    }
  ]
}

Rules:
- Generate 3-6 IEP goals spanning multiple domains (communication, behavior, social, ADL, academic, motor)
- ALL goals must be written in observable, measurable terms (no vague language like 'will improve')
- Ground every recommendation in the child's specific interests and strengths
- Include the behavior plan only if there are challenging behaviors to address
- Include 2-3 AT recommendations appropriate for the child's communication level
- Tier 1 should have 2-3 items, Tier 2 have 2-3 items, Tier 3 have 2-3 items`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return res.status(500).json({ error: "No response from AI" });

  try {
    const iep = JSON.parse(content);
    iep.generatedAt = new Date().toISOString();
    res.json(iep);
  } catch {
    res.status(500).json({ error: "Failed to parse IEP response" });
  }
});

router.post("/voyage-completion-analysis", async (req, res) => {
  const { title, description, adventures, logs, iepData, learnerId } = req.body;

  let learnerCtx = "";
  if (learnerId) {
    const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, learnerId));
    if (learner) {
      const age = calcAge(learner.birthday);
      learnerCtx = buildLearnerContext(learner, age);
    }
  }

  const completedCount = (adventures || []).filter((a: any) =>
    (logs || []).some((l: any) => l.adventureId === a.id && l.completionStatus === "completed")
  ).length;
  const totalAdventures = (adventures || []).length;
  const completionRate = totalAdventures > 0 ? Math.round((completedCount / totalAdventures) * 100) : 0;

  const adventureSummary = (adventures || []).map((a: any) => {
    const advLogs = (logs || []).filter((l: any) => l.adventureId === a.id);
    const done = advLogs.some((l: any) => l.completionStatus === "completed");
    return `- "${a.title}": ${done ? "COMPLETED" : `not completed (${advLogs.length} attempt(s))`}`;
  }).join("\n");

  const goalsSummary = iepData?.goals?.map((g: any) =>
    `  - [${g.domain}] ${g.shortTitle}: criterion = "${g.criterion}"`
  ).join("\n") || "No IEP goals on record.";

  const systemMsg = `You are a Board Certified Behavior Analyst (BCBA) reviewing whether a voyage path (behavior learning program) is ready to be completed/closed.

Analyze the data and provide:
1. A clear recommendation: "ready" or "not_ready"
2. A confidence score 0-100
3. A clinically-informed reasoning paragraph (2-3 sentences)
4. Up to 3 specific goal observations
5. If not ready: what remains before closing

${learnerCtx}

Respond ONLY with valid JSON matching:
{
  "recommendation": "ready" | "not_ready",
  "confidence": number,
  "reasoning": string,
  "goalObservations": [{ "goal": string, "status": "met" | "emerging" | "not_met", "note": string }],
  "remainingSteps": string[]
}`;

  const userMsg = `Voyage Path: "${title}"
Description: ${description || "None"}
Adventures: ${totalAdventures} total, ${completedCount} completed (${completionRate}% completion rate)

Adventure Progress:
${adventureSummary}

IEP Goals:
${goalsSummary}

Should this voyage path be marked as completed?`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemMsg },
      { role: "user", content: userMsg },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return res.status(500).json({ error: "No AI response" });

  try {
    res.json(JSON.parse(content));
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
