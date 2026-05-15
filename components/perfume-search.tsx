'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { perfumes, marcas, Perfume } from '@/lib/perfumes-data';
import { useCart } from '@/lib/cart-context';
import { Search, Plus, ShoppingCart, Filter, X } from 'lucide-react';

export function PerfumeSearch() {
  const [search, setSearch] = useState('');
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart, items } = useCart();

  const filteredPerfumes = useMemo(() => {
    return perfumes.filter(perfume => {
      const matchesSearch =
        perfume.nombre.toLowerCase().includes(search.toLowerCase()) ||
        perfume.marca.toLowerCase().includes(search.toLowerCase());
      const matchesMarca = !selectedMarca || perfume.marca === selectedMarca;
      return matchesSearch && matchesMarca;
    });
  }, [search, selectedMarca]);

  const getItemQuantity = (id: number) => {
    const item = items.find(i => i.id === id);
    return item?.quantity || 0;
  };

  const handleAddToCart = (perfume: Perfume) => {
    addToCart(perfume);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Buscador de Perfumes
        </h2>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background pl-10 pr-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtrar por marca
            </Button>
            {selectedMarca && (
              <Badge variant="secondary" className="gap-1">
                {selectedMarca}
                <button onClick={() => setSelectedMarca(null)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
          
          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4 bg-secondary/50 rounded-lg">
              {marcas.map(marca => (
                <Badge
                  key={marca}
                  variant={selectedMarca === marca ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedMarca(selectedMarca === marca ? null : marca)}
                >
                  {marca}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          {filteredPerfumes.length} perfume{filteredPerfumes.length !== 1 ? 's' : ''} encontrado{filteredPerfumes.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="max-h-[500px] overflow-y-auto">
        {filteredPerfumes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron perfumes</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPerfumes.map(perfume => {
              const quantity = getItemQuantity(perfume.id);
              return (
                <div
                  key={perfume.id}
                  className="p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {perfume.marca}
                      </Badge>
                      <h3 className="font-medium text-foreground text-sm leading-tight">
                        {perfume.nombre}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-primary font-semibold">
                          ${perfume.pesos ? perfume.pesos.toLocaleString('es-AR') : 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {perfume.usdt} USDT
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {quantity > 0 && (
                        <Badge className="bg-primary/20 text-primary border-0">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          {quantity}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(perfume)}
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
