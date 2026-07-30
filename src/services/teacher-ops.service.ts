import { assignmentsService } from '@/services/assignments.service';
import { educationalHubService } from '@/services/educational-hub.service';
import { rewardClaimsService } from '@/services/waste-bank.service';

export const teacherOpsService = {
  /** Pending actions for teacher dashboard — grading, rewards, upload habit. */
  async pendingSummary(staffId: string | null) {
    const [grading, claimsRes, uploadStats] = await Promise.all([
      assignmentsService.countPendingGrading(),
      rewardClaimsService.listPending(),
      staffId ? educationalHubService.getMyUploadStats(staffId) : Promise.resolve(null),
    ]);
    if (claimsRes.error) throw claimsRes.error;

    return {
      pendingGrading: grading.pending,
      firstAssignmentId: grading.firstAssignmentId,
      pendingRewards: claimsRes.data?.length ?? 0,
      uploadStats,
      needsFirstUpload: uploadStats ? uploadStats.published === 0 : false,
    };
  },
};
