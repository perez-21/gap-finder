import type { GeneratedQuestion } from "@/api/session/sessionTypes";
import { env } from "@/common/utils/envConfig";

/**
 * Strategy interface for LLM API calls
 */
export interface LLMStrategy {
  call(
    systemPrompt: string,
    prompt: string,
    response_format?: any,
  ): Promise<GeneratedQuestion[]>;
}

/**
 * Local LLM strategy using the OPEN AI compatible LM Studio endpoint
 */
export class LocalLLMStrategy implements LLMStrategy {
  async call(
    systemPrompt: string,
    prompt: string,
    response_format?: any,
  ): Promise<GeneratedQuestion[]> {
    if (!env.AI_MODEL) {
      throw new Error("AI_MODEL environment variable not configured");
    }

    if (!env.LOCAL_LLM_API_TOKEN) {
      throw new Error(
        "LOCAL_LLM_API_TOKEN environment variable not configured",
      );
    }

    const url = `${env.LOCAL_LLM_BASE_URL}/v1/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        // "Authorization": `Bearer ${env.LOCAL_LLM_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `LLM API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Extract the message content from the response
    const choices = data.choices;
    if (!Array.isArray(choices)) {
      throw new Error("Invalid LLM response format: output is not an array");
    }

    // Find the first message type output
    const messageItem = choices.find((item: any) => !!item.message);
    if (!messageItem || typeof messageItem.message.content !== "string") {
      throw new Error("No message content found in LLM response");
    }

    const content = messageItem.message.content.trim();

    // Parse the JSON response
    try {
      const questions = JSON.parse(content);
      return questions;
    } catch (parseError) {
      throw new Error(`Failed to parse LLM response as JSON: ${parseError}`);
    }
  }
}

/**
 * Factory function to get the default LLM strategy
 */
export function getDefaultLLMStrategy(): LLMStrategy {
  return new LocalLLMStrategy();
}
