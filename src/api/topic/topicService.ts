import { StatusCodes } from "http-status-codes";
import type { TopicDetailResponse, TopicsListResponse } from "@/api/topic/topicModel";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { prisma } from "@/generated/prisma/singleton";

export class TopicService {
	async listWithEdges(): Promise<ServiceResponse<TopicsListResponse>> {
		return ServiceResponse.success("Stub", { topics: [], edges: [] });
	}

	async getByIdWithDependencies(
		topicId: string,
	): Promise<ServiceResponse<TopicDetailResponse> | ServiceResponse<unknown>> {
		const topic = await prisma.topic.findUnique({ where: { id: topicId } });

		if (!topic) {
			return ServiceResponse.failure("Could not find topic", null, StatusCodes.NOT_FOUND);
		}

		const dependencyMap = await prisma.topicDependency.findMany({ where: { topic_id: topic.id } });

		const dependencyIds = dependencyMap.map((topicDependency) => {
			return topicDependency.depends_on_topic_id;
		});

		const dependencies = await prisma.topic.findMany({ where: { id: { in: dependencyIds } } });

		return ServiceResponse.success(
			"Topic dependencies fetched successfully",
			{
				topic: topic,
				dependencies: dependencies,
			},
			StatusCodes.OK,
		);
	}
}

export const topicService = new TopicService();
