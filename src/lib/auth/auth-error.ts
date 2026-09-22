export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: "unauthenticated" | "forbidden" = "unauthenticated"
  ) {
    super(message);
    this.name = "AuthError";
  }
}
