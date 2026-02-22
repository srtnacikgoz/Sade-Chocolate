import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

// Global hata yakalayıcı - component crash durumunda beyaz ekran yerine kullanıcı dostu mesaj gösterir
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary yakaladı:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4">
          <div className="text-center max-w-md">
            <p className="text-6xl mb-4">🍫</p>
            <h1 className="text-2xl font-semibold text-mocha-800 mb-3">
              Bir şeyler ters gitti
            </h1>
            <p className="text-mocha-500 mb-8">
              Sayfa yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-mocha-800 text-white rounded-xl text-sm font-medium hover:bg-mocha-700 transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
