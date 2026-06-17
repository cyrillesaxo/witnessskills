/**
 * logger.ts — Structured logging for WitnessSkills
 *
 * Features:
 *  - Log levels: debug | info | warn | error
 *  - Structured entries with timestamp, level, message, context, userId, route
 *  - Breadcrumb ring-buffer (last 50 events) for pre-error trail
 *  - In-memory log buffer (last 200 entries) inspectable via logger.getLogs()
 *  - Global window.onerror + unhandledrejection handlers registered via logger.init()
 *  - Production-aware: debug/info suppressed in prod console but still buffered
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: string;           // ISO timestamp
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  route?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
}

const MAX_BUFFER = 200;
const MAX_BREADCRUMBS = 50;
const IS_PROD = import.meta.env.PROD;

const buffer: LogEntry[] = [];
const breadcrumbs: Pick<LogEntry, 'ts' | 'level' | 'message'>[] = [];

// Mutable context — updated by AuthProvider / router
let _userId: string | undefined;
let _route: string | undefined;

function serializeError(err: unknown): LogEntry['error'] | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      // Supabase errors carry a numeric `code` or a `status`
      code: (err as Error & { code?: string | number; status?: number }).code
        ?? (err as Error & { status?: number }).status,
    };
  }
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    return { name: 'UnknownError', message: String(e.message ?? e.msg ?? JSON.stringify(err)), code: e.code as string | number | undefined };
  }
  return { name: 'UnknownError', message: String(err) };
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown): LogEntry {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    message,
    context,
    userId: _userId,
    route: _route ?? window.location.pathname,
    error: serializeError(error),
  };

  // Always buffer
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  // Breadcrumb (compact)
  breadcrumbs.push({ ts: entry.ts, level, message });
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();

  // Console output
  if (IS_PROD) {
    // In production only emit warn + error to the console
    if (level === 'warn') console.warn('[WS]', message, context ?? '', entry.error ?? '');
    if (level === 'error') console.error('[WS]', message, context ?? '', entry.error ?? '');
  } else {
    const fn = level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : level === 'info' ? console.info
      : console.debug;
    fn(`[WS:${level.toUpperCase()}]`, message, ...(context ? [context] : []), ...(entry.error ? [entry.error] : []));
  }

  return entry;
}

export const logger = {
  /** Call once at app startup to attach global error handlers. */
  init() {
    window.addEventListener('error', (event) => {
      write('error', 'Uncaught JS error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, event.error ?? new Error(event.message));
    });

    window.addEventListener('unhandledrejection', (event) => {
      write('error', 'Unhandled promise rejection', {}, event.reason);
    });
  },

  /** Set current authenticated user (call from AuthProvider). */
  setUser(userId: string | undefined) {
    _userId = userId;
  },

  /** Update current route (call from a router listener or useEffect). */
  setRoute(route: string) {
    _route = route;
  },

  debug(message: string, context?: Record<string, unknown>) {
    return write('debug', message, context);
  },

  info(message: string, context?: Record<string, unknown>) {
    return write('info', message, context);
  },

  warn(message: string, context?: Record<string, unknown>, error?: unknown) {
    return write('warn', message, context, error);
  },

  error(message: string, context?: Record<string, unknown>, error?: unknown) {
    return write('error', message, context, error);
  },

  /** Add a breadcrumb without a full log entry (e.g. button clicks, route changes). */
  breadcrumb(message: string) {
    breadcrumbs.push({ ts: new Date().toISOString(), level: 'debug', message });
    if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
  },

  /** Return a snapshot of the log buffer (most recent last). */
  getLogs(): readonly LogEntry[] {
    return [...buffer];
  },

  /** Return the breadcrumb trail leading up to the current moment. */
  getBreadcrumbs(): readonly Pick<LogEntry, 'ts' | 'level' | 'message'>[] {
    return [...breadcrumbs];
  },

  /** Return a formatted string of recent logs — useful for bug reports. */
  dump(): string {
    return [...buffer]
      .map(e => `${e.ts} [${e.level.toUpperCase()}] ${e.userId ? 'user:' + e.userId.slice(0, 8) + '… ' : ''}${e.route ? 'route:' + e.route + ' ' : ''}${e.message}${e.error ? ' | ' + e.error.name + ': ' + e.error.message : ''}`)
      .join('\n');
  },
};

// Expose on window in non-production builds for quick console debugging
if (!IS_PROD) {
  (window as Window & { __wsLogger?: typeof logger }).__wsLogger = logger;
}
