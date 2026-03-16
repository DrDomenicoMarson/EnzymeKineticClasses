import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Catches rendering errors in a subtree and displays a recoverable fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', backgroundColor: '#fee2e2', border: '2px solid #ef4444', borderRadius: '8px', margin: '1rem' }}>
          <h2 style={{ color: '#dc2626' }}>Something went wrong:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#1f2937', fontSize: '14px' }}>
            {this.state.error?.message}
          </pre>
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Stack trace</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '0.5rem' }}>
              {this.state.error?.stack}
            </pre>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '0.5rem' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{ marginTop: '1rem', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
