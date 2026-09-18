import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

  HOST: z.string().min(1).default("localhost"),

  PORT: z.coerce.number().int().positive().default(8080),

  CORS_ORIGIN: z.string().url().default("http://localhost:8080"),

  COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number()
    .int()
    .positive()
    .default(1000),

  COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),

  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://username:password@localhost:5432/dbname"),

  TEST_DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://username:password@localhost:5432/test_db"),

  JWT_SECRET: z
    .string()
    .min(32)
    .default("your-super-secret-jwt-key-change-this-in-production"),

  JWT_EXPIRES_IN: z.coerce.number().int().nonnegative().default(3600),

  QUESTIONS_PER_PROBE: z.coerce.number().int().positive().default(3),

  GAP_THRESHOLD: z.coerce.number().min(0).max(1).default(0.75),

  RECENCY_WEIGHT_MULTIPLIER: z.coerce.number().positive().default(1.5),

  AI_MODEL: z.string().default(""),

  AI_MAX_RETRIES: z.coerce.number().int().nonnegative().default(1),

  LOCAL_LLM_BASE_URL: z.string().url().default("http://localhost:1234"),

  LOCAL_LLM_API_TOKEN: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

export const env = {
  ...parsedEnv.data,
  isDevelopment: parsedEnv.data.NODE_ENV === "development",
  isProduction: parsedEnv.data.NODE_ENV === "production",
  isTest: parsedEnv.data.NODE_ENV === "test",
};
