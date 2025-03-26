import { useState, useEffect } from 'react';
import { useLocation, useRoute, Redirect } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Gift, Lock, User, Mail, Loader2 } from 'lucide-react';

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email("Introduce un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const registerSchema = z.object({
  email: z.string().email("Introduce un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  displayName: z.string().min(2, "El nombre mostrado debe tener al menos 2 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isMatch, params] = useRoute('/auth');
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Direccionar al inicio si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Formulario de inicio de sesión
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Formulario de registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onError: (error: Error) => {
        toast({
          title: "Error de inicio de sesión",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onError: (error: Error) => {
        toast({
          title: "Error de registro",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  // Si el usuario ya está autenticado, redirigir a la página principal
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col md:flex-row">
      {/* Columna izquierda (formulario) */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#1E1E1E] border-[#333] text-white shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </CardTitle>
            <CardDescription className="text-gray-400 text-center">
              {activeTab === "login" 
                ? "Accede a tu cuenta para gestionar tus listas de deseos" 
                : "Regístrate para crear y compartir tus listas de deseos"}
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4 bg-[#252525]">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary">Registrarse</TabsTrigger>
            </TabsList>

            {/* Formulario de login */}
            <TabsContent value="login" className="mt-0">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10 bg-[#252525] border-[#333]"
                        {...loginForm.register("email")}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-[#252525] border-[#333]"
                        {...loginForm.register("password")}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Formulario de registro */}
            <TabsContent value="register" className="mt-0">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        placeholder="Tu nombre completo"
                        className="pl-10 bg-[#252525] border-[#333]"
                        {...registerForm.register("displayName")}
                      />
                    </div>
                    {registerForm.formState.errors.displayName && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.displayName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10 bg-[#252525] border-[#333]"
                        {...registerForm.register("email")}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-[#252525] border-[#333]"
                        {...registerForm.register("password")}
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear cuenta"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      
      {/* Columna derecha (imagen y descripción) - solo visible en pantallas medianas o más grandes */}
      <div className="flex-1 bg-gradient-to-br from-primary/20 to-[#121212] hidden md:flex flex-col justify-center items-center text-white p-10">
        <div className="max-w-lg">
          <div className="flex items-center mb-6">
            <Gift size={32} className="mr-3 text-primary" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-white">
              MiWishlist
            </h1>
          </div>
          
          <h2 className="text-3xl font-bold mb-6">Gestiona tus regalos deseados en un solo lugar</h2>
          
          <div className="space-y-6 text-gray-400">
            <p className="text-lg">
              Crea listas de deseos personalizadas para tus ocasiones especiales y compártelas con amigos y familiares.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mt-1 mr-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Crea tus listas de deseos</h3>
                  <p>Añade productos de cualquier tienda online con un simple enlace.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mt-1 mr-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Comparte con tus seres queridos</h3>
                  <p>Envía un enlace y todos podrán ver tus deseos.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mt-1 mr-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Evita regalos duplicados</h3>
                  <p>Las personas pueden marcar los regalos que planean comprar, permaneciendo en secreto para ti.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}