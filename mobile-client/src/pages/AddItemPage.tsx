import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNativeSharing } from '../hooks/useNativeSharing';

export default function AddItemPage() {
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState('');
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { sharedData } = useNativeSharing();

  useEffect(() => {
    // Usar datos compartidos nativamente desde Capacitor
    if (sharedData?.url) {
      setUrl(sharedData.url);
    }
    
    // Fallback para web: detectar contenido compartido desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const webSharedData = urlParams.get('shared');
    
    if (webSharedData && !sharedData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(webSharedData));
        if (parsed.url) {
          setUrl(parsed.url);
        }
      } catch (error) {
        console.log('Error parsing shared data:', error);
      }
    }
  }, [sharedData]);

  const addItemMutation = useMutation({
    mutationFn: async (data: { url: string; wishlistId: number }) => {
      const response = await fetch(`http://localhost:5000/api/wishlist/${data.wishlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: data.url }),
      });
      
      if (!response.ok) {
        throw new Error('Error al añadir el producto');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      setLocation('/wishlist');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url || !wishlistId) {
      alert('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    
    try {
      await addItemMutation.mutateAsync({ url, wishlistId });
    } catch (error) {
      alert('Error al añadir el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-page">
      <div className="mobile-header">
        <button 
          onClick={() => setLocation('/wishlist')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--primary)', 
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ← Cancelar
        </button>
        <h1>Añadir Producto</h1>
        <div></div>
      </div>
      
      <div className="mobile-content">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
            Nuevo Deseo
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Pega el enlace del producto que deseas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-form">
          <div className="mobile-form-group">
            <label className="mobile-form-label">Enlace del producto</label>
            <input
              type="url"
              placeholder="https://ejemplo.com/producto"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mobile-input"
              required
            />
          </div>

          <div className="mobile-form-group">
            <label className="mobile-form-label">Lista de deseos</label>
            <select
              value={wishlistId || ''}
              onChange={(e) => setWishlistId(Number(e.target.value))}
              className="mobile-input"
              required
              style={{ appearance: 'none' }}
            >
              <option value="">Selecciona una lista</option>
              <option value="29">Mi lista de deseos</option>
            </select>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setLocation('/wishlist')}
              className="mobile-button-secondary mobile-button"
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="mobile-button"
              disabled={isLoading || addItemMutation.isPending}
              style={{ flex: 1 }}
            >
              {isLoading || addItemMutation.isPending ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </form>

        {url && (
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: 'var(--surface-variant)', 
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Vista previa del enlace:
            </h3>
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text)', 
              wordBreak: 'break-all',
              lineHeight: '1.4'
            }}>
              {url}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}