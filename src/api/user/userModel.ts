import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const UserTopicScoreSchema = z.object({
	topicId: z.string(),
	score: z.number(),
});

export type UserScoresResponse = z.infer<typeof UserScoresResponseSchema>;
export const UserScoresResponseSchema = z.array(UserTopicScoreSchema);

export const UserSessionHistoryItemSchema = z.object({
	id: z.string(),
	status: z.string(),
	startedAt: z.string(),
	endedAt: z.string().nullable(),
});

export type UserSessionsResponse = z.infer<typeof UserSessionsResponseSchema>;
export const UserSessionsResponseSchema = z.array(UserSessionHistoryItemSchema);
