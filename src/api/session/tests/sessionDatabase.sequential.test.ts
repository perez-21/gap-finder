import { v4 as uuidv4 } from "uuid";
import { prisma as prismaClient } from "@/generated/prisma/singleton";
import {
  createQuestion,
  getDependencySubgraph,
  getDirectDependencies,
  getQuestionsForTopic,
  getTopic,
  getTopics,
} from "../sessionDatabase";
import * as questionFixtures from "./fixtures/question.fixture";
import * as topicFixtures from "./fixtures/topic.fixture";

async function clearTables() {
  await prismaClient.question.deleteMany();
  await prismaClient.testSession.deleteMany();
  await prismaClient.user.deleteMany();
  await prismaClient.topicDependency.deleteMany();
  await prismaClient.topic.deleteMany();
}

describe("Session Repository", () => {
  beforeAll(async () => {
    await clearTables();
    await prismaClient.topic.createMany({
      data: [
        topicFixtures.topic1,
        topicFixtures.topic2,
        topicFixtures.topic3,
        topicFixtures.topic4,
        topicFixtures.topic5,
      ],
    });

    // `topic5` is the root node, `topic2` and `topic1` have no dependencies
    await prismaClient.topicDependency.createMany({
      data: [
        {
          topic_id: topicFixtures.topic5.id,
          depends_on_topic_id: topicFixtures.topic4.id,
        },
        {
          topic_id: topicFixtures.topic4.id,
          depends_on_topic_id: topicFixtures.topic3.id,
        },
        {
          topic_id: topicFixtures.topic3.id,
          depends_on_topic_id: topicFixtures.topic2.id,
        },
        {
          topic_id: topicFixtures.topic3.id,
          depends_on_topic_id: topicFixtures.topic1.id,
        },
      ],
    });
  });

  afterAll(async () => {
    await clearTables();
  });

  describe("Get dependency subgraph", () => {
    it("should return an array of topic dependencies in descending order", async () => {
      const topicId = topicFixtures.topic5.id;
      const graph = await getDependencySubgraph(topicId);

      expect(graph).toBeDefined();
      expect(Array.isArray(graph)).toBe(true);
      expect(graph).toContainEqual({
        depth: 3,
        topic_id: topicFixtures.topic1.id,
      });
      expect(graph).toContainEqual({
        depth: 3,
        topic_id: topicFixtures.topic2.id,
      });
      expect(graph).toContainEqual({
        depth: 2,
        topic_id: topicFixtures.topic3.id,
      });
      expect(graph).toContainEqual({
        depth: 1,
        topic_id: topicFixtures.topic4.id,
      });

      let previous_depth = graph.length;
      for (const dependency of graph) {
        expect(dependency.depth).toBeLessThanOrEqual(previous_depth);
        previous_depth--;
      }
    });
    it("should return empty array if topic has no dependencies", async () => {
      const topicId = topicFixtures.topic1.id;
      await expect(getDependencySubgraph(topicId)).resolves.toHaveLength(0);
    });

    it("should throw an error when topic id is invalid", async () => {
      const topicId = "invalidId";

      await expect(getDependencySubgraph(topicId)).rejects.toThrow();
    });

    it("should return empty array if topic id is valid but does not exist", async () => {
      const topicId = uuidv4();
      await expect(getDependencySubgraph(topicId)).resolves.toHaveLength(0);
    });
  });
  describe("Get direct dependencies", () => {
    it("should return direct dependencies of a topic", async () => {
      const topicId = topicFixtures.topic3.id;
      const directDependencies = await getDirectDependencies(topicId);
      expect(directDependencies).toContain(topicFixtures.topic1.id);
      expect(directDependencies).toContain(topicFixtures.topic2.id);
    });
    it("should return an empty array if topic has no dependencies", async () => {
      const topicId = topicFixtures.topic1.id;
      await expect(getDirectDependencies(topicId)).resolves.toHaveLength(0);
    });
    it("should throw an error when topicId is invalid", async () => {
      const topicId = "invalidId";
      await expect(getDirectDependencies(topicId)).rejects.toThrow();
    });
    it("should do return an empty array when a topic id is valid but does not exist", async () => {
      const topicId = uuidv4();
      await expect(getDirectDependencies(topicId)).resolves.toHaveLength(0);
    });
  });

  describe("Get topic", () => {
    it("should do get a topic by id", async () => {
      const topicId = topicFixtures.topic1.id;
      const expectedObject = {
        id: topicFixtures.topic1.id,
        title: topicFixtures.topic1.title,
        curriculum_level: topicFixtures.topic1.curriculum_level,
        description: null,
      };
      await expect(getTopic(topicId)).resolves.toMatchObject(expectedObject);
    });

    it("should throw an error when topicId is invalid", async () => {
      const topicId = "invalidId";
      await expect(getTopic(topicId)).rejects.toThrow();
    });
    it("should return null when a topic id is valid but does not exist", async () => {
      const topicId = uuidv4();
      await expect(getTopic(topicId)).resolves.toBe(null);
    });
  });

  describe("Get topics", () => {
    const expectedTopics = [
      topicFixtures.topic1,
      topicFixtures.topic2,
      topicFixtures.topic3,
      topicFixtures.topic4,
      topicFixtures.topic5,
    ];
    it("should return an array of topics by id", async () => {
      await expect(getTopics(topicFixtures.topicIds)).resolves.toMatchObject(
        expectedTopics,
      );
    });

    it("should throw an error if any id is invalid", async () => {
      await expect(
        getTopics([...topicFixtures.topicIds, "invalidId"]),
      ).rejects.toThrow();
    });

    it("should return array of topics that do exist if any of topic id does not exist", async () => {
      await expect(
        getTopics([...topicFixtures.topicIds, uuidv4()]),
      ).resolves.toMatchObject(expectedTopics);
    });

    it("should return an empty array if argument is an empty array", async () => {
      await expect(getTopics([])).resolves.toHaveLength(0);
    });
  });

  describe("Get questions for topic", () => {
    const questions: questionFixtures.Question[] = [];

    beforeAll(async () => {
      questions.push(
        ...questionFixtures.constructQuestions(topicFixtures.topicIds),
      );
      await prismaClient.question.createMany({ data: questions });
    });
    afterAll(async () => {
      await prismaClient.question.deleteMany();
    });

    it("should return a question object without answer clues", async () => {
      const topicId = topicFixtures.topic1.id;
      const expectedQuestion = {
        id: questions[0].id,
        options: questions[0].options,
        text: questions[0].text,
        type: questions[0].type,
      };
      expect(getQuestionsForTopic(topicId)).resolves.toMatchObject([
        expectedQuestion,
      ]);
    });
    it("should throw an error if topicId is invalid", async () => {
      const topicId = "invalidId";
      await expect(getQuestionsForTopic(topicId)).rejects.toThrow();
    });

    it("should return an empty array if topicId is valid, but doesn't exist", async () => {
      const topicId = uuidv4();
      await expect(getQuestionsForTopic(topicId)).resolves.toHaveLength(0);
    });

    it("should to return an empty array if questions don't exist for topicId", async () => {
      const topicId = topicFixtures.topic1.id;
      await prismaClient.question.deleteMany({
        where: {
          topic_id: topicId,
        },
      });

      await expect(getQuestionsForTopic(topicId)).resolves.toHaveLength(0);
    });
  });

  describe("Create Question", () => {
    const topicId = topicFixtures.topic1.id;

    interface CreateQuestionData extends Omit<
      questionFixtures.Question,
      "id" | "topic_id" | "correct_answer"
    > {
      topicId: string;
      correctAnswer: string;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, topic_id, correct_answer, ...result } =
      questionFixtures.constructQuestion(topicId);
    const question: CreateQuestionData = {
      ...result,
      topicId: topic_id,
      correctAnswer: correct_answer,
    };

    afterEach(async () => {
      await prismaClient.question.deleteMany();
    });

    it("should create a question and return it as an object", async () => {
      const expectedQuestion = { topic_id, correct_answer, ...result };
      const newQuestion = await createQuestion(question);
      expect(newQuestion).toMatchObject(expectedQuestion);

      const questionInDb = await prismaClient.question.findUnique({
        where: {
          id: newQuestion.id,
        },
      });
      expect(questionInDb).not.toBeNull();
      expect(questionInDb).toMatchObject(expectedQuestion);
    });

    it("should throw an error if topicId is invalid", async () => {
      question.topicId = "invalidId";
      await expect(createQuestion(question)).rejects.toThrow();
    });

    it("should throw an error if topicId does not exist", async () => {
      question.topicId = uuidv4();
      await expect(createQuestion(question)).rejects.toThrow();
    });
  });
});
