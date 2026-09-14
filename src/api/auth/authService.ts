import { StatusCodes } from "http-status-codes";
import type { AuthLoginResponse, AuthMeResponse, AuthRegisterResponse } from "@/api/auth/authModel";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { generateToken, hashPassword, verifyPassword } from "@/common/utils/auth";
import { prisma } from "@/generated/prisma/singleton";

export class AuthService {
	async register(email: string, password: string, name: string): Promise<ServiceResponse<unknown> | ServiceResponse<AuthRegisterResponse>> {
		try {
			// Check if user already exists
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser) {
				return ServiceResponse.failure("User with this email already exists", StatusCodes.CONFLICT);
			}

			// Hash password
			const hashedPassword = await hashPassword(password);

			// Create user
			const user = await prisma.user.create({
				data: {
					email,
					password: hashedPassword,
					first_name: name.split(" ")[0],
					last_name: name.split(" ").slice(1).join(" "),
				},
				select: {
					id: true,
					email: true,
				},
			});

			// Generate JWT token
			const accessToken = generateToken({
				userId: user.id,
				email: user.email,
			});
			


			return ServiceResponse.success<AuthRegisterResponse>(
				"User registered successfully",
				{
					user: {
						id: user.id,
						email: user.email,
					},
					accessToken,
				},
				StatusCodes.CREATED,
			);
		} catch (error) {
			console.error("Registration error:", error);
			return ServiceResponse.failure("Failed to register user", StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	async login(email: string, password: string): Promise<ServiceResponse<unknown> | ServiceResponse<AuthLoginResponse>> {
		try {
			// Find user by email
			const user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user) {
				return ServiceResponse.failure("Invalid email or password", StatusCodes.UNAUTHORIZED);
			}

			// Verify password
			const isPasswordValid = await verifyPassword(password, user.password);

			if (!isPasswordValid) {
				return ServiceResponse.failure("Invalid email or password", StatusCodes.UNAUTHORIZED);
			}

			// Generate JWT token
			const accessToken = generateToken({
				userId: user.id,
				email: user.email,
			});

			return ServiceResponse.success<AuthLoginResponse>(
				"Login successful",
				{
					user: {
						id: user.id,
						email: user.email,
					},
					accessToken,
				},
				StatusCodes.OK,
			);
		} catch (error) {
			console.error("Login error:", error);
			return ServiceResponse.failure("Failed to login", StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	async logout(): Promise<ServiceResponse<null>> {
		return ServiceResponse.success("Logged out successfully", null);
	}

	async me(userId: string): Promise<ServiceResponse<unknown> | ServiceResponse<AuthMeResponse>> {
		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				omit: {
					password: true
				},
			});

			if (!user) {
				return ServiceResponse.failure("User not found", StatusCodes.NOT_FOUND);
			}

			return ServiceResponse.success<AuthMeResponse>(
				"User retrieved successfully",
				user,
				StatusCodes.OK,
			);
		} catch (error) {
			console.error("Get user error:", error);
			return ServiceResponse.failure("Failed to get user", StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}
}

export const authService = new AuthService();
