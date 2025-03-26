import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
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
      <div className="flex flex-col w-full max-w-md mx-auto items-center justify-center px-4 py-12">
        <div className="w-full mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Inicia sesión</h1>
          <p className="text-muted-foreground">
            Ingresa tus credenciales para acceder a tu cuenta
          </p>
        </div>
        
        <Form {...form}>
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
                    <Input
                      placeholder="tu@email.com"
                      type="email"
                      className="bg-background"
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
                    <Input
                      placeholder="••••••••"
                      type="password"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
            
            <div className="text-sm text-muted-foreground text-center pt-4">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Regístrate
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}