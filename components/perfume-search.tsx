'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Perfume } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useRate } from '@/lib/rate-context';
import { Search, Plus, ShoppingCart, Filter, X, Pencil, RefreshCw, Tag, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PerfumeSearch() {
  const [search, setSearch] = useState('');
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openPriceDialog, setOpenPriceDialog] = useState(false);
  const [priceFactor, setPriceFactor] = useState('');
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [priceSuccess, setPriceSuccess] = useState<string | null>(null);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountPerfume, setDiscountPerfume] = useState<Perfume | null>(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [addingDiscount, setAddingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [form, setForm] = useState<{
    id?: string | number;
    marca: string;
    nombre: string;
    usdt: string;
    pesos: string;
    saveToDb: boolean;
  }>({
    marca: '',
    nombre: '',
    usdt: '',
    pesos: '',
    saveToDb: true,
  });
  const { addToCart, items, updateProduct } = useCart();
  const { rate } = useRate();

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPerfumes();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedMarca]);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load brands: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setMarcas(data);
      }
    } catch (error) {
      console.error('Error loading marcas:', error);
    }
  };

  const openNewProduct = () => {
    setIsEditing(false);
    setForm({ marca: '', nombre: '', usdt: '', pesos: '', saveToDb: false });
    setErrorMessage(null);
    setOpenDialog(true);
  };

  const openEditProduct = (perfume: Perfume) => {
    setIsEditing(true);
    setForm({
      id: perfume.id,
      marca: perfume.marca,
      nombre: perfume.nombre,
      usdt: perfume.usdt,
      pesos: String(perfume.pesos),
      saveToDb: true,
    });
    setErrorMessage(null);
    setOpenDialog(true);
  };

  const formatUsdt = (value: string) => {
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(parsed)) return '';
    return parsed.toFixed(2).replace('.', ',');
  };

  const validateProductForm = () => {
    if (!form.marca.trim()) return 'Marca es obligatoria.';
    if (!form.nombre.trim()) return 'Nombre es obligatorio.';
    const parsedUsdt = parseFloat(form.usdt.replace(',', '.'));
    if (Number.isNaN(parsedUsdt) || parsedUsdt < 0) return 'USDT inválido.';
    const pesosValue = parseInt(form.pesos, 10);
    if (Number.isNaN(pesosValue) || pesosValue < 0) return 'Pesos inválidos.';
    return null;
  };

  const handleSaveProduct = async () => {
    const validationError = validateProductForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const payload = {
      marca: form.marca.trim(),
      nombre: form.nombre.trim(),
      usdt: formatUsdt(form.usdt),
      pesos: parseInt(form.pesos, 10),
    };

    setSaving(true);
    setErrorMessage(null);

    try {
      if (isEditing) {
        const response = await fetch('/api/perfumes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: form.id, ...payload }),
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body?.error || 'Error al actualizar el producto.');
        }

        updateProduct({ id: form.id!, ...payload });
        await loadPerfumes();
      } else if (form.saveToDb) {
        const response = await fetch('/api/perfumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body?.error || 'Error al guardar el producto.');
        }

        const saved = await response.json();
        addToCart({ id: saved.id, ...payload });
        await loadPerfumes();
        await fetchBrands();
      } else {
        const tempId = `${payload.marca}::${payload.nombre}`;
        addToCart({ id: tempId, ...payload });
      }

      setOpenDialog(false);
    } catch (error: any) {
      setErrorMessage(error?.message || 'No se pudo procesar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openPriceUpdate = () => {
    setPriceFactor(String(rate));
    setPriceError(null);
    setPriceSuccess(null);
    setOpenPriceDialog(true);
  };

  const openDiscountDialog = (perfume: Perfume) => {
    setDiscountPerfume(perfume);
    setDiscountAmount('');
    setDiscountError(null);
    setDiscountDialogOpen(true);
  };

  const handleAddManualDiscount = async () => {
    if (!discountPerfume) return;

    const amount = parseFloat(discountAmount.replace(',', '.'));
    if (Number.isNaN(amount) || amount <= 0) {
      setDiscountError('Ingresa un monto de descuento válido mayor a 0.');
      return;
    }

    const originalUsdt = parseFloat(discountPerfume.usdt.replace(',', '.'));
    if (amount >= originalUsdt) {
      setDiscountError('El descuento no puede ser mayor o igual al precio.');
      return;
    }

    const discountPesos = amount * rate;
    const finalUsdt = Math.max(originalUsdt - amount, 0);
    const finalPesos = Math.max(discountPerfume.pesos - discountPesos, 0);

    setAddingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetch('/api/discounted-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual: true,
          product: {
            id: discountPerfume.id,
            marca: discountPerfume.marca,
            nombre: discountPerfume.nombre,
            usdt: discountPerfume.usdt,
            pesos: discountPerfume.pesos,
            discountUsdt: amount,
            discountPesos,
            finalUsdt: finalUsdt.toFixed(2).replace('.', ','),
            finalPesos,
            quantity: 1,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'No se pudo agregar el descuento.');
      }

      setDiscountDialogOpen(false);
    } catch (error: any) {
      setDiscountError(error?.message || 'No se pudo agregar el descuento.');
    } finally {
      setAddingDiscount(false);
    }
  };

  const handleUpdatePrices = async () => {
    const factor = parseFloat(priceFactor.replace(',', '.'));
    if (Number.isNaN(factor) || factor <= 0) {
      setPriceError('Ingresa un monto válido mayor a 0.');
      return;
    }

    setUpdatingPrices(true);
    setPriceError(null);
    setPriceSuccess(null);

    try {
      const response = await fetch('/api/perfumes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || 'Error al actualizar los precios.');
      }

      const result = await response.json();
      setPriceSuccess(`Se actualizaron ${result.updated} precios (USDT x ${factor}).`);
      await loadPerfumes();
    } catch (error: any) {
      setPriceError(error?.message || 'No se pudieron actualizar los precios.');
    } finally {
      setUpdatingPrices(false);
    }
  };

  const loadPerfumes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedMarca) params.set('marca', selectedMarca);
      params.set('limit', '200');

      const response = await fetch(`/api/perfumes?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to load perfumes: ${response.status}`);
      }
      const data = await response.json();
      // Generate unique IDs if not present
      const perfumesWithIds = (Array.isArray(data) ? data : []).map((p: any, index: number) => ({
        ...p,
        id: p.id ?? `${p.marca}-${p.nombre}`.toLowerCase().replace(/\s+/g, '-')
      }));
      setPerfumes(perfumesWithIds);
    } catch (error) {
      console.error('Error loading perfumes:', error);
      setPerfumes([]);
    }
  };

  const getItemQuantity = (id: string | number) => {
    const item = items.find(i => i.id === id);
    return item?.quantity || 0;
  };

  const handleAddToCart = (perfume: Perfume) => {
    addToCart(perfume);
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      // Fetch ALL perfumes (no filters, high limit)
      const response = await fetch('/api/perfumes?limit=10000', { cache: 'no-store' });
      if (!response.ok) throw new Error('Error al cargar los productos');
      const data = await response.json();
      const allPerfumes: Perfume[] = Array.isArray(data) ? data : [];

      if (allPerfumes.length === 0) {
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Header
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text('Catálogo de Perfumes', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text(`Fecha: ${dateStr}  |  Total: ${allPerfumes.length} productos`, 14, 22);

      // Table
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
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [30, 30, 30],
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [50, 50, 50],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer on each page
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
          );
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
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Buscador de Perfumes
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="gap-1.5 text-xs sm:text-sm"
          >
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
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={openNewProduct}
              className="gap-1.5 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar producto manual
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={openPriceUpdate}
              className="gap-1.5 text-xs sm:text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Actualizar precios</span>
              <span className="xs:hidden">Precios</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5 text-xs sm:text-sm"
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
          {perfumes.length} perfume{perfumes.length !== 1 ? 's' : ''} encontrado{perfumes.length !== 1 ? 's' : ''}
        </p>
      </div>
      
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
                <div
                  key={perfume.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">{perfume.nombre}</h3>
                      {quantity > 0 && (
                        <Badge variant="secondary">{quantity} en carrito</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{perfume.marca}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm">
                      <span>USDT {perfume.usdt}</span>
                      <span>${perfume.pesos.toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditProduct(perfume)}
                      aria-label="Editar producto"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDiscountDialog(perfume)}
                      aria-label="Agregar descuento manual"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      title="Agregar descuento manual"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => handleAddToCart(perfume)}
                      aria-label="Agregar al carrito"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar producto' : 'Agregar perfume nuevo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  value={form.marca}
                  onChange={(e) => handleFormChange('marca', e.target.value)}
                  placeholder="Ej: Chanel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => handleFormChange('nombre', e.target.value)}
                  placeholder="Ej: Bleu de Chanel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usdt">USDT</Label>
                <Input
                  id="usdt"
                  value={form.usdt}
                  onChange={(e) => handleFormChange('usdt', e.target.value)}
                  placeholder="Ej: 65,50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pesos">Pesos</Label>
                <Input
                  id="pesos"
                  type="number"
                  step="1"
                  min="0"
                  value={form.pesos}
                  onChange={(e) => handleFormChange('pesos', e.target.value)}
                  placeholder="Ej: 130000"
                />
              </div>
            </div>

            {!isEditing && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="saveToDb"
                  checked={form.saveToDb}
                  onCheckedChange={(checked) => handleFormChange('saveToDb', Boolean(checked))}
                />
                <Label htmlFor="saveToDb" className="text-sm">
                  Guardar tambien en la base de datos
                </Label>
              </div>
            )}

            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={saving} className="gap-2">
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar al carrito'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openPriceDialog} onOpenChange={setOpenPriceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar precios en pesos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Ingresa el valor del dólar/USDT. El precio en pesos de cada producto se
              calculará multiplicando su columna USDT por este monto.
            </p>
            <div className="space-y-2">
              <Label htmlFor="priceFactor">Monto por USDT</Label>
              <Input
                id="priceFactor"
                inputMode="decimal"
                value={priceFactor}
                onChange={(e) => setPriceFactor(e.target.value)}
                placeholder="Ej: 1550"
              />
            </div>

            {(() => {
              const factor = parseFloat(priceFactor.replace(',', '.'));
              if (Number.isNaN(factor) || factor <= 0) return null;
              const example = Math.round(26.5 * factor);
              return (
                <p className="text-sm text-muted-foreground">
                  Ejemplo: USDT 26,50 x {factor} = ${example.toLocaleString('es-AR')}
                </p>
              );
            })()}

            {priceError && <p className="text-sm text-destructive">{priceError}</p>}
            {priceSuccess && <p className="text-sm text-primary">{priceSuccess}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPriceDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={handleUpdatePrices} disabled={updatingPrices} className="gap-2">
              {updatingPrices ? 'Actualizando...' : 'Actualizar precios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-amber-600" />
              Agregar descuento manual
            </DialogTitle>
          </DialogHeader>
          {discountPerfume && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="font-medium text-foreground">{discountPerfume.nombre}</p>
                <p className="text-sm text-muted-foreground">{discountPerfume.marca}</p>
                <p className="text-sm font-semibold text-primary mt-1">
                  Precio: USDT {discountPerfume.usdt} / ${discountPerfume.pesos.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountAmount">Monto del descuento (USDT)</Label>
                <Input
                  id="discountAmount"
                  inputMode="decimal"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="Ej: 3,50"
                />
              </div>
              {discountAmount && !Number.isNaN(parseFloat(discountAmount.replace(',', '.'))) && (
                <p className="text-sm text-muted-foreground">
                  Precio final: USDT{' '}
                  {Math.max(
                    parseFloat(discountPerfume.usdt.replace(',', '.')) - parseFloat(discountAmount.replace(',', '.')),
                    0
                  ).toFixed(2).replace('.', ',')}
                </p>
              )}
              {discountError && <p className="text-sm text-destructive">{discountError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddManualDiscount} disabled={addingDiscount} className="gap-2">
              {addingDiscount ? 'Agregando...' : 'Agregar descuento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
