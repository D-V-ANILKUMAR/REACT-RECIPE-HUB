import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#222', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Something went wrong (React Crash)</h2>
          <p>{this.state.error?.toString()}</p>
          <pre style={{ overflowX: 'auto', background: '#111', padding: '10px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', fontSize: '16px', marginTop: '20px' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
