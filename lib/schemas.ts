import { z } from "zod";

// --- Data Config ---

export const ScrutinConfigSchema = z.object({
  scrutinId: z.string(),
  order: z.number().int().positive(),
  tier: z.enum(["core", "refine-1", "refine-2", "refine-3"]),
  axis: z.enum(["economy", "society"]),
  polarity: z.union([z.literal(1), z.literal(-1)]),
  theme: z.string(),
  question: z.string().min(1),
  officialTitle: z.string().optional(),
  summary: z.string().optional(),
  result: z.enum(["adopte", "rejete"]).optional(),
  voteCount: z.object({
    pour: z.number(),
    contre: z.number(),
    abstention: z.number(),
  }).optional(),
});

// --- User Input ---

export const UserAnswerSchema = z.enum(["POUR", "CONTRE", "ABSTENTION", "SKIP"]);

export const ComputeRequestSchema = z.object({
  answers: z.record(z.string(), UserAnswerSchema),
});

// --- Vote Data ---

export const VotePositionSchema = z.enum(["POUR", "CONTRE", "ABSTENTION", "ABSENT", "NON_VOTANT"]);

export const PoliticianSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  slug: z.string(),
  photoUrl: z.string().nullable(),
  partyShortName: z.string().nullable(),
  partyId: z.string().nullable(),
  mandateType: z.string(),
});

export const PartySchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  color: z.string().nullable(),
});

// --- Quiz Pack (served by API) ---

export const QuizQuestionSchema = z.object({
  scrutinId: z.string(),
  question: z.string(),
  theme: z.string(),
  tier: z.enum(["core", "refine-1", "refine-2", "refine-3"]),
  order: z.number(),
  votingDate: z.string(),
  chamber: z.string(),
  officialTitle: z.string().optional(),
  summary: z.string().optional(),
  result: z.enum(["adopte", "rejete"]).optional(),
  voteCount: z.object({
    pour: z.number(),
    contre: z.number(),
    abstention: z.number(),
  }).optional(),
});

export const QuizPackSchema = z.object({
  questions: z.array(QuizQuestionSchema),
  voteMatrix: z.record(z.string(), z.record(z.string(), VotePositionSchema)),
  politicians: z.array(PoliticianSchema),
  parties: z.array(PartySchema),
  partyMajorities: z.record(z.string(), z.record(z.string(), VotePositionSchema)),
  axes: z.object({
    economy: z.object({ scrutinIds: z.array(z.string()), polarities: z.record(z.string(), z.union([z.literal(1), z.literal(-1)])) }),
    society: z.object({ scrutinIds: z.array(z.string()), polarities: z.record(z.string(), z.union([z.literal(1), z.literal(-1)])) }),
  }),
  generatedAt: z.string(),
});

// --- Compute Result ---

export const ConcordanceEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  partyShortName: z.string().nullable().optional(),
  partyColor: z.string().nullable().optional(),
  concordance: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  agree: z.number(),
  disagree: z.number(),
  partial: z.number(),
  overlap: z.number(),
});

export const CompassPositionSchema = z.object({
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
  xValid: z.boolean(),
  yValid: z.boolean(),
});

export const ComputeResultSchema = z.object({
  position: CompassPositionSchema,
  politicians: z.array(ConcordanceEntrySchema),
  parties: z.array(ConcordanceEntrySchema),
  answeredCount: z.number(),
  totalQuestions: z.number(),
});

// --- Share Result (stored in KV) ---

export const ShareTopPartySchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  score: z.number(),
  color: z.string().nullable(),
});

export const ShareResultSchema = z.object({
  id: z.string(),
  position: CompassPositionSchema,
  topParties: z.array(ShareTopPartySchema),
  answeredCount: z.number(),
  createdAt: z.string(),
});

// --- Challenge Context ---

export const ChallengeContextSchema = z.object({
  shareId: z.string(),
  challengerPosition: CompassPositionSchema,
  challengerTopParties: z.array(ShareTopPartySchema),
  challengerAnsweredCount: z.number(),
});
