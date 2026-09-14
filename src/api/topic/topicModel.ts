import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const TopicEdgeSchema = z.object({
	fromTopicId: z.string(),
	toTopicId: z.string(),
});

export const TopicSchema = z.object({
	id: z.string(),
	title: z.string(),
});

export type TopicsListResponse = z.infer<typeof TopicsListResponseSchema>;
export const TopicsListResponseSchema = z.object({
	topics: z.array(TopicSchema),
	edges: z.array(TopicEdgeSchema),
});

export type TopicDetailResponse = z.infer<typeof TopicDetailResponseSchema>;
export const TopicDetailResponseSchema = z.object({
	topic: TopicSchema,
	dependencies: z.array(TopicSchema),
});

export const GetTopicParamsSchema = z.object({
	params: z.object({ id: z.string() }),
});
