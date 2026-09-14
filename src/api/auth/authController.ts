import type { Request, RequestHandler, Response } from "express";

import { authService } from "@/api/auth/authService";
import type { AuthenticatedRequest } from "@/common/types/auth";


class AuthController {
	public register: RequestHandler = async (req: Request, res: Response) => {
		const { email, password, name } = req.body;
		const serviceResponse = await authService.register(email, password, name);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public login: RequestHandler = async (req: Request, res: Response) => {
		const { email, password } = req.body;
		const serviceResponse = await authService.login(email, password);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public logout: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await authService.logout();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public me: RequestHandler = async (req: Request, res: Response) => {
		const userId = (req as AuthenticatedRequest).user?.id;
		if (!userId) {
			return res.status(401).send({ message: "Unauthorized" });
		}
		const serviceResponse = await authService.me(userId);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const authController = new AuthController();
