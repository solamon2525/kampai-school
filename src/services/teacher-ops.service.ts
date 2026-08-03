import { assignmentsService } from '@/services/assignments.service';
import { educationalHubService } from '@/services/educational-hub.service';
import { rewardClaimsService } from '@/services/waste-bank.service';
import { suppliesService } from '@/services/supplies.service';

export const teacherOpsService = {
  /** Pending actions for teacher dashboard — grading, rewards, upload habit, supplies. */
  async pendingSummary(staffId: string | null) {
    const [grading, claimsRes, uploadStats, mySupplyPending] = await Promise.all([
      assignmentsService.countPendingGrading(),
      rewardClaimsService.listPending(),
      staffId ? educationalHubService.getMyUploadStats(staffId) : Promise.resolve(null),
      staffId
        ? suppliesService.listRequests({ staffId, status: 'รออนุมัติ' })
        : Promise.resolve([]),
    ]);
    if (claimsRes.error) throw claimsRes.error;

    return {
      pendingGrading: grading.pending,
      firstAssignmentId: grading.firstAssignmentId,
      pendingRewards: claimsRes.data?.length ?? 0,
      pendingSupplies: mySupplyPending.length,
      uploadStats,
      needsFirstUpload: uploadStats ? uploadStats.published === 0 : false,
    };
  },
};
