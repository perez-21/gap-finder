import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

import { sessionController } from "@/api/session/sessionController";
import {
  CreateSessionRequestSchema,
  IncompleteSessionAnswerResponseSchema,
  SessionAbandonResponseSchema,
  SessionAnswerFullSchema,
  SessionCreateResponseSchema,
  SessionIdParamsSchema,
  SessionResultsResponseSchema,
  SessionStatusResponseSchema,
  SubmitAnswerBodySchema,
} from "@/api/session/sessionModel";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { requireAuth } from "@/common/middleware/requireAuth";
import { validateRequest } from "@/common/utils/httpHandlers";

export const sessionRegistry = new OpenAPIRegistry();
export const sessionRouter: Router = express.Router();

sessionRegistry.registerPath({
  method: "post",
  path: "/sessions",
  tags: ["Sessions"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreateSessionRequestSchema } },
    },
  },
  responses: createApiResponse(
    SessionCreateResponseSchema,
    "Success",
    StatusCodes.CREATED,
  ),
});

sessionRouter.post(
  "/",
  requireAuth,
  validateRequest(z.object({ body: CreateSessionRequestSchema })),
  sessionController.create,
);

sessionRegistry.registerPath({
  method: "get",
  path: "/sessions/{id}",
  tags: ["Sessions"],
  security: [{ bearerAuth: [] }],
  request: { params: SessionIdParamsSchema.shape.params },
  responses: createApiResponse(SessionStatusResponseSchema, "Success"),
});

sessionRouter.get(
  "/:id",
  validateRequest(SessionIdParamsSchema),
  sessionController.getById,
);

sessionRegistry.registerPath({
  method: "post",
  path: "/sessions/{id}/answer",
  tags: ["Sessions"],
  security: [{ bearerAuth: [] }],
  request: {
    params: SessionIdParamsSchema.shape.params,
    body: {
      content: { "application/json": { schema: SubmitAnswerBodySchema } },
    },
  },
  responses: createApiResponse(IncompleteSessionAnswerResponseSchema, "Success"),
});

sessionRouter.post(
  "/:id/answer",
  validateRequest(SessionAnswerFullSchema),
  sessionController.submitAnswer,
);

sessionRegistry.registerPath({
  method: "post",
  path: "/sessions/{id}/abandon",
  tags: ["Sessions"],
  security: [{ bearerAuth: [] }],
  request: { params: SessionIdParamsSchema.shape.params },
  responses: createApiResponse(SessionAbandonResponseSchema, "Success"),
});

sessionRouter.post(
  "/:id/abandon",
  validateRequest(SessionIdParamsSchema),
  sessionController.abandon,
);

sessionRegistry.registerPath({
  method: "get",
  path: "/sessions/{id}/results",
  tags: ["Sessions"],
  security: [{ bearerAuth: [] }],
  request: { params: SessionIdParamsSchema.shape.params },
  responses: createApiResponse(SessionResultsResponseSchema, "Success"),
});

sessionRouter.get(
  "/:id/results",
  validateRequest(SessionIdParamsSchema),
  sessionController.results,
);
