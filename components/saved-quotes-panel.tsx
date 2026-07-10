'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cart-context';
import {
  Bookmark,
  BookmarkCheck,
  Trash2,
  ShoppingBag,
  Loader2,
} from 'lucide-react';

export function SavedQuotesPanel() {
  const {
    savedQuotes,
    loadSavedQuotes,
    saveCurrentQuote,
    loadQuote,
    deleteQuote,
    items,
  } = useCart();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedQuotes().finally(() => setLoading(false));
  }, [loadSavedQuotes]);

  const handleSave = async () => {
    setSaving(true);
    await saveCurrentQuote();
    setSaving(false);
  };

  const handleLoad = (quote: typeof savedQuotes[0]) => {
    loadQuote(quote);
  };

  const handleDelete = async (id: number) => {
    await deleteQuote(id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            Presupuestos Guardados
            {savedQuotes.length > 0 && (
              <Badge className="ml-2">{savedQuotes.length}</Badge>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={items.length === 0 || saving}
            className="gap-1"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BookmarkCheck className="w-4 h-4" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
          <p className="text-sm">Cargando...</p>
        </div>
      ) : savedQuotes.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay presupuestos guardados</p>
          <p className="text-sm mt-1">
            Arma un presupuesto y tocá &quot;Guardar&quot;
          </p>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
          {savedQuotes.map((quote) => (
            <div key={quote.id} className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {quote.clientName}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(quote.createdAt)}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs">
                      <ShoppingBag className="w-3 h-3 mr-1" />
                      {quote.items.length} producto{quote.items.length !== 1 ? 's' : ''}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {quote.items.reduce((acc, i) => acc + i.quantity, 0)} uds
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoad(quote)}
                    className="text-primary hover:text-primary h-8 px-2"
                  >
                    Cargar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(quote.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
