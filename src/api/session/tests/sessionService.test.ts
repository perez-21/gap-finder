import { v4 as uuidv4 } from "uuid";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";
import { prisma } from "@/generated/prisma/singleton";
import { sessionService } from "../sessionService";
import type { CreateSessionRequest, SessionState } from "../sessionTypes";
import * as questionFixtures from "./fixtures/question.fixture";
import * as topicFixtures from "./fixtures/topic.fixture";

async function clearTables() {
  await prisma.question.deleteMany();
  await prisma.testSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.topicDependency.deleteMany();
  await prisma.topic.deleteMany();
}

describe("Session Services", () => {
  beforeAll(async () => {
    await clearTables();
  });
  afterAll(async () => {
    await clearTables();
  });
  describe("Create Session", () => {
    let userId: string;
    const email = "email@example.com";
    beforeAll(async () => {
      await prisma.topic.create({ data: topicFixtures.topic1 });
      const user = await prisma.user.create({
        data: {
          email,
          password: "very@seCure12",
          first_name: "John",
          last_name: "Doe",
        },
      });
      userId = user.id;
    });

    afterEach(async () => {
      await prisma.testSession.deleteMany({ where: { user_id: userId } });
    });
    it("should return session in quick mode and persist it", async () => {
      const topicId = topicFixtures.topic1.id;
      const topicTitle = topicFixtures.topic1.title;
      const mode: "quick" | "infinite" = "quick";
      const request: CreateSessionRequest = { topicId, mode };
      const expectedResponse = {
        data: {
          currentTopic: {
            id: topicId,
            title: topicTitle,
          },
          mode,
        },
        message: "Session created successfully",
        statusCode: 201,
        success: true,
      };

      const response = await sessionService.create(userId, request);
      expect(response).toMatchObject(expectedResponse);
      expect(response.data).toHaveProperty("sessionId");
      expect(response.data).toHaveProperty("totalTopicsToProbe");
      expect(response.data).toHaveProperty("sessionId");

      const expectedSessionObject = {
        user_id: userId,
        entry_topic_id: topicId,
        mode,
        status: "in_progress",
        completed_at: null,
      };
      const newSession = await prisma.testSession.findUnique({
        where: { id: response.data?.sessionId },
      });
      expect(newSession).toMatchObject(expectedSessionObject);
    });
    it("should return session in infinite mode and persist it", async () => {
      const topicId = topicFixtures.topic1.id;
      const topicTitle = topicFixtures.topic1.title;
      const mode: "quick" | "infinite" = "infinite";
      const request: CreateSessionRequest = { topicId, mode };
      const expectedResponse = {
        data: {
          currentTopic: {
            id: topicId,
            title: topicTitle,
          },
          mode,
        },
        message: "Session created successfully",
        statusCode: 201,
        success: true,
      };
      const response = await sessionService.create(userId, request);
      expect(response).toMatchObject(expectedResponse);
      expect(response.data).toHaveProperty("sessionId");
      expect(response.data).toHaveProperty("totalTopicsToProbe");
      expect(response.data).toHaveProperty("sessionId");

      const expectedSessionObject = {
        user_id: userId,
        entry_topic_id: topicId,
        mode,
        status: "in_progress",
        completed_at: null,
      };
      const newSession = await prisma.testSession.findUnique({
        where: { id: response.data?.sessionId },
      });

      expect(newSession).toMatchObject(expectedSessionObject);
    });

    it("should return service failure with status 404 when topicId is invalid", async () => {
      const topicId = "invalidId";
      const mode: "quick" | "infinite" = "infinite";
      const request: CreateSessionRequest = { topicId, mode };

      const expectedServiceResponse = ServiceResponse.failure(
        `Failed to create session`,
        null,
        500,
      );
      await expect(
        sessionService.create(userId, request),
      ).resolves.toMatchObject(expectedServiceResponse);
    });

    it("should return service failure with status 404 when topicId does not exist", async () => {
      const topicId = uuidv4();
      const mode: "quick" | "infinite" = "infinite";
      const request: CreateSessionRequest = { topicId, mode };

      const expectedServiceResponse = ServiceResponse.failure(
        `Topic not found: ${topicId}`,
        null,
        404,
      );
      await expect(
        sessionService.create(userId, request),
      ).resolves.toMatchObject(expectedServiceResponse);
    });
  });

  describe("Get session", () => {
    let sessionId: string;
    beforeAll(async () => {
      const email = "email@domain.com";
      await clearTables();

      const topic = await prisma.topic.create({ data: topicFixtures.topic1 });
      const user = await prisma.user.create({
        data: {
          email,
          password: "very@seCure12",
          first_name: "John",
          last_name: "Doe",
        },
      });

      const testSession = await prisma.testSession.create({
        data: {
          user_id: user.id,
          entry_topic_id: topic.id,
          status: "in_progress",
          mode: "quick",
          session_state: "",
        },
      });

      sessionId = testSession.id;
    });

    it("should return service failure with status 500", async () => {
      await expect(sessionService.getById(sessionId)).resolves.toMatchObject(
        ServiceResponse.failure("Failed to get session", null, 500),
      );
    });

    it("should return service failure with status 500 when sessionId is invalid", async () => {
      const invalidSessionId = "invalidId";
      await expect(
        sessionService.getById(invalidSessionId),
      ).resolves.toMatchObject(
        ServiceResponse.failure("Failed to get session", null, 500),
      );
    });

    it("should return service failure with status 500 when session doesn't exist", async () => {
      const fakeSessionId = uuidv4();
      await expect(
        sessionService.getById(fakeSessionId),
      ).resolves.toMatchObject(
        ServiceResponse.failure("Session not found", null, 404),
      );
    });
  });
  describe("Submit answer", () => {
    let sessionId: string;
    let questionId: string;
    let userAnswer: "A" | "B" | "C" | "D";

    beforeAll(async () => {
      await clearTables();

      const user = await prisma.user.create({
        data: {
          email: "example@domain.com",
          password: "very@seCure12",
          first_name: "John",
          last_name: "Doe",
        },
      });
      await prisma.topic.createMany({
        data: [topicFixtures.topic1, topicFixtures.topic2],
      });

      const questions = [];
      for (let i = 0; i < env.QUESTIONS_PER_PROBE; i++) {
        questions.push(
          questionFixtures.constructQuestion(topicFixtures.topic1.id),
        );
      }
      for (let i = 0; i < env.QUESTIONS_PER_PROBE; i++) {
        questions.push(
          questionFixtures.constructQuestion(topicFixtures.topic2.id),
        );
      }

      const pendingQuestions = questions.map((question) => {
        const { id, ...questionWithoutId } = question;
        return { questionId: id, ...questionWithoutId };
      });

      await prisma.question.createMany({ data: questions });
      const currentQuestion = questions[0];

      const sessionState: SessionState = {
        entryTopicId: topicFixtures.topic1.id,
        mode: "quick",
        probeOrder: [topicFixtures.topic1.id, topicFixtures.topic2.id],
        currentProbeIndex: 0,
        currentQuestionIndex: 0,
        topicStates: {
          [topicFixtures.topic1.id]: {
            topicId: topicFixtures.topic1.id,
            status: "untested",
            questionsAsked: [],
            answers: [],
            score: null,
          },
        },
        pendingQuestions,
        dependencyMap: { [topicFixtures.topic1.id]: [topicFixtures.topic2.id] },
        weaknessMap: { gaps: [], proficient: [] },
        completed: false,
      };

      const session = await prisma.testSession.create({
        data: {
          user_id: user.id,
          mode: sessionState.mode,
          entry_topic_id: topicFixtures.topic1.id,
          status: "in_progress",
          session_state: JSON.stringify(sessionState),
        },
      });

      sessionId = session.id;
      questionId = currentQuestion.id;
      userAnswer = "B";
    });

    it("should return service failure with status 500 ", async () => {
      await expect(
        sessionService.submitAnswer(sessionId, questionId, userAnswer),
      ).resolves.toMatchObject(ServiceResponse.failure("", null, 500));
    });

    it("should return service failure with status 500 when session id is invalid", async () => {
      await expect(
        sessionService.submitAnswer("invalidId", questionId, userAnswer),
      ).resolves.toMatchObject(
        ServiceResponse.failure("Failed to submit answer", null, 500),
      );
    });
    it("should return service failure with status 500 when question id is invalid", async () => {
      await expect(
        sessionService.submitAnswer(sessionId, "invalidId", userAnswer),
      ).resolves.toMatchObject(
        ServiceResponse.failure("Failed to submit answer", null, 500),
      );
    });
    it("should return service failure with status 500 when user answer is invalid", async () => {
      await expect(
        sessionService.submitAnswer(sessionId, questionId, "invalidAnswer"),
      ).resolves.toMatchObject(ServiceResponse.failure("", null, 500));
    });
    it("should return service failure with status 404 when session does not exist", async () => {
      await expect(
        sessionService.submitAnswer(uuidv4(), questionId, userAnswer),
      ).resolves.toMatchObject(
        ServiceResponse.failure("Session not found", null, 404),
      );
    });
    it("should return service failure with status 404 when question does not exist", async () => {
      await expect(
        sessionService.submitAnswer(sessionId, uuidv4(), userAnswer),
      ).resolves.toMatchObject(
        ServiceResponse.failure("Question not found", null, 404),
      );
    });
  });

  describe("Abandon Session", () => {
    let sessionId: string;
    let topicId: string;
    let userId: string;

    beforeAll(async () => {
      await clearTables();

      const user = await prisma.user.create({
        data: {
          email: "email@example.com",
          password: "supersecurepassword",
          first_name: "John",
          last_name: "Doe",
        },
      });
      const topic = await prisma.topic.create({ data: topicFixtures.topic1 });
      userId = user.id;
      topicId = topic.id;
    });
    beforeEach(async () => {
      const session = await prisma.testSession.create({
        data: {
          user_id: userId,
          mode: "quick",
          entry_topic_id: topicId,
          status: "in_progress",
          session_state: "",
        },
      });
      sessionId = session.id;
    });
    afterEach(async () => {
      await prisma.testSession.deleteMany();
    });
    it("should return successfull service response with session id and status", async () => {
      await expect(sessionService.abandon(sessionId)).resolves.toMatchObject(
        ServiceResponse.success(
          "Session abandoned",
          { id: sessionId, status: "abandoned" },
          200,
        ),
      );
      const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
      });
      expect(session?.status).toMatch("abandoned");
      expect(session?.completed_at).toBe(null);
    });
    it("should return service failure with status 500 when session id is invalid", async () => {
      const invalidId = "invalidId";
      await expect(sessionService.abandon(invalidId)).resolves.toMatchObject(
        ServiceResponse.failure("Failed to abandon session", null, 500),
      );
      const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
      });
      expect(session?.status).toMatch("in_progress");
      expect(session?.completed_at).toBe(null);
    });
    it("should return service failure with status 500 if session does not exist", async () => {
      const fakeId = uuidv4();
      await expect(sessionService.abandon(fakeId)).resolves.toMatchObject(
        ServiceResponse.failure("Failed to abandon session", null, 500),
      );
      const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
      });
      expect(session?.status).toMatch("in_progress");
      expect(session?.completed_at).toBe(null);
    });
  });

  describe("Get results", () => {
    let sessionId: string;
    let topicId: string;

    beforeAll(async () => {
      await clearTables();

      const user = await prisma.user.create({
        data: {
          email: "email@example.com",
          password: "supersecurepassword",
          first_name: "John",
          last_name: "Doe",
        },
      });
      const topic = await prisma.topic.create({ data: topicFixtures.topic1 });

      const sessionState: SessionState = {
        entryTopicId: topicFixtures.topic1.id,
        mode: "quick",
        probeOrder: [topicFixtures.topic1.id],
        currentProbeIndex: 1,
        currentQuestionIndex: 1,
        topicStates: {
          [topicFixtures.topic1.id]: {
            topicId: topicFixtures.topic1.id,
            status: "proficient",
            questionsAsked: [],
            answers: [],
            score: 1,
          },
        },
        pendingQuestions: [],
        dependencyMap: { [topicFixtures.topic1.id]: [] },
        weaknessMap: { gaps: [], proficient: [topicFixtures.topic1.id] },
        completed: true,
      };
      const session = await prisma.testSession.create({
        data: {
          user_id: user.id,
          mode: "quick",
          entry_topic_id: topic.id,
          status: "in_progress",
          session_state: JSON.stringify(sessionState),
        },
      });
      sessionId = session.id;
      topicId = topic.id;
    });

    it("should return successful service response with results object", async () => {
      await expect(sessionService.getResults(sessionId)).resolves.toMatchObject(
        ServiceResponse.success(
          "Results retrieved",
          {
            entryTopicId: topicId,
            mode: "quick",
            scoreByTopicId: { [topicId]: 1 },
            sessionId,
          },
          200,
        ),
      );
    });

    it("should return service failure with status 500 if sessionId is invalid", async () => {
      await expect(
        sessionService.getResults("invalidId"),
      ).resolves.toMatchObject(
        ServiceResponse.failure("Failed to get results", null, 500),
      );
    });

    it("should return service failure with status 404 if session does not exist", async () => {
      await expect(sessionService.getResults(uuidv4())).resolves.toMatchObject(
        ServiceResponse.failure("Session not found", null, 404),
      );
    });
  });
});
