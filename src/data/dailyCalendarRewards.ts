export interface DailyCalendarReward {
  day: number;
  title: string;
  gold: number;
}

export const DAILY_CALENDAR_REWARDS: DailyCalendarReward[] = [
  { day: 1, title: 'Spark Ration', gold: 15 },
  { day: 2, title: 'Pulse Token', gold: 18 },
  { day: 3, title: 'Hydration Cache', gold: 20 },
  { day: 4, title: 'Fiber Stock', gold: 22 },
  { day: 5, title: 'Olive Reserve', gold: 24 },
  { day: 6, title: 'Ritual Ember', gold: 26 },
  { day: 7, title: 'Week One Cache', gold: 50 },
  { day: 8, title: 'Produce Surge', gold: 28 },
  { day: 9, title: 'Legume Vault', gold: 30 },
  { day: 10, title: 'Pantry Pulse', gold: 32 },
  { day: 11, title: 'Discipline Fuel', gold: 34 },
  { day: 12, title: 'Mind Focus Kit', gold: 36 },
  { day: 13, title: 'Social Table Pass', gold: 38 },
  { day: 14, title: 'Week Two Cache', gold: 70 },
  { day: 15, title: 'Mediterranean Core', gold: 40 },
  { day: 16, title: 'Whole Grain Pack', gold: 42 },
  { day: 17, title: 'Fish Day Permit', gold: 44 },
  { day: 18, title: 'Salt Guard Seal', gold: 46 },
  { day: 19, title: 'Sugar Brake Chip', gold: 48 },
  { day: 20, title: 'Budget Basket', gold: 50 },
  { day: 21, title: 'Week Three Cache', gold: 90 },
  { day: 22, title: 'Longevity Wire', gold: 52 },
  { day: 23, title: 'Ritual Chain Link', gold: 54 },
  { day: 24, title: 'Community Meal Sigil', gold: 56 },
  { day: 25, title: 'Arc Catalyst', gold: 58 },
  { day: 26, title: 'Pulse Amplifier', gold: 60 },
  { day: 27, title: 'Recovery Relay', gold: 62 },
  { day: 28, title: 'Week Four Cache', gold: 110 },
  { day: 29, title: 'Elder Recipe Core', gold: 70 },
  { day: 30, title: 'Ascension Cache', gold: 180 },
];

export function getCalendarRewardByIndex(index: number): DailyCalendarReward {
  const safeIndex = ((index % DAILY_CALENDAR_REWARDS.length) + DAILY_CALENDAR_REWARDS.length) % DAILY_CALENDAR_REWARDS.length;
  return DAILY_CALENDAR_REWARDS[safeIndex];
}
