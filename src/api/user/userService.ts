import type { UserScoresResponse, UserSessionsResponse } from "@/api/user/userModel";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { prisma } from "@/generated/prisma/singleton";
import { StatusCodes } from "http-status-codes";
export class UserService {
	async getMyScores(): Promise<ServiceResponse<UserScoresResponse>> {

		// TODO: answer the question: are we aggregating or returning a value?
		return ServiceResponse.success("Stub", []);
	}

	async getMySessions(userId: string): Promise<ServiceResponse<UserSessionsResponse> | ServiceResponse<unknown>>{
		const sessions = await prisma.testSession.findMany({ where: { user_id: userId }});
		if (!sessions.length) {
			return ServiceResponse.failure("Sessions do not exist for this user", null, StatusCodes.NOT_FOUND);
		}

		const sessionHistory = sessions.map((session) => {
			return {
				id: session.id,
				status: session.status,
				startedAt: session.created_at,
				endedAt: session.completed_at
			}
		})

		return ServiceResponse.success("Sessions found successfully", sessionHistory, StatusCodes.OK);
	}
}

export const userService = new UserService();
