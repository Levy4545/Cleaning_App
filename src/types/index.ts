export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};
