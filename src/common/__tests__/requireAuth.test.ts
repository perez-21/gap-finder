import express, { type Express, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { requireAuth } from "../middleware/requireAuth";
import type { AuthenticatedRequest } from "../types/auth";
import { generateToken } from "../utils/auth";
import { env } from "../utils/envConfig";

describe("JWT Authentication Middleware", () => {
	let app: Express;

	beforeAll(() => {
		app = express();

		function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
			return (req as AuthenticatedRequest).user !== undefined;
		}

		app.use(requireAuth);

		app.get("/protected", (req: Request, res: Response) => {
			if (!isAuthenticatedRequest(req)) {
				res.send({ user: null });
			}
			res.send({ user: (req as AuthenticatedRequest).user });
		});
	});

	it("populates request user field with `email` and `id` when jwt token is valid", async () => {
		const payload = {
			userId: "userId",
			email: "randomEmail",
		};
		const token = generateToken(payload);
		const response = await request(app).get("/protected").auth(token, { type: "bearer" });
		expect(response.status).toBe(StatusCodes.OK);
		expect(response.body).toBeDefined();
		expect(response.body).toMatchObject({ user: { id: payload.userId, email: payload.email } });
	});

	it("returns unauthorised status if token is missing, expired or invalid", async () => {
		const token = "";
		const response = await request(app).get("/protected").auth(token, { type: "bearer" });
		expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	it("returns unauthorised status if token is invalid", async () => {
		const token = "invalid-token";
		const response = await request(app).get("/protected").auth(token, { type: "bearer" });
		expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	it("returns unauthorised status if token is expired", async () => {
		const payload = {
			userId: "userId",
			email: "randomEmail",
			iat: Math.floor(Date.now() / 1000) - env.JWT_EXPIRES_IN - 1000,
		};
		const token = generateToken(payload);
		const response = await request(app).get("/protected").auth(token, { type: "bearer" });
		expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
	});
});
