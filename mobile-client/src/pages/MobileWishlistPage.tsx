
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useNativeSharing } from '../hooks/useNativeSharing';

interface WishItem {
  id: number;
  title: string;
  imageUrl: string;
  url: string;
  price?: string;
  reserved: boolean;
  received: boolean;
}

interface Wishlist {
  id: number;
  name: string;
  shareableLink: string;
  items: WishItem[];
}

export default function MobileWishlistPage() {
  const [, setLocation] = useLocation();
  const { shareContent } = useNativeSharing();

  const { data: wishlists, isLoading, error } = useQuery<Wishlist[]>({
    queryKey: ['/api/wishlist'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/wishlist', {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          setLocation('/auth');
          return [];
        }
        throw new Error('Error al cargar listas');
      }
      return response.json();
    },
  });

  const handleShare = async (wishlist: Wishlist) => {
    try {
      await shareContent({
        title: `Lista de deseos: ${wishlist.name}`,
        text: `Mira mi lista de deseos en WataWan`,
        url: `https://watawan.com/user/${wishlist.shareableLink}`,
      });
    } catch (error) {
      // Fallback para web sin Capacitor
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Lista de deseos: ${wishlist.name}`,
            text: `Mira mi lista de deseos en WataWan`,
            url: `https://watawan.com/user/${wishlist.shareableLink}`,
          });
        } catch (shareError) {
          console.log('Share cancelled');
        }
      } else {
        navigator.clipboard?.writeText(`https://watawan.com/user/${wishlist.shareableLink}`);
        alert('Enlace copiado al portapapeles');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="mobile-page">
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
          <p>Cargando listas...</p>
        </div>
      </div>
    );
  }

  if (error || !wishlists) {
    return (
      <div className="mobile-page">
        <div className="mobile-header">
          <button 
            onClick={() => setLocation('/')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary)', 
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ← Volver
          </button>
          <h1>Error</h1>
          <div></div>
        </div>
        <div className="mobile-content">
          <div className="mobile-error">
            Error al cargar las listas de deseos
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page">
      <div className="mobile-header">
        <button 
          onClick={() => setLocation('/')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--primary)', 
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>
        <h1>Mis Listas</h1>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--primary)', 
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          +
        </button>
      </div>
      
      <div className="mobile-content">
        {wishlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <p>No tienes listas de deseos aún</p>
            <button className="mobile-button" style={{ marginTop: '16px' }}>
              Crear primera lista
            </button>
          </div>
        ) : (
          wishlists.map((wishlist) => (
            <div key={wishlist.id} className="mobile-card">
              <div className="mobile-card-header">
                <h2 className="mobile-card-title">{wishlist.name}</h2>
                <button 
                  onClick={() => handleShare(wishlist)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--primary)', 
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  ↗
                </button>
              </div>

              {wishlist.items.length === 0 ? (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}>
                  Lista vacía - Añade tu primer producto
                </div>
              ) : (
                <div className="mobile-wishlist-items">
                  {wishlist.items.map((item) => (
                    <div key={item.id} className="mobile-wishlist-item">
                      <div style={{ position: 'relative' }}>
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="mobile-item-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZmlsbD0iIzY2NiIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2VuPC90ZXh0Pgo8L3N2Zz4=';
                          }}
                        />
                        {item.reserved && (
                          <div className="mobile-badge mobile-badge-reserved">
                            Reservado
                          </div>
                        )}
                        {item.received && (
                          <div 
                            className="mobile-badge mobile-badge-received"
                            style={{ top: '24px', background: 'var(--success)' }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="mobile-item-title">{item.title}</div>
                      {item.price && (
                        <div className="mobile-item-price">{item.price}</div>
                      )}
                    </div>
                  ))}
                  
                  <div 
                    className="mobile-wishlist-item"
                    onClick={() => setLocation('/add-item')}
                    style={{ 
                      border: '2px dashed var(--primary)', 
                      background: 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '140px'
                    }}
                  >
                    <div style={{ 
                      fontSize: '32px', 
                      color: 'var(--primary)', 
                      marginBottom: '8px' 
                    }}>
                      +
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--primary)', 
                      textAlign: 'center' 
                    }}>
                      Añadir producto
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="mobile-nav">
        <div className="mobile-nav-item">
          <div className="mobile-nav-icon"></div>
          <span>Inicio</span>
        </div>
        <div className="mobile-nav-item active">
          <div className="mobile-nav-icon"></div>
          <span>Listas</span>
        </div>
        <div className="mobile-nav-item">
          <div className="mobile-nav-icon"></div>
          <span>Perfil</span>
        </div>
      </div>
    </div>
  );
}