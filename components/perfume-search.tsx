'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ShoppingCart, Filter, X, Pencil, RefreshCw, Tag, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Perfume } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useRate } from '@/lib/rate-context';
import { normalizeUsdt } from '@/lib/price-utils';
import { ProductFormDialog } from '@/components/product-form-dialog';
import { PriceUpdateDialog } from '@/components/price-update-dialog';
import { ManualDiscountDialog } from '@/components/manual-discount-dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PerfumeSearch() {
  const [search, setSearch] = useState('');
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<Perfume | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountPerfume, setDiscountPerfume] = useState<Perfume | null>(null);

  const { addToCart, items } = useCart();
  const { rate } = useRate();

  const loadPerfumes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedMarca) params.set('marca', selectedMarca);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));

      const response = await fetch(`/api/perfumes?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load perfumes: ${response.status}`);
      const data = await response.json();

      const seen = new Set<string | number>();
      const perfumesWithIds = (Array.isArray(data) ? data : []).reduce<Perfume[]>((acc, p: any) => {
        const id = p.id ?? `${p.marca}-${p.nombre}`.toLowerCase().replace(/\s+/g, '-');
        if (seen.has(id)) return acc;
        seen.add(id);
        acc.push({ ...p, id });
        return acc;
      }, []);
      setPerfumes(perfumesWithIds);
    } catch (error) {
      console.error('Error loading perfumes:', error);
      setPerfumes([]);
    }
  }, [search, selectedMarca, page]);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch('/api/brands', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load brands: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) setMarcas(data);
    } catch (error) {
      console.error('Error loading marcas:', error);
    }
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, selectedMarca]);

  useEffect(() => {
    const timer = setTimeout(loadPerfumes, 250);
    return () => clearTimeout(timer);
  }, [loadPerfumes]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const getItemQuantity = (id: string | number) => {
    return items.find((i) => i.id === id)?.quantity || 0;
  };

  const openNewProduct = () => {
    setEditingPerfume(null);
    setProductDialogOpen(true);
  };

  const openEditProduct = (perfume: Perfume) => {
    setEditingPerfume(perfume);
    setProductDialogOpen(true);
  };

  const openDiscount = (perfume: Perfume) => {
    setDiscountPerfume(perfume);
    setDiscountDialogOpen(true);
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const response = await fetch('/api/perfumes?limit=10000', { cache: 'no-store' });
      if (!response.ok) throw new Error('Error al cargar los productos');
      const data = await response.json();
      const allPerfumes: Perfume[] = Array.isArray(data) ? data : [];
      if (allPerfumes.length === 0) return;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text('Catálogo de Perfumes', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text(`Fecha: ${dateStr}  |  Total: ${allPerfumes.length} productos`, 14, 22);

      const tableData = allPerfumes.map((p) => [
        p.marca,
        p.nombre,
        `USDT ${p.usdt}`,
        `$${p.pesos.toLocaleString('es-AR')}`,
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['Marca', 'Nombre', 'USDT', 'Pesos']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 3, textColor: [30, 30, 30], lineColor: [200, 200, 200], lineWidth: 0.1 },
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 35, halign: 'right' } },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Página ${data.pageNumber} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
        },
      });

      doc.save(`catalogo-perfumes-${dateStr.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Buscador de Perfumes
          </h2>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={generatingPdf} className="gap-1.5 text-xs sm:text-sm">
            <Download className="w-4 h-4" />
            {generatingPdf ? 'Generando...' : 'Descargar PDF'}
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background pl-10 pr-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button variant="secondary" size="sm" onClick={openNewProduct} className="gap-1.5 text-xs sm:text-sm">
              <Plus className="w-4 h-4" />
              Agregar producto manual
            </Button>
            <Button variant="default" size="sm" onClick={() => setPriceDialogOpen(true)} className="gap-1.5 text-xs sm:text-sm">
              <RefreshCw className="w-3.5 h-3.5" />
              Precios
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 text-xs sm:text-sm">
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
              {marcas.map((marca) => (
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
          {perfumes.length} perfume{perfumes.length !== 1 ? 's' : ''} encontrado{perfumes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Perfume list */}
      <div className="max-h-[500px] overflow-y-auto">
        {perfumes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron perfumes</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {perfumes.map((perfume) => {
              const quantity = getItemQuantity(perfume.id);
              return (
                <div key={perfume.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">{perfume.nombre}</h3>
                      {quantity > 0 && <Badge variant="secondary">{quantity} en carrito</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{perfume.marca}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm">
                      <span>USDT {perfume.usdt}</span>
                      <span>${perfume.pesos.toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEditProduct(perfume)} aria-label="Editar producto">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDiscount(perfume)} aria-label="Agregar descuento manual" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Agregar descuento manual">
                      <Tag className="h-4 w-4" />
                    </Button>
                    <Button size="icon" onClick={() => addToCart(perfume)} aria-label="Agregar al carrito">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {perfumes.length === PAGE_SIZE && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={perfumes.length < PAGE_SIZE}
            className="gap-1"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        isEditing={!!editingPerfume}
        perfume={editingPerfume}
        onSaved={() => {
          loadPerfumes();
          fetchBrands();
        }}
      />

      <PriceUpdateDialog
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
        currentRate={rate}
        onUpdated={loadPerfumes}
      />

      <ManualDiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        perfume={discountPerfume}
        exchangeRate={rate}
        onSaved={() => {}}
      />
    </div>
  );
}
