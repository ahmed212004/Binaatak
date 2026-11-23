import { apiRequest } from "./api";
import { AccountType } from "../data/mockData";

const accountTypeToEnum: Record<AccountType, number> = {
  "شخص": 1,
  "شركة": 2,
  "مصنع": 3,
  "مهندس": 4,
  "مقاول": 5,
  "فني": 6,
  "مورد": 7,
};

export const authService = {
  login: async (emailOrPhone: string, password: string) => {
    const cleanId = (emailOrPhone ?? "").trim();
    const res = await apiRequest<{ token?: string; accessToken?: string; user?: any }>("/Auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: cleanId,
        emailOrPhone: cleanId,
        password,
      }),
    });

    const token = res?.token || res?.accessToken;
    if (token) {
      localStorage.setItem("accessToken", token);
    }
    if (res?.user) {
      localStorage.setItem("user", JSON.stringify(res.user));
    }
    return res;
  },

  register: async (data: {
   displayName: string;
    email: string;
    phoneNumber: string;
    password: string;
    accountType: AccountType;
    logoUrl?: string;
  }) => {
    const res = await apiRequest<{ token?: string; accessToken?: string; user?: any }>("/Auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        accountType: accountTypeToEnum[data.accountType] ?? 1,
      }),
    });

    const token = res?.token || res?.accessToken;
    if (token) {
      localStorage.setItem("accessToken", token);
    }
    if (res?.user) {
      localStorage.setItem("user", JSON.stringify(res.user));
    }
    return res;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  isAuthenticated: () => Boolean(localStorage.getItem("accessToken")),
};