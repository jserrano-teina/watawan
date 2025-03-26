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
import { useEffect } from "react";

const registerSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  displayName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, registerMutation } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
  });

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      },
      {
        onSuccess: () => {
          toast({
            title: "Registro exitoso",
            description: "¡Bienvenido a WishList!",
          });
          setLocation("/");
        },
        onError: (error: Error) => {
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
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-col w-full max-w-md mx-auto items-center justify-center px-4 py-12">
        <div className="w-full mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Crear cuenta</h1>
          <p className="text-muted-foreground">
            Registra una nueva cuenta para empezar a usar WishList
          </p>
        </div>
        
        <Form {...form}>
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
                      type="email"
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
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
            
            <div className="text-sm text-muted-foreground text-center pt-4">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}