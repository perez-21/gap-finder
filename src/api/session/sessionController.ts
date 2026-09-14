import type { Request, RequestHandler, Response } from "express";

import { sessionService } from "@/api/session/sessionService";
import type { CreateSessionRequest } from "@/api/session/sessionTypes";
import type { AuthenticatedRequest } from "@/common/types/auth";


class SessionController {
  public create: RequestHandler = async (req: Request, res: Response) => {
    const { topicId, mode } = req.body as CreateSessionRequest;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    if (!topicId || !mode) {
      return res
        .status(400)
        .send({ message: "Missing topicId or mode in request body" });
    }

    const serviceResponse = await sessionService.create(userId, {
      topicId,
      mode,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getById: RequestHandler = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;
    const serviceResponse = await sessionService.getById(sessionId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public submitAnswer: RequestHandler = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;
    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined) {
      return res
        .status(400)
        .send({ message: "Missing questionId or answer in request body" });
    }

    const serviceResponse = await sessionService.submitAnswer(
      sessionId,
      questionId,
      answer,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public abandon: RequestHandler = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;
    const serviceResponse = await sessionService.abandon(sessionId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public results: RequestHandler = async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;
    const serviceResponse = await sessionService.getResults(sessionId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const sessionController = new SessionController();
