import { Component, type ReactNode } from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/layout";
import Dashboard from "./pages/dashboard";
import Kecamatan from "./pages/kecamatan";
import Developer from "./pages/developer";
import Listing from "./pages/listing";
import Penjualan from "./pages/penjualan";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
          <div className="bg-white rounded-xl border border-red-200 p-8 max-w-lg w-full">
            <h2 className="text-xl font-bold text-red-600 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-600 text-sm mb-4">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/kecamatan" component={Kecamatan} />
            <Route path="/developer" component={Developer} />
            <Route path="/listing" component={Listing} />
            <Route path="/penjualan" component={Penjualan} />
            <Route>
              <div className="text-center py-20 text-gray-400">
                <p className="text-4xl font-bold mb-4">404</p>
                <p>Halaman tidak ditemukan.</p>
              </div>
            </Route>
          </Switch>
        </Layout>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
