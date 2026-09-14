import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// Request schemas
export const CreateSessionRequestSchema = z.object({
  topicId: z.string().uuid(),
  mode: z.enum(["quick", "infinite"]),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

export const SessionIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const SubmitAnswerBodySchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string(),
});

export const SessionAnswerFullSchema = SessionIdParamsSchema.extend({
  body: SubmitAnswerBodySchema,
});

// Response schemas
export const QuestionSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  type: z.enum(["multiple_choice"]),
  options: z.array(z.string()),
});

export const CurrentTopicSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type SessionCreateResponse = z.infer<typeof SessionCreateResponseSchema>;
export const SessionCreateResponseSchema = z.object({
  sessionId: z.string().uuid(),
  mode: z.enum(["quick", "infinite"]),
  totalTopicsToProbe: z.number(),
  currentTopic: CurrentTopicSchema,
  question: QuestionSchema,
});

export type SessionStatusResponse = z.infer<typeof SessionStatusResponseSchema>;
export const SessionStatusResponseSchema = z.object({
  id: z.string(),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  progress: z.object({
    answeredCount: z.number(),
    totalPlanned: z.number(),
  }),
});

export type SessionAnswerResponse = z.infer<typeof IncompleteSessionAnswerResponseSchema | typeof CompleteSessionAnswerResponseSchema>;
export const IncompleteSessionAnswerResponseSchema = z.object({
  
  nextQuestion: QuestionSchema.nullable(),
  completed: z.boolean(),
  resultSummary: z.unknown().nullable(),
});

export const CompleteSessionAnswerResponseSchema = z.object({
  type: z.enum(["complete"]),
  weaknessMap: z.object({
    gaps: z.array(z.string().uuid()),
    proficient: z.array(z.string().uuid()),
    untested: z.array(z.string().uuid())
  })
})

export type SessionAbandonResponse = z.infer<
  typeof SessionAbandonResponseSchema
>;
export const SessionAbandonResponseSchema = z.object({
  id: z.string(),
  status: z.literal("abandoned"),
});

export type SessionResultsResponse = z.infer<
  typeof SessionResultsResponseSchema
>;
export const SessionResultsResponseSchema = z.object({
  sessionId: z.string(),
  weaknessByTopicId: z.record(z.string().uuid()),
});
