import React, { useEffect, useRef, useState } from 'react';
import { WishItem } from '../../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '../../lib/queryClient';
import { Package, Image, Edit3, ChevronLeft } from 'lucide-react';
import ProductImage from '../ProductImage';
import { CustomInput } from "@/components/ui/custom-input";
import { Button } from "@/components/ui/button";
import { CustomTextarea } from "@/components/ui/custom-textarea";

// Esquema para el primer paso (solo enlace)
const stepOneSchema = z.object({
  purchaseLink: z.string().url('Debe ser una URL válida').min(1, 'El enlace de compra es obligatorio'),
}).partial(); // Hacemos todos los campos opcionales para permitir omitir este paso

// Esquema para el segundo paso (detalles completos)
const stepTwoSchema = z.object({
  title: z.string().min(1, 'El nombre del producto es obligatorio'),
  description: z.string().optional(),
  purchaseLink: z.string().optional(), // Hacemos opcional sin validación de URL
  price: z.string()
    .min(1, 'El precio es obligatorio')
    .refine(val => /^[0-9]+(,[0-9]+)?$/.test(val), {
      message: 'Solo se aceptan números con decimales separados por coma'
    }),
  currency: z.string().default('€'),
  imageUrl: z.string().optional(),
});

interface AddWishModalProps {
  wishlistId: number;
  onClose: () => void;
  onItemAdded: (item: WishItem) => void;
  itemToEdit?: WishItem;
}

const AddWishModal: React.FC<AddWishModalProps> = ({
  wishlistId,
  onClose,
  onItemAdded,
  itemToEdit
}) => {
  const [step, setStep] = useState(itemToEdit ? 2 : 1); // Si hay itemToEdit, vamos directo al paso 2
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [extractedData, setExtractedData] = useState({
    title: '',
    imageUrl: '',
    price: '',
    description: ''
  });
  
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Formulario paso 1 (enlace de producto)
  const { 
    register: registerStepOne, 
    handleSubmit: handleSubmitStepOne,
    formState: { errors: errorsStepOne },
    watch: watchStepOne,
    setValue: setValueStepOne
  } = useForm({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      purchaseLink: itemToEdit?.purchaseLink || ''
    }
  });
  
  // Vigilar el valor del enlace
  const watchedPurchaseLink = watchStepOne('purchaseLink');
  
  // Formulario paso 2 (detalles del producto)
  const { 
    register: registerStepTwo, 
    handleSubmit: handleSubmitStepTwo,
    formState: { errors: errorsStepTwo },
    watch: watchStepTwo,
    setValue: setValueStepTwo
  } = useForm({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: itemToEdit ? {
      title: itemToEdit.title || '',
      description: itemToEdit.description || '',
      purchaseLink: itemToEdit.purchaseLink || '',
      price: itemToEdit.price ? itemToEdit.price.replace('€', '').replace('$', '').replace('£', '').trim() : '',
      currency: itemToEdit.price?.includes('€') ? '€' : itemToEdit.price?.includes('$') ? '$' : itemToEdit.price?.includes('£') ? '£' : '€',
      imageUrl: itemToEdit.imageUrl || ''
    } : {
      title: '',
      description: '',
      purchaseLink: '',
      price: '',
      currency: '€',
      imageUrl: ''
    }
  });
  
  // Vigilar campos específicos
  const watchedImageUrl = watchStepTwo('imageUrl');
  
  // Cerrar modal
  const handleClose = () => {
    onClose();
  };
  
  // Volver al paso 1
  const goBackToStepOne = () => {
    setStep(1);
  };
  
  // Función para extraer metadata de URLs
  const extractMetadata = async (url: string) => {
    try {
      setIsLoading(true);
      
      // Llamada a la API para extraer metadatos
      const response = await fetch(`/api/extract-metadata?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('Error al extraer metadatos');
      }
      
      const data = await response.json();
      
      // Automaticamente establecer datos extraídos en el paso 2
      if (data.imageUrl) {
        setValueStepTwo('imageUrl', data.imageUrl);
      }
      
      if (data.price) {
        // Extraer solo el número y la coma decimal si existe
        const priceMatch = data.price.match(/([0-9]+(?:,[0-9]+)?)/);
        if (priceMatch && priceMatch[1]) {
          setValueStepTwo('price', priceMatch[1]);
          
          // Establecer la moneda
          if (data.price.includes('€')) {
            setValueStepTwo('currency', '€');
          } else if (data.price.includes('$')) {
            setValueStepTwo('currency', '$');
          } else if (data.price.includes('£')) {
            setValueStepTwo('currency', '£');
          }
        }
      }
      
      // Actualizar estado con todos los datos extraídos
      setExtractedData({
        ...extractedData,
        imageUrl: data.imageUrl || '',
        price: data.price || ''
      });
      
      return data;
    } catch (error) {
      console.error('Error extrayendo metadatos:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enviar paso 1 - extraer metadatos y avanzar
  const submitStepOne = async (formData: any) => {
    // Solo si hay un enlace, intentamos extraer metadatos
    if (formData.purchaseLink) {
      await extractMetadata(formData.purchaseLink);
    }
    
    // Transferir el enlace al paso 2
    setValueStepTwo('purchaseLink', formData.purchaseLink);
    
    // Avanzar al siguiente paso
    setStep(2);
  };
  
  // Enviar paso 2 - guardar el ítem
  const submitStepTwo = async (formData: any) => {
    try {
      setIsSaving(true);
      
      // Componer el precio completo con la moneda
      const fullPrice = `${formData.price}${formData.currency}`;
      
      // Preparar los datos para enviar
      const itemData = {
        title: formData.title,
        description: formData.description || '',
        purchaseLink: formData.purchaseLink || '',
        price: fullPrice,
        imageUrl: formData.imageUrl || ''
      };
      
      console.log('Datos a enviar:', itemData);
      
      // Determinar si es una actualización o una creación
      let response;
      
      if (itemToEdit) {
        // Actualizar item existente
        response = await apiRequest('PUT', `/api/wishlist/items/${itemToEdit.id}`, itemData);
      } else {
        // Crear nuevo item
        response = await apiRequest('POST', `/api/wishlist/${wishlistId}/items`, itemData);
      }
      
      const data = await response.json();
      
      console.log(itemToEdit ? 'Deseo actualizado correctamente:' : 'Deseo añadido correctamente:', data);
      
      // Notificar al padre
      onItemAdded(data);
    } catch (error) {
      console.error('Error al guardar el deseo:', error);
    } finally {
      setIsSaving(false);
      
      // Notificar al padre para cerrar el modal
      onClose();
    }
  };

  // Manejar cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      
      // Simular subida de imagen
      setTimeout(() => {
        // Para una demo, usamos URL.createObjectURL
        // En producción, esto se reemplazaría por una subida real
        const imageUrl = URL.createObjectURL(file);
        
        // Asignar URL al campo del formulario y al estado de datos extraídos
        setValueStepTwo('imageUrl', imageUrl);
        
        // Actualizar el estado para mostrar la imagen
        setExtractedData({
          ...extractedData,
          imageUrl: imageUrl
        });
        
        // Imprimir para depuración
        console.log('Imagen subida manualmente:', imageUrl);
        
        setUploadingImage(false);
      }, 1000);
    }
  };

  // Manejar clic en botón de subir imagen
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // La función de editar URL de imagen ha sido eliminada por ser legacy
  
  // Renderizar imagen o placeholder
  const renderImage = () => {
    const imageUrl = watchedImageUrl || extractedData.imageUrl;
    const productTitle = watchStepTwo('title') || '';
    const purchaseLink = watchStepTwo('purchaseLink') || watchedPurchaseLink;
    
    if (uploadingImage) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-[#252525] rounded-lg border border-[#333]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        {/* Container para la imagen y acciones */}
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-[#252525] border border-[#333]">
          {/* Imagen o placeholder */}
          <ProductImage 
            imageUrl={imageUrl}
            title={productTitle}
            purchaseLink={purchaseLink}
            className="w-full h-full object-cover"
          />
          
          {/* Botón de subir imagen */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="absolute bottom-4 right-4 p-2 bg-[#333] hover:bg-[#444] rounded-full transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="fixed inset-0 z-50 max-w-[500px] mx-auto">
        <div className="h-full flex flex-col bg-[#121212] animate-slide-up overflow-hidden">
          <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-[#333] bg-[#121212]">
            <h2 className="text-xl font-semibold text-white">
              {itemToEdit 
                ? 'Editar deseo' 
                : step === 1 
                  ? 'Añadir deseo 1/2' 
                  : 'Añadir deseo 2/2'
              }
            </h2>
            <button 
              onClick={handleClose} 
              className="p-2 hover:bg-[#252525] rounded-full transition-colors text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div ref={modalRef} className="flex-1 overflow-auto text-white">
            {step === 1 ? (
              // Formulario paso 1 (solo para añadir nuevo, no para editar)
              <form onSubmit={handleSubmitStepOne(submitStepOne)} className="flex-1 p-4 pb-24 flex flex-col">
                <div className="flex-1 flex flex-col justify-center">
                  <div>
                    <div className="mb-4">
                      <label htmlFor="purchaseLink" className="block text-sm font-medium mb-2">
                        Enlace de compra
                      </label>
                      <CustomInput
                        type="url" 
                        id="purchaseLink" 
                        placeholder="https://..."
                        {...registerStepOne('purchaseLink')}
                      />
                      {errorsStepOne.purchaseLink && (
                        <p className="text-destructive text-sm mt-2">{errorsStepOne.purchaseLink.message as string}</p>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Un enlace a la página de tu producto en Amazon o cualquier otra tienda.{" "}
                      <button 
                        type="button"
                        onClick={() => {
                          // Ir al paso 2 sin enlace
                          setValueStepTwo('purchaseLink', '');
                          setStep(2);
                          // Asegurarnos de que ambos estados de carga estén desactivados
                          setIsLoading(false);
                          setIsSaving(false);
                        }}
                        className="text-gray-400 underline hover:text-white focus:outline-none inline-block"
                      >
                        Omite este paso
                      </button>
                    </p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 fixed bottom-0 left-0 right-0 flex justify-between bg-[#121212] p-4 border-t border-[#333] max-w-[500px] mx-auto">
                  <Button 
                    type="button" 
                    onClick={handleClose}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando
                      </>
                    ) : (
                      'Continuar'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // Formulario paso 2 (usado para añadir paso 2 y para editar en un solo paso)
              <form onSubmit={handleSubmitStepTwo(submitStepTwo)} className="flex-1 p-4 pb-24 flex flex-col">
                {/* Campo de enlace para edición (solo visible en modo edición) */}
                {itemToEdit && (
                  <div className="mb-6">
                    <label htmlFor="purchaseLink" className="block text-sm font-medium mb-2">
                      Enlace de compra
                    </label>
                    <CustomInput
                      type="url" 
                      id="purchaseLink" 
                      placeholder="https://..."
                      {...registerStepTwo('purchaseLink')}
                    />
                    {errorsStepTwo.purchaseLink && (
                      <p className="text-destructive text-sm mt-2">{errorsStepTwo.purchaseLink.message as string}</p>
                    )}
                  </div>
                )}
                
                {/* Imagen */}
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-2">
                    Imagen del producto (opcional)
                  </label>
                </div>
                {renderImage()}
                
                {/* Input oculto para subir imagen */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {/* Se ha eliminado el campo de URL de imagen por ser legacy */}
                
                <div className="mb-6">
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Nombre del producto
                  </label>
                  <CustomInput
                    type="text" 
                    id="title" 
                    placeholder="Introduce un nombre"
                    {...registerStepTwo('title')}
                  />
                  {errorsStepTwo.title && (
                    <p className="text-destructive text-sm mt-2">{errorsStepTwo.title.message as string}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="price" className="block text-sm font-medium mb-2">
                    Precio
                  </label>
                  <div className="flex">
                    <div className="flex-1 relative">
                      <CustomInput
                        type="text" 
                        id="price" 
                        className="rounded-r-none"
                        placeholder="Introduce un número"
                        inputMode="decimal"
                        pattern="[0-9]+(,[0-9]+)?"
                        {...registerStepTwo('price')}
                      />
                    </div>
                    <select 
                      className="w-20 pl-3 pr-7 py-3 bg-[#252525] border border-[#333] border-l-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#5883C6] focus:border-transparent text-white appearance-none" 
                      style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a0aec0' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                      {...registerStepTwo('currency')}
                    >
                      <option value="€">€</option>
                      <option value="$">$</option>
                      <option value="£">£</option>
                    </select>
                  </div>
                  {errorsStepTwo.price && (
                    <p className="text-destructive text-sm mt-2">{errorsStepTwo.price.message as string}</p>
                  )}
                  <p className="text-gray-400 text-sm mt-2">
                    El precio de compra actual o un precio aproximado.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Descripción (opcional)
                  </label>
                  <CustomTextarea 
                    id="description" 
                    rows={4}
                    className="resize-none"
                    placeholder="Añade detalles como color, talla, modelo..."
                    {...registerStepTwo('description')}
                  />
                  {errorsStepTwo.description && (
                    <p className="text-destructive text-sm mt-2">{errorsStepTwo.description.message as string}</p>
                  )}
                </div>
                
                {/* Campo oculto para mantener el enlace de compra (solo para el flujo de creación) */}
                {!itemToEdit && (
                  <input 
                    type="hidden" 
                    {...registerStepTwo('purchaseLink')}
                  />
                )}
                
                <div className="mt-auto pt-4 fixed bottom-0 left-0 right-0 flex justify-between bg-[#121212] p-4 border-t border-[#333] max-w-[500px] mx-auto">
                  <Button 
                    type="button" 
                    onClick={itemToEdit ? handleClose : goBackToStepOne}
                    variant="outline"
                  >
                    {!itemToEdit && <ChevronLeft className="h-4 w-4 mr-1" />}
                    {itemToEdit ? 'Cancelar' : 'Atrás'}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando
                      </>
                    ) : (
                      itemToEdit ? 'Actualizar' : 'Guardar'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWishModal;