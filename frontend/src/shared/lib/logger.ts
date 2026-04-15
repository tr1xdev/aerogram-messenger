type LogLevel = "info" | "error" | "success" | "warn" | "debug";

type LogNamespace =
  | "RELAY"
  | "AUTH"
  | "NETWORK"
  | "WS"
  | "STORE"
  | "CONFIG"
  | "APP"
  | "CHAT"
  | "UI"
  | "NAV"
  | "USER_ACTION";

const COLORS: Record<LogNamespace | LogLevel, string> = {
  info: "#3b82f6",
  error: "#ef4444",
  success: "#10b981",
  warn: "#f59e0b",
  debug: "#64748b",
  RELAY: "#f26b00",
  AUTH: "#8b5cf6",
  NETWORK: "#0ea5e9",
  WS: "#ec4899",
  STORE: "#14b8a6",
  CONFIG: "#475569",
  APP: "#000000",
  CHAT: "#10b981",
  UI: "#6366f1",
  NAV: "#f43f5e",
  USER_ACTION: "#ef4444",
};

class Logger {
  private static instance: Logger;
  private readonly isDev: boolean = import.meta.env.DEV;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getBadgeStyle(color: string): string {
    return `background: ${color}; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold; font-size: 10px; font-family: ui-monospace, monospace;`;
  }

  private dispatch(
    ns: LogNamespace,
    message: string,
    data: unknown,
    level: LogLevel,
  ): void {
    if (!this.isDev) return;

    const color: string = COLORS[ns] || COLORS[level];
    const template: string = ` %c${ns}%c ${message}`;
    const badge: string = this.getBadgeStyle(color);
    const text: string = "color: inherit; font-weight: normal;";

    if (data !== undefined) {
      console.groupCollapsed(template, badge, text);
      if (Array.isArray(data) && data.length > 0) {
        console.table(data);
      } else {
        console.dir(data);
      }
      console.groupEnd();
    } else {
      const method =
        level === "error"
          ? "error"
          : level === "warn"
            ? "warn"
            : level === "debug"
              ? "debug"
              : "log";
      console[method](template, badge, text);
    }
  }

  public relay(msg: string, data?: unknown): void {
    this.dispatch("RELAY", msg, data, "info");
  }

  public auth(msg: string, data?: unknown): void {
    this.dispatch("AUTH", msg, data, "info");
  }

  public ws(msg: string, data?: unknown): void {
    this.dispatch("WS", msg, data, "info");
  }

  public store(msg: string, data?: unknown): void {
    this.dispatch("STORE", msg, data, "debug");
  }

  public network(msg: string, data?: unknown): void {
    this.dispatch("NETWORK", msg, data, "info");
  }

  public chat(msg: string, data?: unknown): void {
    this.dispatch("CHAT", msg, data, "info");
  }

  public ui(msg: string, data?: unknown): void {
    this.dispatch("UI", msg, data, "info");
  }

  public info(ns: LogNamespace, msg: string, data?: unknown): void {
    this.dispatch(ns, msg, data, "info");
  }

  public debug(ns: LogNamespace, msg: string, data?: unknown): void {
    this.dispatch(ns, msg, data, "debug");
  }

  public success(ns: LogNamespace, msg: string, data?: unknown): void {
    this.dispatch(ns, msg, data, "success");
  }

  public warn(ns: LogNamespace, msg: string, data?: unknown): void {
    this.dispatch(ns, msg, data, "warn");
  }

  public error(ns: LogNamespace, msg: string, data?: unknown): void {
    this.dispatch(ns, msg, data, "error");
  }
}

export const logger: Logger = Logger.getInstance();
