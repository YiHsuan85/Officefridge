export interface FoodItem {
  id: string;
  name: string;
  owner: string;
  expiryDate: string; // YYYY-MM-DD
  isEaten: boolean;
  createdAt: string;
}

export type OwnerName = 'Wei' | '恩7' | 'Wu' | '龐龐' | '語蓁' | '大白' | '687';

export const OWNERS: OwnerName[] = ['Wei', '恩7', 'Wu', '龐龐', '語蓁', '大白', '687'];

export interface StockStats {
  total: number;
  fresh: number;      // > 14 days
  warning: number;    // 7 - 14 days
  danger: number;     // < 7 days
  expired: number;    // < 0 days (subset of danger)
  expiredAndNotEaten: number;
  eaten: number;
}
