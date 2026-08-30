import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm" role="alert">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">The page could not be displayed</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Try reloading the page. If the problem continues, return to the dashboard and try again.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Reload page</button>
          <a href="/dashboard" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Go to dashboard</a>
        </div>
      </div>
    </div>;
  }
}
