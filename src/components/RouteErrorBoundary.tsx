import { Component, type ErrorInfo, type ReactNode } from 'react';

type RouteErrorBoundaryProps = {
  children: ReactNode;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Keeps a failed lazy route import or render from leaving the application blank.
 * App keys this boundary by pathname so navigating elsewhere resets the boundary.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sophis Central route rendering failed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#F6F8FC] px-5 py-12">
          <section
            role="alert"
            aria-live="assertive"
            className="w-full max-w-lg rounded-3xl border border-[#E1E7F0] bg-white p-7 text-center shadow-sm sm:p-10"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EBFF] text-xl font-bold text-[#6121D0]">
              !
            </div>
            <h1 className="mt-5 text-2xl font-bold text-[#091F5B]">This page couldn’t load</h1>
            <p className="mt-3 text-sm leading-7 text-[#5C6982]">
              Something interrupted this page. You can try loading it again or return to Sophis Central.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="brand-button px-5 py-3 text-sm font-semibold"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-[#DCE4EF] px-5 py-3 text-sm font-semibold text-[#334155] transition hover:border-[#B9C8F5] hover:bg-[#F3F6FC]"
              >
                Back to Sophis Central
              </a>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
