import React from 'react';

/**
 * Catches render-time errors so one broken component cannot blank the whole
 * page.
 *
 * There was no error boundary anywhere in this codebase, so any exception
 * during render unmounted the entire tree and left a white screen with the
 * detail only in the console. The Rules-of-Hooks crash fixed in #6 failed
 * exactly this way.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Render error caught by ErrorBoundary:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          margin: '2rem auto',
          maxWidth: '640px',
          padding: '1.5rem',
          border: '1px solid #b45309',
          borderRadius: '8px',
          background: '#1f1a12',
          color: '#fde68a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
          {this.props.label || 'This view'} hit an error
        </h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', opacity: 0.9 }}>
          The rest of the app is still running. Details are in the browser console.
        </p>
        <pre
          style={{
            margin: '0 0 1rem',
            padding: '0.75rem',
            overflowX: 'auto',
            background: '#0d0b08',
            borderRadius: '4px',
            fontSize: '0.8rem',
          }}
        >
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <button
          type="button"
          onClick={this.handleReset}
          style={{
            padding: '0.5rem 1rem',
            border: 0,
            borderRadius: '4px',
            background: '#b45309',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
