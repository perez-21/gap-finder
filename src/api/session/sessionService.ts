import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import { generateQuestionsForTopic } from "@/api/session/questionGeneration";
import {
  createQuestion,
  getDependencySubgraph,
  getDirectDependencies,
  getQuestionsForTopic,
  getTopic,
  getTopics,
} from "@/api/session/sessionDatabase";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  GeneratedQuestion,
  PendingQuestion,
  SessionState,
  TopicProbeState,
  TopicStatus,
} from "@/api/session/sessionTypes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";
import { prisma } from "../../generated/prisma/singleton";
import type { SessionAbandonResponse, SessionAnswerResponse, SessionResultsResponse, SessionStatusResponse } from "./sessionModel";

/**
 * Main session service implementing the contract from sessions.md
 */
export class SessionService {
  /**
   * POST /sessions - Create a new adaptive session
   *
   * Logic:
   * 1. Fetch full dependency subgraph via recursive CTE
   * 2. Order all dependency nodes by depth DESC (deepest prerequisites first)
   * 3. probeOrder = [entryTopicId, ...depNodes]
   * 4. Cache directDependencies map for all nodes in probeOrder
   * 5. Generate questions for entryTopicId (first probe)
   * 6. Initialize SessionState (all topics untested)
   * 7. Return first question to client
   */
  async create(
    userId: string,
    request: CreateSessionRequest,
  ): Promise<ServiceResponse<CreateSessionResponse> | ServiceResponse<null>> {
    try {
      // Step 1: Fetch entry topic
      const entryTopic = await getTopic(request.topicId);
      if (!entryTopic) {
        return ServiceResponse.failure(
          `Topic not found: ${request.topicId}`,
					null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Step 2: Fetch full dependency subgraph
      const depSubgraph = await getDependencySubgraph(request.topicId);
      const depTopicIds = depSubgraph.map(
        (d) => d.topic_id as unknown as string,
      );

      // Step 3: Build probeOrder [entryTopicId, ...depNodes]
      const probeOrder = [request.topicId, ...depTopicIds];

      // Step 4: Build dependencyMap (direct dependencies for each topic in probeOrder)
      const dependencyMap: Record<string, string[]> = {};
      for (const topicId of probeOrder) {
        const deps = await getDirectDependencies(topicId);
        dependencyMap[topicId] = deps.map((d) => d as unknown as string);
      }

      // Fetch all topic details for later use
      const topics = await getTopics(probeOrder);
      const topicMap = new Map(
        topics.map((t) => [t.id as unknown as string, t]),
      );

      // Step 5: Pre-generate questions for all topics
      const allGeneratedQuestions: Record<string, GeneratedQuestion[]> = {};

      for (const topicId of probeOrder) {
        const topic = topicMap.get(topicId as unknown as string);
        if (!topic) continue;

        // Get dependency titles
        const depIds = dependencyMap[topicId] || [];
        const depTopics = await getTopics(
          depIds.map((id) => id as unknown as string),
        );
        const depTitles = depTopics.map((t) => t.title);

        // Generate questions
        const generated = await generateQuestionsForTopic({
          title: topic.title,
          description: topic.description,
          curriculumLevel: topic.curriculum_level,
          dependencyTitles: depTitles,
        });

        if (generated.length === 0) {
          console.warn(`Failed to generate questions for topic ${topicId}`);
          continue;
        }

        allGeneratedQuestions[topicId] = generated;

        // Persist questions to database
        for (const q of generated) {
          try {
            await createQuestion({
              topicId: topicId,
              text: q.text,
              type: "multiple_choice",
              difficulty:
                q.difficulty === 1
                  ? "easy"
                  : q.difficulty === 2
                    ? "medium"
                    : "hard",
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            });
          } catch (error) {
            console.error(
              `Failed to persist question for topic ${topicId}:`,
              error,
            );
          }
        }
      }

      // Step 6: Initialize SessionState
      const topicStates: Record<string, TopicProbeState> = {};
      const pendingQuestionsForEntry: PendingQuestion[] = [];

      for (const topicId of probeOrder) {
        topicStates[topicId] = {
          topicId: topicId,
          status: "untested",
          questionsAsked: [],
          answers: [],
          score: null,
        };

        // For the entry topic, prepare pending questions
        if (topicId === request.topicId && allGeneratedQuestions[topicId]) {
          const dbQuestions = await getQuestionsForTopic(
            topicId,
            env.QUESTIONS_PER_PROBE,
          );
          pendingQuestionsForEntry.push(
            ...dbQuestions.map((q) => ({
              questionId: q.id as unknown as string,
              text: q.text,
              type: q.type,
              options: (q.options as string[]) || [],
            })),
          );
        }
      }

      const sessionState: SessionState = {
        mode: request.mode,
        entryTopicId: request.topicId,
        probeOrder: probeOrder,
        currentProbeIndex: 0,
        currentQuestionIndex: 0,
        topicStates: topicStates,
        pendingQuestions: pendingQuestionsForEntry,
        dependencyMap: dependencyMap,
        weaknessMap: {
          gaps: [],
          proficient: [],
        },
        completed: false,
      };

      // Create test session in database
      const sessionId = uuidv4();
      const testSession = await prisma.testSession.create({
        data: {
          id: sessionId,
          user_id: userId as string,
          entry_topic_id: request.topicId,
          mode: request.mode,
          status: "in_progress",
          session_state: JSON.stringify(sessionState),
        },
      });

      // Step 7: Return first question
      const firstQuestion = pendingQuestionsForEntry[0] || null;

      return ServiceResponse.success<CreateSessionResponse>(
        "Session created successfully",
        {
          sessionId: testSession.id,
          mode: request.mode,
          totalTopicsToProbe: probeOrder.length,
          currentTopic: {
            id: entryTopic.id,
            title: entryTopic.title,
          },
          question: firstQuestion
            ? {
                id: firstQuestion.questionId,
                text: firstQuestion.text,
                type: firstQuestion.type,
                options: firstQuestion.options,
              }
            : {
                id: "",
                text: "Failed to generate questions",
                type: "multiple_choice",
                options: [],
              },
        },
        StatusCodes.CREATED,
      );
    } catch (error) {
      console.error("Error creating session:", error);
      return ServiceResponse.failure(
        "Failed to create session",
				null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getById(
    sessionId: string,
  ): Promise<ServiceResponse<SessionStatusResponse> | ServiceResponse<null>> {
    try {
      const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
        include: { entry_topic: true },
      });

      if (!session) {
        return ServiceResponse.failure(
          "Session not found",
					null,
          StatusCodes.NOT_FOUND,
        );
      }

      const state = JSON.parse(session.session_state as string) as SessionState;

      return ServiceResponse.success("Session retrieved", {
        id: session.id,
        status: session.status,
        progress: {
          answeredCount: Object.values(state.topicStates).reduce(
            (sum, ts) => sum + ts.answers.length,
            0,
          ),
          totalPlanned: state.probeOrder.length,
        },
      });
    } catch (error) {
      console.error("Error getting session:", error);
      return ServiceResponse.failure(
        "Failed to get session",
				null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async submitAnswer(
    sessionId: string,
    questionId: string,
    userAnswer: string,
  ): Promise<ServiceResponse<SessionAnswerResponse> | ServiceResponse<null>> {
    try {
      const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return ServiceResponse.failure(
          "Session not found",
					null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (session.status !== "in_progress") {
        return ServiceResponse.failure(
          "Session is not in progress",
					null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const sessionState = JSON.parse(
        session.session_state as string,
      ) as SessionState;

      // This should:
      // 1. Check if answer is correct
      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });
      if (!question) {
        return ServiceResponse.failure(
          "Question not found",
					null,
          StatusCodes.NOT_FOUND,
        );
      }
      // 2. Update topicStates

      let sessionStateStatus: TopicStatus = "untested";
      let answerIsCorrect = false;
      let scoreGain = 0;
      if (userAnswer.toLowerCase() === question.correct_answer.toLowerCase()) {
        answerIsCorrect = true;
        scoreGain = 1 / env.QUESTIONS_PER_PROBE;
        if (
          session.status === "in_progress" &&
          sessionState.topicStates[
            sessionState.probeOrder[sessionState.currentProbeIndex]
          ].questionsAsked.length < env.QUESTIONS_PER_PROBE
        ) {
          sessionStateStatus = "probing";
        }
      }

      sessionState.topicStates[
        sessionState.probeOrder[sessionState.currentProbeIndex]
      ].status = sessionStateStatus;

      sessionState.topicStates[
        sessionState.probeOrder[sessionState.currentProbeIndex]
      ].questionsAsked.push(
        sessionState.pendingQuestions[sessionState.currentQuestionIndex]
          .questionId,
      );

      sessionState.topicStates[
        sessionState.probeOrder[sessionState.currentProbeIndex]
      ].answers.push({
        questionId:
          sessionState.pendingQuestions[sessionState.currentQuestionIndex]
            .questionId,
        isCorrect: answerIsCorrect,
      });

      if (
        typeof sessionState.topicStates[
          sessionState.probeOrder[sessionState.currentProbeIndex]
        ].score !== "number"
      ) {
        return ServiceResponse.failure("", null,  StatusCodes.INTERNAL_SERVER_ERROR);
      }
      let newTopicScore = sessionState.topicStates[
        sessionState.probeOrder[sessionState.currentProbeIndex]
      ].score as number;
      newTopicScore += scoreGain;
      sessionState.topicStates[
        sessionState.probeOrder[sessionState.currentProbeIndex]
      ].score = newTopicScore;

      // 3. Determine next question or topic
      if (
        sessionState.topicStates[
          sessionState.probeOrder[sessionState.currentProbeIndex]
        ].questionsAsked.length === env.QUESTIONS_PER_PROBE
      ) {
        sessionState.currentProbeIndex += 1;
        sessionState.currentQuestionIndex = 0;
      } else {
        sessionState.currentQuestionIndex += 1;
      }

      if (sessionState.currentProbeIndex >= sessionState.probeOrder.length) {
        sessionState.completed = true;
      }

      // 4. Update session state
      const serializedSessionState = JSON.stringify(sessionState);
      const updatedSession = await prisma.testSession.update({
        where: { id: sessionId },
        data: {
          session_state: serializedSessionState as string,
          completed_at: sessionState.completed ? new Date() : null,
        },
      });
      // 5. Return next question or completion status

			const updatedSessionState = JSON.parse(updatedSession.session_state as string) as SessionState;
      if (sessionState.completed) {
        return ServiceResponse.success("Answer submitted", {
          type: "complete",
          weaknessMap: updatedSessionState.weaknessMap,
        });
      }

      const nextQuestion = await prisma.question.findUnique({
        where: {
          id: sessionState.pendingQuestions[sessionState.currentQuestionIndex]
            .questionId,
        },
        omit: { created_at: true, updated_at: true, correct_answer: true },
      });

      if (!nextQuestion) {
        // TODO: probably have to clean up or something
        return ServiceResponse.failure(
          "Could not find next question",
					null,
          StatusCodes.NOT_FOUND,
        );
        // CONSIDER: this is arguably an internal server error
      }

      return ServiceResponse.success("Answer submitted", {
        type: "question",
        progress: {
          topicsProbed: sessionState.currentProbeIndex + 1,
          totalTopicsToProbe: sessionState.probeOrder.length,
        },
        question: nextQuestion,
        previousAnswer: {
          wasCorrect: answerIsCorrect,
          explanation: question.explanation,
        },
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
      return ServiceResponse.failure(
        "Failed to submit answer",
				null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async abandon(
    sessionId: string,
  ): Promise<ServiceResponse<SessionAbandonResponse> | ServiceResponse<null>> {
    try {
      const session = await prisma.testSession.update({
        where: { id: sessionId },
        data: { status: "abandoned" },
      });

      return ServiceResponse.success("Session abandoned", {
        id: session.id,
        status: "abandoned",
      });
    } catch (error) {
      console.error("Error abandoning session:", error);
      return ServiceResponse.failure(
        "Failed to abandon session", 
				null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getResults(
    sessionId: string,
  ): Promise<ServiceResponse<SessionResultsResponse> | ServiceResponse<null>> {
    try {
      const session = await prisma.testSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return ServiceResponse.failure(
          "Session not found",
					null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (typeof session.session_state !== "string") {
        return ServiceResponse.failure(
          "Session state missing",
					null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
      const sessionState = JSON.parse(session.session_state) as SessionState;

      const topicStates = Object.values(sessionState.topicStates);

      const scoreByTopicId: Record<string, number> = {};
      for (const topicState of topicStates) {
        scoreByTopicId[topicState.topicId] = topicState.score || 0;
      }

      return ServiceResponse.success("Results retrieved", {
        sessionId: session.id,
        mode: session.mode,
        entryTopicId: session.entry_topic_id,
        scoreByTopicId: scoreByTopicId,
      });
    } catch (error) {
      console.error("Error getting results:", error);
      return ServiceResponse.failure(
        "Failed to get results",
				null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const sessionService = new SessionService();
