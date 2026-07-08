import { CartProvider } from '@/lib/cart-context';
import { ClientForm } from '@/components/client-form';
import { DiscountSection } from '@/components/discount-section';
import { PerfumeSearch } from '@/components/perfume-search';
import { Cart } from '@/components/cart';
import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    DISTRIFRAGANCIAS
                  </h1>
                </div>
                <p className="text-center text-muted-foreground text-sm mt-1">
                  Catálogo de Perfumes Importados
                </p>
              </div>
              <div className="flex-1" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Client Form & Search */}
            <div className="lg:col-span-2 space-y-6">
              <ClientForm />
              <DiscountSection />
              <PerfumeSearch />
            </div>

            {/* Right Column - Cart */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <Cart />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-card border-t border-border mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DISTRIFRAGANCIAS - Todos los derechos reservados
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
