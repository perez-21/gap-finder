import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { verifyToken } from "@/common/utils/auth";
import type { AuthenticatedRequest } from "../types/auth";

/**
 * Authentication middleware that validates JWT tokens
 * Adds user information to the request object if token is valid
 */
export const requireAuth: RequestHandler = (req: Request, res: Response, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader?.startsWith("Bearer ")) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				message: "Authorization header missing or invalid",
			});
		}

		const token = authHeader.substring(7); // Remove "Bearer " prefix
		const payload = verifyToken(token);

		if (!payload) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				message: "Invalid or expired token",
			});
		}

		// Add user info to request
		(req as AuthenticatedRequest).user = {
			id: payload.userId,
			email: payload.email,
		};

		next();
	} catch (error) {
		console.error("Auth middleware error:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			message: "Authentication error",
		});
	}
};
