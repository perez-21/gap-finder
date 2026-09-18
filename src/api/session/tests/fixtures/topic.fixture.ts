import { v4 as uuidv4 } from "uuid";
import { academic_level } from "@/generated/prisma/client";

interface CreateTopicInput {
  id: string;
  title: string;
  curriculum_level: academic_level;
}
const topicId_1 = uuidv4();
const topicId_2 = uuidv4();
const topicId_3 = uuidv4();
const topicId_4 = uuidv4();
const topicId_5 = uuidv4();

export const topic1: CreateTopicInput = {
  id: topicId_1,
  title: "Properties of Matter",
  curriculum_level: academic_level.foundation,
};
export const topic2: CreateTopicInput = {
  id: topicId_2,
  title: "Forces and Motion",
  curriculum_level: academic_level.foundation,
};
export const topic3: CreateTopicInput = {
  id: topicId_3,
  title: "Atoms and Elements",
  curriculum_level: academic_level.ss1,
};
export const topic4: CreateTopicInput = {
  id: topicId_4,
  title: "Molecules and Compounds",
  curriculum_level: academic_level.ss1,
};
export const topic5: CreateTopicInput = {
  id: topicId_5,
  title: "Chemical Reactions",
  curriculum_level: academic_level.ss2,
};

export const topicIds: string[] = [
  topicId_1,
  topicId_2,
  topicId_3,
  topicId_4,
  topicId_5,
];
