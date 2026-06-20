type LogLevel = "info" | "warn" | "error";

export class StructuredLogger {
  constructor(private readonly component: string) {}

  info(message: string, metadata?: Record<string, unknown>) {
    this.write("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.write("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>) {
    this.write("error", message, metadata);
  }

  private write(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      ...(metadata ?? {})
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }
}
