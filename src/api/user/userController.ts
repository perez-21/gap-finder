import type { Request, RequestHandler, Response } from "express";

import { userService } from "@/api/user/userService";
import type { AuthenticatedRequest } from "@/common/types/auth";

class UserController {
	public getMyScores: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await userService.getMyScores();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getMySessions: RequestHandler = async (req: Request, res: Response) => {
		const userId = ( req as AuthenticatedRequest ).user?.id;
		if (!userId) {
			return res.status(401).send({ message: "Unauthorized" });
		}
		const serviceResponse = await userService.getMySessions(userId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const userController = new UserController();
