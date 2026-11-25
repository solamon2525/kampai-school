export interface ConductScoreMetricInput {
  type: 'add' | 'deduct' | string;
  score: number;
  category?: string | null;
  reward_claim_id?: string | null;
}

export interface VirtueSummary {
  rawNetXp: number;
  honorXp: number;
  spentVirtue: number;
  availablePoints: number;
  hasNegativeBalance: boolean;
}

export function isRewardDeductionRecord(
  record: Pick<ConductScoreMetricInput, 'category' | 'reward_claim_id'>,
): boolean {
  return record.reward_claim_id != null || record.category === 'reward';
}

export function computeVirtueSummary(
  records: ConductScoreMetricInput[],
  pendingVirtuePoints: number = 0,
): VirtueSummary {
  let rawNetXp = 0;
  let spentConfirmed = 0;

  for (const r of records) {
    const pts = Number(r.score) || 0;
    if (r.type === 'add') {
      rawNetXp += pts;
    } else if (isRewardDeductionRecord(r)) {
      spentConfirmed += pts;
    } else {
      rawNetXp -= pts;
    }
  }

  const honorXp = Math.max(0, rawNetXp);
  const spentVirtue = spentConfirmed + Math.max(0, pendingVirtuePoints);
  const availablePoints = Math.max(0, honorXp - spentVirtue);

  return {
    rawNetXp,
    honorXp,
    spentVirtue,
    availablePoints,
    hasNegativeBalance: rawNetXp < 0,
  };
}
