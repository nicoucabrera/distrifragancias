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
import { Search, Plus, ShoppingCart, Filter, X, Pencil } from 'lucide-react';

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
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={openNewProduct}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar producto manual
            </Button>
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
    </div>
  );
}
