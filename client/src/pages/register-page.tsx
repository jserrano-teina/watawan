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

const registerSchema = z.object({
  email: z.string().min(1, { message: "Completa este campo" })
    .refine((email) => validateEmail(email), { 
      message: "Introduce un email válido"
    }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  displayName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Función para obtener las iniciales del nombre
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export default function RegisterPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, registerMutation } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
  });

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Limpiar cualquier error previo
    setAuthError(null);
    
    registerMutation.mutate(
      {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        initials: getInitials(data.displayName),
      },
      {
        onSuccess: () => {
          toast({
            title: "Registro exitoso",
            description: "¡Bienvenido a WataWan!",
          });
          setLocation("/");
        },
        onError: (error: Error) => {
          // Mostrar el error en el formulario
          if (error.message.includes("already exists")) {
            setAuthError("Este correo electrónico ya está registrado");
          } else {
            setAuthError("No se pudo crear la cuenta. Inténtalo de nuevo más tarde.");
          }
          
          toast({
            title: "Error al registrarse",
            description: error.message || "No se pudo completar el registro",
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
    <div className="flex min-h-screen bg-background fixed-height-container">
      <div className="flex flex-col w-full max-w-[500px] mx-auto items-center justify-center px-4">
        <div className="w-full mb-8 text-center">
          <OptimizedImage 
            src="/images/waw_logo.svg" 
            alt="WataWan" 
            className="h-[48px] mx-auto mb-10" 
            objectFit="contain"
          />
          <h1 className="text-3xl font-bold mb-2 text-white">Crea tu cuenta</h1>
        </div>
        
        <Form {...form}>
          {authError && (
            <div className="bg-red-500/10 border border-red-500 text-destructive rounded-md p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
          <form
            onSubmit={form.handleSubmit(onRegisterSubmit)}
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
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <CustomInput
                      placeholder="Tu nombre"
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
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creando cuenta..." : "Crear mi cuenta"}
            </Button>
            
            <div className="text-sm text-white text-center pt-4">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-white underline hover:text-white/80">
                Inicia sesión
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}