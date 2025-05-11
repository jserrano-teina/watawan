import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CustomInput } from "@/components/ui/custom-input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { validateEmail, getEmailErrorMessage } from "@/lib/validation";
import OptimizedImage from "@/components/OptimizedImage";

const loginSchema = z.object({
  email: z.string().min(1, { message: "Completa este campo" })
    .refine((email) => validateEmail(email), { 
      message: "Introduce un email válido"
    }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    // Limpiar cualquier error previo
    setAuthError(null);
    
    loginMutation.mutate(
      {
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          toast({
            title: "Inicio de sesión exitoso",
            description: "¡Bienvenido de vuelta!",
          });
          setLocation("/");
        },
        onError: (error: Error) => {
          // Mostrar el error en el formulario
          setAuthError("Correo electrónico o contraseña incorrectos");
          
          toast({
            title: "Error al iniciar sesión",
            description: error.message || "Credenciales incorrectas",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-col w-full max-w-[500px] mx-auto items-center justify-center px-4 py-12">
        <div className="w-full mb-8 text-center">
          <OptimizedImage 
            src="/images/waw_logo.svg" 
            alt="WataWan" 
            className="h-[48px] mx-auto mb-10" 
            objectFit="contain"
          />
          <h1 className="text-3xl font-bold mb-2 text-white">Inicia sesión</h1>
        </div>
        
        <Form {...form}>
          {authError && (
            <div className="bg-red-500/10 border border-red-500 text-destructive rounded-md p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
          <form
            onSubmit={form.handleSubmit(onLoginSubmit)}
            className="space-y-5 w-full"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <CustomInput
                      placeholder="tu@email.com"
                      type="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <CustomInput
                      placeholder="••••••••"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full text-black"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
            
            <div className="text-sm text-white text-center pt-4">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-white underline hover:text-white/80">
                Regístrate
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}