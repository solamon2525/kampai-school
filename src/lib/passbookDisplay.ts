export const PASSBOOK_SCHOOL_TITLE = 'โรงเรียนบ้านคำไผ่ สพป.อุดรธานี เขต 2';

export function getPassbookTransactionMeta(transactionType: string) {
  const isWithdrawal = transactionType === 'withdraw';
  return {
    isWithdrawal,
    stampLabel: isWithdrawal ? 'ถอนเงินแล้ว' : 'รับฝากแล้ว',
    amountPrefix: isWithdrawal ? '-' : '+',
  };
}
