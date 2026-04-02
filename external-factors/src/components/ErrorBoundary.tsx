import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-bold text-rose-400 mb-2">Something went wrong</h2>
          <pre className="text-sm text-slate-400 whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 transition-colors"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
