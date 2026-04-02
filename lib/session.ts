import { getIronSession, IronSessionData } from "iron-session";
import { cookies } from "next/headers";

declare module "iron-session" {
  interface IronSessionData {
    user?: {
      id: string;
      email: string;
      name: string;
      plan: string;
    };
  }
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET ?? "development-secret-at-least-32-chars-long-here",
  cookieName: "celengan_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
  return session;
}

export async function getAuthUser() {
  const session = await getSession();
  return session.user ?? null;
}
