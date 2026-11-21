import React from 'react';
import { getUiLanguage, uiText } from '../utils/uiLanguage';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Ralat aplikasi berlaku.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FBF9F5] p-6 text-stone-900">
          <div className="max-w-lg w-full rounded-2xl border border-red-200 bg-white p-6 shadow-sm space-y-3">
            <h1 className="font-display text-xl font-bold text-red-800">
              {uiText(getUiLanguage(), 'error.title')}
            </h1>
            <p className="text-sm text-stone-700 break-words">
              {uiText(getUiLanguage(), 'error.generic')}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-semibold cursor-pointer"
            >
              {uiText(getUiLanguage(), 'error.retry')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
