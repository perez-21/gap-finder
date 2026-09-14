import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

import { topicController } from "@/api/topic/topicController";
import { GetTopicParamsSchema, TopicDetailResponseSchema, TopicsListResponseSchema } from "@/api/topic/topicModel";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";

export const topicRegistry = new OpenAPIRegistry();
export const topicRouter: Router = express.Router();

topicRegistry.registerPath({
	method: "get",
	path: "/topics",
	tags: ["Topics"],
	responses: createApiResponse(TopicsListResponseSchema, "Success"),
});

topicRouter.get("/", topicController.list);

topicRegistry.registerPath({
	method: "get",
	path: "/topics/{id}",
	tags: ["Topics"],
	request: { params: GetTopicParamsSchema.shape.params },
	responses: createApiResponse(TopicDetailResponseSchema, "Success"),
});

topicRouter.get("/:id", validateRequest(GetTopicParamsSchema), topicController.getById);
