import {
  getDefaultLLMStrategy,
  type LLMStrategy,
} from "@/api/session/llmStrategies";
import type { GeneratedQuestion } from "@/api/session/sessionTypes";
import { env } from "@/common/utils/envConfig";

interface TopicInfo {
  title: string;
  description: string | null;
  curriculumLevel: string;
  dependencyTitles: string[];
}

/**
 * Generate questions for a topic using an LLM
 * Validates and retries on failure according to the spec
 */
export async function generateQuestionsForTopic(
  topic: TopicInfo,
): Promise<GeneratedQuestion[]> {
  const systemPrompt =
    "You are a mathematics question generator for Nigerian SSCE (WAEC) students.";
  const response_format = {
    type: "json_schema",
    json_schema: {
      name: "qwen/qwen3-4b",
      strict: true,
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            difficulty: { type: "number" },
            text: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correctAnswer: { type: "string" },
            explanation: { type: "string" },
          },
        },
        required: [
          "difficulty",
          "text",
          "options",
          "correctAnswer",
          "explanation",
        ],
      },
    },
  };
  const maxRetries = env.AI_MAX_RETRIES || 1;

  // First attempt: generate all 3 questions together
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      if (attempt === 0) {
        // First attempt: all questions together
        const questions = await callLLM(
          systemPrompt,
          buildFullPrompt(topic),
          response_format,
        );
        validateQuestions(questions);
        return questions;
      } else {
        // Retry: generate one question at a time with simplified prompt
        const questions: GeneratedQuestion[] = [];

        for (const difficulty of [1, 2, 3]) {
          try {
            const [question] = await callLLM(
              systemPrompt,
              buildSimplifiedPrompt(topic, difficulty as 1 | 2 | 3),
            );
            questions.push(question);
          } catch {
            // Skip this question if it fails
            console.warn(
              `Failed to generate difficulty ${difficulty} question for ${topic.title}`,
            );
          }
        }

        if (questions.length > 0) {
          return questions;
        }
        throw new Error("No questions generated after retry");
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(lastError);
      console.log(attempt);
      attempt++;
    }
  }

  // If all retries fail, return empty array (topic will be marked untested)
  console.error(
    `Failed to generate questions for topic ${topic.title} after ${maxRetries + 1} attempts:`,
    lastError,
  );
  return [];
}

/**
 * Call the LLM API with the given prompt
 * Uses the strategy pattern to allow different LLM implementations
 */
async function callLLM(
  systemPrompt: string,
  prompt: string,
  response_format?: any,
  strategy?: LLMStrategy,
): Promise<GeneratedQuestion[]> {
  const llmStrategy = strategy || getDefaultLLMStrategy();
  return llmStrategy.call(systemPrompt, prompt, response_format);
}

/**
 * Build the full prompt for generating all 3 questions at once
 */
function buildFullPrompt(topic: TopicInfo): string {
  const dependencyList =
    topic.dependencyTitles.length > 0
      ? topic.dependencyTitles.join(", ")
      : "None";

  return `

Generate exactly 3 multiple choice questions for the topic: "${topic.title}"
Topic description: ${topic.description || "No description provided"}
Curriculum level: ${topic.curriculumLevel}
This topic builds on knowledge of: ${dependencyList}

Generate one question at each difficulty level:
- Difficulty 1 (easy): tests basic recall or recognition of the concept
- Difficulty 2 (medium): requires applying the concept to solve a problem
- Difficulty 3 (hard): requires multi-step reasoning or edge case handling

Rules:
- Each question must have exactly 4 options labelled A, B, C, D
- Exactly one option must be correct
- Wrong options (distractors) should reflect common student mistakes, not random values
- Questions must be solvable without a calculator
- Use Nigerian curriculum conventions (e.g. "factorise" not "factor")
- Do not repeat the topic title verbatim in the question text

Respond with valid JSON only. No explanation, no markdown. Shape:
[
  {
    "difficulty": 1,
    "text": "question text",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "A",
    "explanation": "brief explanation of why this answer is correct"
  }
]`;
}

/**
 * Build a simplified prompt for generating a single question
 */
function buildSimplifiedPrompt(
  topic: TopicInfo,
  difficulty: 1 | 2 | 3,
): string {
  const difficultyLabels = {
    1: "easy - tests basic recall or recognition",
    2: "medium - requires applying the concept to solve a problem",
    3: "hard - requires multi-step reasoning or edge case handling",
  };

  const dependencyList =
    topic.dependencyTitles.length > 0
      ? topic.dependencyTitles.join(", ")
      : "None";

  return `

Generate exactly 1 multiple choice question for the topic: "${topic.title}"
Topic description: ${topic.description || "No description provided"}
Curriculum level: ${topic.curriculumLevel}
This topic builds on knowledge of: ${dependencyList}

Generate a difficulty ${difficulty} (${difficultyLabels[difficulty]}) question.

Rules:
- The question must have exactly 4 options labelled A, B, C, D
- Exactly one option must be correct
- Wrong options (distractors) should reflect common student mistakes
- The question must be solvable without a calculator
- Use Nigerian curriculum conventions (e.g. "factorise" not "factor")
- Do not repeat the topic title verbatim in the question text

Respond with valid JSON only. No explanation, no markdown. Shape:
{
  "difficulty": ${difficulty},
  "text": "question text",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "A",
  "explanation": "brief explanation of why this answer is correct"
}`;
}

/**
 * Validate the structure and content of generated questions
 */
function validateQuestions(
  questions: unknown[],
): asserts questions is GeneratedQuestion[] {
  if (!Array.isArray(questions)) {
    throw new Error("Response is not an array");
  }

  for (const q of questions) {
    if (typeof q !== "object" || q === null) {
      throw new Error("Question is not an object");
    }

    const question = q as Record<string, unknown>;

    // Validate difficulty
    if (![1, 2, 3].includes(question.difficulty as number)) {
      throw new Error(`Invalid difficulty: ${question.difficulty}`);
    }

    // Validate text
    if (typeof question.text !== "string" || question.text.length < 10) {
      throw new Error(`Invalid question text: ${question.text}`);
    }
    // Validate options

    if (!Array.isArray(question.options)) {
      throw new Error(`Options not provided: ${question.options}`);
    }

    const options = question.options as Array<unknown>;
    if (options.length !== 4) {
      throw new Error(`Invalid options count: ${options.length}`);
    }

    // Validate correctAnswer
    if (!["A", "B", "C", "D"].includes(question.correctAnswer as string)) {
      throw new Error(`Invalid correctAnswer: ${question.correctAnswer}`);
    }

    // Validate options are strings
    if (!question.options.every((opt) => typeof opt === "string")) {
      throw new Error("Not all options are strings");
    }
  }
}
