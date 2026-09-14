import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { authController } from "@/api/auth/authController";
import {
	AuthLoginResponseSchema,
	AuthMeResponseSchema,
	AuthRegisterResponseSchema,
	LoginBodySchema,
	LoginRequestSchema,
	RegisterBodySchema,
	RegisterRequestSchema,
} from "@/api/auth/authModel";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { requireAuth } from "@/common/middleware/requireAuth";
import { validateRequest } from "@/common/utils/httpHandlers";

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

authRegistry.registerPath({
	method: "post",
	path: "/auth/register",
	tags: ["Auth"],
	request: {
		body: {
			content: { "application/json": { schema: RegisterBodySchema } },
		},
	},
	responses: createApiResponse(AuthRegisterResponseSchema, "Success", 201),
});

authRouter.post("/register", validateRequest(RegisterRequestSchema), authController.register);

authRegistry.registerPath({
	method: "post",
	path: "/auth/login",
	tags: ["Auth"],
	request: {
		body: {
			content: { "application/json": { schema: LoginBodySchema } },
		},
	},
	responses: createApiResponse(AuthLoginResponseSchema, "Success"),
});

authRouter.post("/login", validateRequest(LoginRequestSchema), authController.login);

authRegistry.registerPath({
	method: "post",
	path: "/auth/logout",
	tags: ["Auth"],
	responses: createApiResponse(z.null(), "Success"),
});

authRouter.post("/logout", authController.logout);

authRegistry.registerPath({
	method: "get",
	path: "/auth/me",
	tags: ["Auth"],
	security: [{ bearerAuth: [] }],
	responses: createApiResponse(AuthMeResponseSchema, "Success"),
});

authRouter.get("/me", requireAuth, authController.me);
