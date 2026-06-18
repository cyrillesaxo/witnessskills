import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ClipboardList } from 'lucide-react';
import { logger } from '../../lib/logger';

interface Props {
    children: ReactNode;
    /** Optional label shown in logs to identify which boundary caught the error */
  name?: string;
}

interface State {
    error: Error | null;
    logDump: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null, logDump: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
        logger.error(
                'React error boundary caught an error',
          {
                    boundary: this.props.name ?? 'root',
                    componentStack: info.componentStack ?? undefined,
          },
                error,
              );
  }

  handleCopyLogs = () => {
        const dump = logger.dump();
        navigator.clipboard.writeText(dump).catch(() => {});
        this.setState({ logDump: dump });
  };

  render() {
        const isDev = import.meta.env.DEV;

      if (this.state.error) {
              return (
                        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                                  <div className="max-w-lg w-full backdrop-blur-xl bg-slate-800/40 border border-red-500/25 rounded-2xl p-8 text-center">
                                              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
                                              <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>h1>
                                              <p className="text-sm text-slate-400 mb-1">{this.state.error.message}</p>p>
                                  
                                    {isDev && (
                                        <details className="text-left mb-4 mt-3">
                                                        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 mb-1">Stack trace</summary>summary>
                                                        <pre className="text-xs text-red-300/80 bg-slate-900/60 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                                                          {this.state.error.stack}
                                                        </pre>pre>
                                        </details>details>
                                              )}
                                  
                                              <div className="flex gap-3 justify-center mt-4 flex-wrap">
                                                            <button
                                                                              onClick={() => this.setState({ error: null, logDump: null })}
                                                                              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/60 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-700"
                                                                            >
                                                                            <RefreshCw className="w-4 h-4" /> Try again
                                                            </button>button>
                                                            <a
                                                                              href="/"
                                                                              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold"
                                                                            >
                                                                            Dashboard
                                                            </a>a>
                                                {isDev && (
                                          <button
                                                              onClick={this.handleCopyLogs}
                                                              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/60 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-700"
                                                            >
                                                            <ClipboardList className="w-4 h-4" /> Copy logs
                                          </button>button>
                                                            )}
                                              </div>div>
                                  
                                    {isDev && this.state.logDump && (
                                        <pre className="mt-4 text-left text-xs text-slate-500 bg-slate-900/60 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                                          {this.state.logDump}
                                        </pre>pre>
                                              )}
                                  </div>div>
                        </div>div>
                      );
      }
        return this.props.children;
  }
}</div>
