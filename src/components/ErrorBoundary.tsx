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
        <div className="apple-ui min-h-screen w-full flex items-center justify-center bg-[var(--apple-bg-secondary)] p-6 text-[var(--apple-label)]">
          <div className="apple-sheet apple-squircle max-w-md w-full rounded-[28px] p-6 sm:p-7 space-y-4">
            <h1 className="text-[19px] font-semibold tracking-tight text-[var(--apple-red-fg)]">
              {uiText(getUiLanguage(), 'error.title')}
            </h1>
            <p className="text-[14px] text-[var(--apple-secondary-label)] leading-relaxed break-words">
              {uiText(getUiLanguage(), 'error.generic')}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="apple-pressable w-full sm:w-auto px-5 min-h-[44px] rounded-[14px] bg-[var(--apple-blue)] hover:opacity-95 text-white text-[14px] font-semibold cursor-pointer"
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
