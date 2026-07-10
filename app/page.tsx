import { CartProvider } from '@/lib/cart-context';
import { RateProvider } from '@/lib/rate-context';
import { ClientForm } from '@/components/client-form';
import { DiscountSection } from '@/components/discount-section';
import { PerfumeSearch } from '@/components/perfume-search';
import { Cart } from '@/components/cart';
import { SavedQuotesPanel } from '@/components/saved-quotes-panel';
import { CotizacionBadge } from '@/components/cotizacion-badge';
import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <RateProvider>
    <CartProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-shrink-0">
                <CotizacionBadge />
              </div>
              <div className="flex flex-col items-center min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight truncate">
                    DISTRIFRAGANCIAS
                  </h1>
                </div>
                <p className="text-center text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">
                  Catálogo de Perfumes Importados
                </p>
              </div>
              <div className="flex-1" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Client Form & Search */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <ClientForm />
              <DiscountSection />
              <PerfumeSearch />
            </div>

            {/* Right Column - Cart */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-4 sm:space-y-6">
                <Cart />
                <SavedQuotesPanel />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-card border-t border-border mt-8 sm:mt-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DISTRIFRAGANCIAS - Todos los derechos reservados
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
    </RateProvider>
  );
}
