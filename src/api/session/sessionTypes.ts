export type TopicStatus = "untested" | "probing" | "proficient" | "gap";

export interface TopicProbeState {
  topicId: string;
  status: TopicStatus;
  questionsAsked: string[]; // question IDs in order
  answers: {
    questionId: string;
    isCorrect: boolean;
  }[];
  score: number | null; // null until probe completes
}

export interface PendingQuestion {
  questionId: string;
  text: string;
  type: string;
  options: string[];
}

export interface SessionState {
  mode: "quick" | "infinite";
  entryTopicId: string;
  probeOrder: string[]; // topic IDs, entry topic first, deps deepest-first
  currentProbeIndex: number; // index into probeOrder
  currentQuestionIndex: number; // 0, 1, or 2 within current probe
  topicStates: Record<string, TopicProbeState>;
  pendingQuestions: PendingQuestion[]; // pre-generated questions for current probe topic
  dependencyMap: Record<string, string[]>; // topicId → direct dependency IDs (cached at creation)
  weaknessMap: {
    gaps: string[];
    proficient: string[];
  };
  completed: boolean;
}

export interface GeneratedQuestion {
  difficulty: 1 | 2 | 3;
  text: string;
  options: string[];
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface CreateSessionRequest {
  topicId: string;
  mode: "quick" | "infinite";
}

export interface CurrentTopic {
  id: string;
  title: string;
}

export interface Question {
  id: string;
  text: string;
  type: string;
  options: string[];
}

export interface CreateSessionResponse {
  sessionId: string;
  mode: "quick" | "infinite";
  totalTopicsToProbe: number;
  currentTopic: CurrentTopic;
  question: Question;
}
