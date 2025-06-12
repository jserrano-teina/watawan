
import { Link } from 'wouter';

export default function MobileHomePage() {
  return (
    <div className="mobile-page">
      <div className="mobile-header">
        <h1>WataWan</h1>
      </div>
      
      <div className="mobile-content">
        <div className="mobile-card">
          <div className="mobile-card-header">
            <h2 className="mobile-card-title">App Móvil Nativa</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Versión optimizada para móvil con experiencia nativa
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              ✓ Rendimiento superior a PWA<br/>
              ✓ Interfaz optimizada para táctil<br/>
              ✓ Gestos nativos<br/>
              ✓ Preparado para app stores
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          <Link href="/auth">
            <button className="mobile-button" style={{ width: '100%' }}>
              Probar Autenticación
            </button>
          </Link>
          
          <Link href="/wishlist">
            <button className="mobile-button-secondary mobile-button" style={{ width: '100%' }}>
              Ver Demo Lista
            </button>
          </Link>
        </div>
      </div>
      
      <div className="mobile-nav">
        <div className="mobile-nav-item active">
          <div className="mobile-nav-icon"></div>
          <span>Inicio</span>
        </div>
        <div className="mobile-nav-item">
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