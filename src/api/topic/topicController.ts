import type { Request, RequestHandler, Response } from "express";

import { topicService } from "@/api/topic/topicService";

class TopicController {
	public list: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await topicService.listWithEdges();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getById: RequestHandler = async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const serviceResponse = await topicService.getByIdWithDependencies(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const topicController = new TopicController();
