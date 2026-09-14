import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "@/common/utils/envConfig";

export interface JWTPayload {
	userId: string;
	email: string;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
	const secret: jwt.Secret = env.JWT_SECRET;
	const options: jwt.SignOptions = {
		expiresIn: env.JWT_EXPIRES_IN,
		algorithm: 'HS256',
	};
	return jwt.sign(payload, secret, options);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
	try {
		const secret: jwt.Secret = env.JWT_SECRET;
		const decoded = jwt.verify(token, secret) as JWTPayload;
		return decoded;
	} catch (error) {
		console.error("JWT verification failed:", error);
		return null;
	}
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
	const saltRounds = 12;
	return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return await bcrypt.compare(password, hash);
}