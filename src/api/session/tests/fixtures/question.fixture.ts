import { v4 as uuidv4 } from "uuid";

export interface Question {
  id: string;
  topic_id: string;
  text: string;
  type: "multiple_choice";
  difficulty: "easy" | "medium" | "hard";
  correct_answer: "A" | "B" | "C" | "D";
  options: string[];
  explanation?: string;
}

export function constructQuestion(topicId: string) {
  const question: Question = {
    id: uuidv4(),
    topic_id: topicId,
    text: "Which keyword is used to define an interface in Typescript?",
    type: "multiple_choice",
    difficulty: "easy",
    correct_answer: "B",
    options: ["type", "interface", "class", "struct"],
    explanation:
      "The 'interface keyword is explicitly used to define an interface structure in typescript",
  };
  return question;
}

export function constructQuestions(topicIds: string[]) {
  const questions: Question[] = [];
  for (const topicId of topicIds) {
    questions.push(constructQuestion(topicId));
  }
  return questions;
}
