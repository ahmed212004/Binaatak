export type AccountType =
  | "طالب خدمة"
  | "مهندس"
  | "مقاول"
  | "شركة"
  | "مصنع"
  | "فني"
  | "مورد";

export type Tax = { category: string; sub: string; specialty: string };

export type ProfileState = {
  name: string;
  type: AccountType;
  tax: Tax;
  bio?: string;
  location?: string;
  logoUrl?: string;
};

export const providerAccountTypes: AccountType[] = [
  "مهندس",
  "مقاول",
  "شركة",
  "مصنع",
  "فني",
  "مورد",
];

export const allAccountTypes: AccountType[] = [
  "طالب خدمة",
  ...providerAccountTypes,
];

export function isServiceProvider(type?: string): boolean {
  if (!type) return false;
  return providerAccountTypes.includes(type as AccountType);
}

export const accountTypeFromId: Record<number, AccountType> = {
  1: "طالب خدمة",
  2: "شركة",
  3: "مصنع",
  4: "مهندس",
  5: "مقاول",
  6: "فني",
  7: "مورد",
};

export const accountTypeToId: Record<string, number> = {
  "طالب خدمة": 1,
  "شخص": 1,
  "شركة": 2,
  "مصنع": 3,
  "مهندس": 4,
  "مقاول": 5,
  "فني": 6,
  "مورد": 7,
};

export const guestProfile: ProfileState = {
  name: "زائر (سجّل الدخول)",
  type: "طالب خدمة",
  tax: {
    category: "",
    sub: "",
    specialty: "",
  },
};