import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
// Minimum 8 characters, At least one uppercase letter, one lowercase letter, one number and one special character.


export const RegisterBodySchema = z.object({
	email: z.string().email(),
	password: z.string().min(8).regex(passwordRegex, "Password must be 8 characters long. Contain at least one uppercase letter, one lowercase letter, one number and one special character."),
	name: z.string().min(2).max(100).trim().regex(/^[a-z ,.'-]+$/i, `Name must be in the format: "Firstname Lastname"`),
});

export const LoginBodySchema = z.object({
	email: z.string().email(),
	password: z.string().min(8).regex(passwordRegex, "Password must be 8 characters long. Contain at least one uppercase letter, one lowercase letter, one number and one special character."),
});

export const RegisterRequestSchema = z.object({
	body: RegisterBodySchema,
});

export const LoginRequestSchema = z.object({
	body: LoginBodySchema,
});

export type AuthRegisterResponse = z.infer<typeof AuthRegisterResponseSchema>;
export const AuthRegisterResponseSchema = z.object({
	user: z.object({
		id: z.string(),
		email: z.string().email(),
	}),
	accessToken: z.string(),
});

export type AuthLoginResponse = z.infer<typeof AuthLoginResponseSchema>;
export const AuthLoginResponseSchema = AuthRegisterResponseSchema;

export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export const AuthMeResponseSchema = z.object({
	id: z.string(),
	email: z.string().email(),
});
