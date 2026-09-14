import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

import { userController } from "@/api/user/userController";
import { UserScoresResponseSchema, UserSessionsResponseSchema } from "@/api/user/userModel";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { requireAuth } from "@/common/middleware/requireAuth";

export const userRegistry = new OpenAPIRegistry();

export const userRouter: Router = express.Router();

userRegistry.registerPath({
	method: "get",
	path: "/users/me/scores",
	tags: ["User"],
	security: [{ bearerAuth: [] }],
	responses: createApiResponse(UserScoresResponseSchema, "Success"),
});

userRegistry.registerPath({
	method: "get",
	path: "/users/me/sessions",
	tags: ["User"],
	security: [{ bearerAuth: [] }],
	responses: createApiResponse(UserSessionsResponseSchema, "Success"),
});

userRouter.get("/me/scores", requireAuth, userController.getMyScores);
userRouter.get("/me/sessions", requireAuth, userController.getMySessions);
