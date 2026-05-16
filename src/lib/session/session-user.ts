export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt?: string;
  avatarUrl?: string | null;
}

const EVENT_NAME = "user-session-updated";

export function readSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function writeSessionUser(user: SessionUser) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { user } }));
}

export function userSessionEventName() {
  return EVENT_NAME;
}
