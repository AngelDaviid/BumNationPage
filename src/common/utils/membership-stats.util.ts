export function calculateMembershipStats(membership: {
  startDate: Date;
  nextPaymentDate: Date;
  status: string;
  expiredAt: Date | null;
}) {
  const today = new Date();

  const daysAsMember = Math.floor(
    (today.getTime() - membership.startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const rawDaysUntilExpire = Math.floor(
    (membership.nextPaymentDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const isExpired = rawDaysUntilExpire < 0;

  const daysSinceExpired = isExpired
    ? Math.floor(
        (today.getTime() -
          (membership.expiredAt ?? membership.nextPaymentDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return {
    daysAsMember,
    daysUntilExpire: Math.max(0, rawDaysUntilExpire),
    daysSinceExpired,
    isAboutExpire: rawDaysUntilExpire <= 7 && rawDaysUntilExpire >= 0,
    isExpired,
  };
}
