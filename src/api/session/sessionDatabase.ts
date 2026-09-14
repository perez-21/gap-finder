import { prisma } from "../../generated/prisma/singleton";

/**
 * Fetch the full dependency subgraph for a topic using a recursive CTE
 * Returns all dependencies ordered by depth DESC (deepest prerequisites first)
 */
export async function getDependencySubgraph(
  topicId: string,
): Promise<Array<{ topic_id: string; depth: number }>> {
  const result = await prisma.$queryRaw<
    Array<{ topic_id: string; depth: number }>
  >`
    WITH RECURSIVE dep_tree AS (
      SELECT depends_on_topic_id AS topic_id, 1 AS depth
      FROM topic_dependencies
      WHERE topic_id = ${topicId}::uuid

      UNION ALL

      SELECT td.depends_on_topic_id, dt.depth + 1
      FROM topic_dependencies td
      JOIN dep_tree dt ON td.topic_id = dt.topic_id
    )
    SELECT DISTINCT topic_id, MAX(depth) AS depth
    FROM dep_tree
    GROUP BY topic_id
    ORDER BY depth DESC;
  `;

  return result;
}

/**
 * Fetch direct dependencies for a single topic
 */
export async function getDirectDependencies(
  topicId: string,
): Promise<string[]> {
  const deps = await prisma.topicDependency.findMany({
    where: { topic_id: topicId },
    select: { depends_on_topic_id: true },
  });

  return deps.map((d) => d.depends_on_topic_id);
}

/**
 * Fetch a topic with its details
 */
export async function getTopic(topicId: string) {
  return await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      title: true,
      description: true,
      curriculum_level: true,
    },
  });
}

/**
 * Fetch multiple topics by IDs
 */
export async function getTopics(topicIds: string[]) {
  return await prisma.topic.findMany({
    where: {
      id: {
        in: topicIds,
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      curriculum_level: true,
    },
  });
}

/**
 * Create a question in the database
 */
export async function createQuestion(data: {
  topicId: string;
  text: string;
  type: "multiple_choice";
  difficulty: "easy" | "medium" | "hard";
  options: string[];
  correctAnswer: string;
  explanation?: string;
}) {
  return await prisma.question.create({
    data: {
      topic_id: data.topicId,
      text: data.text,
      type: "multiple_choice",
      difficulty: data.difficulty,
      options: data.options,
      correct_answer: data.correctAnswer,
      explanation: data.explanation || null,
    },
  });
}

/**
 * Fetch questions for a topic (up to limit)
 */
export async function getQuestionsForTopic(topicId: string, limit: number = 3) {
  return await prisma.question.findMany({
    where: { topic_id: topicId },
    take: limit,
    select: {
      id: true,
      text: true,
      type: true,
      options: true,
    },
  });
}
