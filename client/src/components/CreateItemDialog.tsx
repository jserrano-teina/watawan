import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { insertWishlistItemSchema } from "@shared/schema";

const formSchema = insertWishlistItemSchema.omit({ wishlistId: true }).extend({
  wishlistId: z.number().optional(),
  price: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  wishlistId: number;
  editItem?: any;
}

export function CreateItemDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  wishlistId,
  editItem 
}: CreateItemDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editItem?.name || "",
      description: editItem?.description || "",
      price: editItem?.price || "",
      link: editItem?.link || "",
      store: editItem?.store || "",
      imageUrl: editItem?.imageUrl || "",
      isPriority: editItem?.isPriority || false,
    },
  });

  React.useEffect(() => {
    if (open && editItem) {
      form.reset({
        name: editItem.name || "",
        description: editItem.description || "",
        price: editItem.price || "",
        link: editItem.link || "",
        store: editItem.store || "",
        imageUrl: editItem.imageUrl || "",
        isPriority: editItem.isPriority || false,
      });
    } else if (open) {
      form.reset({
        name: "",
        description: "",
        price: "",
        link: "",
        store: "",
        imageUrl: "",
        isPriority: false,
      });
    }
  }, [open, editItem, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      ...data,
      wishlistId
    });
    form.reset({
      name: "",
      description: "",
      price: "",
      link: "",
      store: "",
      imageUrl: "",
      isPriority: false,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editItem ? "Editar artículo" : "Añadir artículo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del artículo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Auriculares inalámbricos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Añade detalles como: color, talla, modelo..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">€</span>
                      <Input className="pl-8" placeholder="0.00" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enlace de compra *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="store"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tienda</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Amazon, Zara, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de imagen</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPriority"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Marcar como prioritario</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateItemDialog;
