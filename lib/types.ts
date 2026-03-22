import { z } from "zod";
import {
  ScrutinConfigSchema,
  QuizPackSchema,
  UserAnswerSchema,
  ComputeRequestSchema,
  ComputeResultSchema,
  ShareResultSchema,
  PoliticianSchema,
  PartySchema,
  VotePositionSchema,
  CompassPositionSchema,
  ConcordanceEntrySchema,
  QuizQuestionSchema,
} from "./schemas";

export type ScrutinConfig = z.infer<typeof ScrutinConfigSchema>;
export type QuizPack = z.infer<typeof QuizPackSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type UserAnswer = z.infer<typeof UserAnswerSchema>;
export type ComputeRequest = z.infer<typeof ComputeRequestSchema>;
export type ComputeResult = z.infer<typeof ComputeResultSchema>;
export type ShareResult = z.infer<typeof ShareResultSchema>;
export type Politician = z.infer<typeof PoliticianSchema>;
export type Party = z.infer<typeof PartySchema>;
export type VotePosition = z.infer<typeof VotePositionSchema>;
export type CompassPosition = z.infer<typeof CompassPositionSchema>;
export type ConcordanceEntry = z.infer<typeof ConcordanceEntrySchema>;
