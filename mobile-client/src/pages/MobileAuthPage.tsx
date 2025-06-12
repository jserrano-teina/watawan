import React, { useState } from 'react';
import { useLocation } from 'wouter';

export default function MobileAuthPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !displayName)) {
      return;
    }

    setIsLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, displayName };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setLocation('/wishlist');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error de autenticación');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h1>
        <div></div>
      </div>
      
      <div className="mobile-content">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '8px' }}>
            WataWan
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-form">
          <div className="mobile-form-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mobile-input"
              required
              autoComplete="email"
            />
          </div>

          {!isLogin && (
            <div className="mobile-form-group">
              <input
                type="text"
                placeholder="Nombre completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mobile-input"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="mobile-form-group">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mobile-input"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            className="mobile-button"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {isLoading ? 'Cargando...' : (isLogin ? 'Iniciar sesión' : 'Crear cuenta')}
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '16px',
              textAlign: 'center',
              width: '100%'
            }}
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate' 
              : '¿Ya tienes cuenta? Inicia sesión'
            }
          </button>
        </form>
      </div>
    </div>
  );
}