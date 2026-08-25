export type WazekoErrorCode =
  | "CONNECTION"
  | "AUTHENTICATION"
  | "PROTOCOL"
  | "SESSION"
  | "MESSAGE"
  | "MEDIA";

export class WazekoError extends Error {
  constructor(
    public readonly code: WazekoErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "WazekoError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConnectionError extends WazekoError {
  constructor(message: string, cause?: unknown) {
    super("CONNECTION", message, cause);
  }
}

export class AuthenticationError extends WazekoError {
  constructor(message: string, cause?: unknown) {
    super("AUTHENTICATION", message, cause);
  }
}

export class ProtocolError extends WazekoError {
  constructor(message: string, cause?: unknown) {
    super("PROTOCOL", message, cause);
  }
}

export class SessionError extends WazekoError {
  constructor(message: string, cause?: unknown) {
    super("SESSION", message, cause);
  }
}

export class MessageError extends WazekoError {
  constructor(message: string, cause?: unknown) {
    super("MESSAGE", message, cause);
  }
}
