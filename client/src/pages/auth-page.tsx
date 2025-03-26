import { useEffect } from 'react';
import { useLocation, Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Redireccionar a la página de login
  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  // Si el usuario ya está autenticado, redirigir a la página principal
  if (user) {
    return <Redirect to="/" />;
  }
  
  // Si no, redireccionar a /login (este retorno en realidad nunca se ejecuta debido al useEffect)
  return null;
}