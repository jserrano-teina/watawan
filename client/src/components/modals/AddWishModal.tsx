import React, { useEffect, useRef, useState } from 'react';
import { WishItem } from '../../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '../../lib/queryClient';
import { Package, Image, Edit3 } from 'lucide-react';
import ProductImage from '../ProductImage';

// Esquema para el primer paso (solo enlace)
const stepOneSchema = z.object({
  purchaseLink: z.string().url('Debe ser una URL válida').min(1, 'El enlace de compra es obligatorio'),
});

// Esquema para el segundo paso (detalles completos)
const stepTwoSchema = z.object({
  title: z.string().min(1, 'El nombre del producto es obligatorio'),
  description: z.string().optional(),
  purchaseLink: z.string().url('Debe ser una URL válida').min(1, 'El enlace de compra es obligatorio'),
  price: z.string()
    .min(1, 'El precio es obligatorio')
    .refine(val => /^[0-9]+(,[0-9]+)?$/.test(val), {
      message: 'Solo se aceptan números con decimales separados por coma'
    }),
  currency: z.string().default('€'),
  imageUrl: z.string().optional(),
});

type StepOneFormValues = z.infer<typeof stepOneSchema>;
type StepTwoFormValues = z.infer<typeof stepTwoSchema>;

interface AddWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StepTwoFormValues) => void;
  itemToEdit?: WishItem;
}

const AddWishModal: React.FC<AddWishModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  itemToEdit 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1); // Paso 1 o 2
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    imageUrl?: string,
    price?: string,
  }>({});
  const [purchaseLinkValue, setPurchaseLinkValue] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Formulario paso 1 (solo enlace)
  const {
    register: registerStepOne,
    handleSubmit: handleSubmitStepOne,
    reset: resetStepOne,
    setValue: setValueStepOne,
    watch: watchStepOne,
    formState: { errors: errorsStepOne }
  } = useForm<StepOneFormValues>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      purchaseLink: itemToEdit?.purchaseLink || '',
    }
  });

  // Formulario paso 2 (todos los campos)
  const {
    register: registerStepTwo,
    handleSubmit: handleSubmitStepTwo,
    reset: resetStepTwo,
    setValue: setValueStepTwo,
    watch: watchStepTwo,
    formState: { errors: errorsStepTwo }
  } = useForm<StepTwoFormValues>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      title: itemToEdit?.title || '',
      description: itemToEdit?.description || '',
      purchaseLink: itemToEdit?.purchaseLink || '',
      price: itemToEdit?.price?.replace(/[^0-9,.]/g, '') || '', // Quitar símbolos de moneda
      currency: itemToEdit?.price?.includes('$') ? '$' : '€',
      imageUrl: itemToEdit?.imageUrl || '',
    }
  });

  // Observar campos del formulario
  const watchedPurchaseLink = watchStepOne('purchaseLink');
  const watchedImageUrl = watchStepTwo('imageUrl');

  useEffect(() => {
    // Guardar el valor del enlace para mantenerlo entre pasos
    if (watchedPurchaseLink) {
      setPurchaseLinkValue(watchedPurchaseLink);
    }
  }, [watchedPurchaseLink]);

  // Reset forms when editing an item
  useEffect(() => {
    if (itemToEdit) {
      setStep(2); // Si estamos editando, ir directamente al paso 2
      
      // Extraer valor numérico del precio si existe
      let priceValue = '';
      let currencyValue = '€';
      
      if (itemToEdit.price) {
        priceValue = itemToEdit.price.replace(/[^0-9,.]/g, '');
        currencyValue = itemToEdit.price.includes('$') ? '$' : '€';
      }
      
      resetStepOne({
        purchaseLink: itemToEdit.purchaseLink,
      });
      
      resetStepTwo({
        title: itemToEdit.title,
        description: itemToEdit.description || '',
        purchaseLink: itemToEdit.purchaseLink,
        price: priceValue,
        currency: currencyValue,
        imageUrl: itemToEdit.imageUrl || '',
      });
      
      setPurchaseLinkValue(itemToEdit.purchaseLink);
      
      if (itemToEdit.imageUrl) {
        setExtractedData({
          ...extractedData,
          imageUrl: itemToEdit.imageUrl
        });
      }
    } else {
      setStep(1);
      resetStepOne({
        purchaseLink: '',
      });
      resetStepTwo({
        title: '',
        description: '',
        purchaseLink: '',
        price: '',
        currency: '€',
        imageUrl: '',
      });
      setPurchaseLinkValue('');
      // Limpiar los datos extraídos
      setExtractedData({});
      setShowImageUrlInput(false);
    }
  }, [itemToEdit, resetStepOne, resetStepTwo, isOpen]);

  if (!isOpen) return null;

  // Manejar envío del paso 1
  const submitStepOne = async (data: StepOneFormValues) => {
    setIsLoading(true);
    setPurchaseLinkValue(data.purchaseLink);
    
    try {
      // Extraer metadatos del enlace
      const response = await apiRequest('GET', `/api/extract-metadata?url=${encodeURIComponent(data.purchaseLink)}`);
      const metadata = await response.json();
      
      // Guardar datos extraídos para el paso 2
      setExtractedData({
        imageUrl: metadata.imageUrl,
        price: metadata.price
      });
      
      // Prerellenar formulario del paso 2
      setValueStepTwo('purchaseLink', data.purchaseLink);
      
      // Extraer solo el valor numérico del precio si existe
      if (metadata.price) {
        const priceValue = metadata.price.replace(/[^0-9,.]/g, '');
        const currencyValue = metadata.price.includes('$') ? '$' : '€';
        
        setValueStepTwo('price', priceValue);
        setValueStepTwo('currency', currencyValue);
      }
      
      if (metadata.imageUrl) {
        setValueStepTwo('imageUrl', metadata.imageUrl);
      }
      
      // Avanzar al paso 2
      setStep(2);
    } catch (error) {
      console.error('Error extrayendo metadatos:', error);
      // Aún así, avanzamos al paso 2, pero sin datos extraídos
      setValueStepTwo('purchaseLink', data.purchaseLink);
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar envío del paso 2 (final)
  const submitStepTwo = (data: StepTwoFormValues) => {
    // Activar estado de carga
    setIsSaving(true);
    
    // Formatear el precio con la moneda seleccionada
    const formattedData = {
      ...data,
      price: `${data.price}${data.currency}`
    };
    
    // Simular un pequeño retraso para mostrar el estado de carga
    setTimeout(() => {
      onSubmit(formattedData);
      
      // Limpiar el formulario antes de cerrarlo
      resetStepOne({
        purchaseLink: '',
      });
      resetStepTwo({
        title: '',
        description: '',
        purchaseLink: '',
        price: '',
        currency: '€',
        imageUrl: '',
      });
      
      // Restablecer el paso y cerrar el modal
      setStep(1);
      setExtractedData({});
      setPurchaseLinkValue('');
      setShowImageUrlInput(false);
      setIsSaving(false);
      onClose();
    }, 500);
  };

  // Manejar el retroceso a paso 1
  const goBackToStepOne = () => {
    // Mantener el enlace al volver al paso 1
    setValueStepOne('purchaseLink', purchaseLinkValue);
    setStep(1);
  };

  // Manejar cierre del modal
  const handleClose = () => {
    resetStepOne({
      purchaseLink: '',
    });
    resetStepTwo({
      title: '',
      description: '',
      purchaseLink: '',
      price: '',
      currency: '€',
      imageUrl: '',
    });
    setStep(1);
    setExtractedData({});
    setPurchaseLinkValue('');
    setShowImageUrlInput(false);
    onClose();
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
        setValueStepTwo('imageUrl', imageUrl);
        setExtractedData({
          ...extractedData,
          imageUrl: imageUrl
        });
        setUploadingImage(false);
      }, 1000);
    }
  };

  // Manejar clic en botón de subir imagen
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Manejar clic en botón de editar URL de imagen
  const handleEditImageUrlClick = () => {
    setShowImageUrlInput(!showImageUrlInput);
  };
  
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
    
    // Contenedor con o sin imagen usando ProductImage para manejar errores
    return (
      <div className="relative mb-6 w-full h-64">
        <ProductImage 
          imageUrl={imageUrl}
          title={productTitle}
          purchaseLink={purchaseLink}
          className="w-full h-full rounded-lg border border-[#333]"
        />
        
        {/* Solo botón para subir imagen */}
        <div className="absolute bottom-2 right-2">
          <button 
            type="button" 
            onClick={handleUploadClick} 
            className="p-2 bg-[#252525] bg-opacity-80 rounded-full hover:bg-[#333] transition-colors"
            title="Subir imagen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
              <line x1="16" y1="5" x2="22" y2="5"></line>
              <line x1="19" y1="2" x2="19" y2="8"></line>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#121212] min-h-screen overflow-auto"
    >
      <div ref={modalRef} className="flex flex-col h-full text-white">
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-[#333] bg-[#121212]">
          <h2 className="text-xl font-semibold">
            {itemToEdit 
              ? 'Editar deseo' 
              : step === 1 
                ? 'Añadir deseo 1/2' 
                : 'Añadir deseo 2/2'
            }
          </h2>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-[#252525] rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {step === 1 ? (
          // Formulario paso 1
          <form onSubmit={handleSubmitStepOne(submitStepOne)} className="flex-1 p-4 flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
              <div>
                <label htmlFor="purchaseLink" className="block text-white font-medium mb-2">
                  Enlace de compra
                </label>
                <input 
                  type="url" 
                  id="purchaseLink" 
                  className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white" 
                  placeholder="https://..."
                  {...registerStepOne('purchaseLink')}
                />
                {errorsStepOne.purchaseLink && (
                  <p className="text-red-500 text-sm mt-2">{errorsStepOne.purchaseLink.message}</p>
                )}
                <p className="text-white/60 text-sm mt-2">
                  Un enlace a la página de tu producto en Amazon o cualquier otra tienda
                </p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 flex justify-between bg-[#121212]">
              <button 
                type="button" 
                onClick={handleClose}
                className="px-6 py-3 border border-[#333] rounded-lg text-white font-medium hover:bg-[#252525] transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 ${isLoading ? 'bg-gray-600' : 'bg-primary hover:bg-primary/90'} text-white rounded-lg font-medium transition-colors flex items-center justify-center`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </div>
          </form>
        ) : (
          // Formulario paso 2
          <form onSubmit={handleSubmitStepTwo(submitStepTwo)} className="flex-1 p-4 flex flex-col">
            {/* Imagen primero */}
            {renderImage()}
            
            {/* Input oculto para subir imagen */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            {/* Campo de URL de imagen (oculto por defecto) */}
            {showImageUrlInput && (
              <div className="mb-6">
                <label htmlFor="imageUrl" className="block text-white font-medium mb-2">
                  URL de la imagen
                </label>
                <input 
                  type="url" 
                  id="imageUrl" 
                  className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white" 
                  placeholder="https://ejemplo.com/imagen.jpg"
                  {...registerStepTwo('imageUrl')}
                />
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="title" className="block text-white font-medium mb-2">
                Nombre del producto
              </label>
              <input 
                type="text" 
                id="title" 
                className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white" 
                placeholder="Introduce un nombre"
                {...registerStepTwo('title')}
              />
              {errorsStepTwo.title && (
                <p className="text-red-500 text-sm mt-2">{errorsStepTwo.title.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="price" className="block text-white font-medium mb-2">
                Precio
              </label>
              <div className="flex">
                <input 
                  type="text" 
                  id="price" 
                  className="flex-1 px-4 py-3 bg-[#252525] border border-[#333] rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white" 
                  placeholder="Introduce un número"
                  inputMode="decimal"
                  pattern="[0-9]+(,[0-9]+)?"
                  {...registerStepTwo('price')}
                />
                <select 
                  className="w-20 px-3 py-3 bg-[#252525] border border-[#333] border-l-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white" 
                  {...registerStepTwo('currency')}
                >
                  <option value="€">€</option>
                  <option value="$">$</option>
                  <option value="£">£</option>
                </select>
              </div>
              {errorsStepTwo.price && (
                <p className="text-red-500 text-sm mt-2">{errorsStepTwo.price.message}</p>
              )}
              <p className="text-white/60 text-sm mt-2">
                El precio de compra actual o un precio aproximado. Usa coma (,) para separar los decimales.
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-white font-medium mb-2">
                Descripción (opcional)
              </label>
              <textarea 
                id="description" 
                rows={4} 
                className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white" 
                placeholder="Añade detalles como color, talla, modelo..."
                {...registerStepTwo('description')}
              ></textarea>
              {errorsStepTwo.description && (
                <p className="text-red-500 text-sm mt-2">{errorsStepTwo.description.message}</p>
              )}
            </div>
            
            {/* Campo oculto para mantener el enlace de compra */}
            <input 
              type="hidden" 
              {...registerStepTwo('purchaseLink')}
            />
            
            <div className="mt-auto pt-4 sticky bottom-0 flex justify-between bg-[#121212]">
              <button 
                type="button" 
                onClick={goBackToStepOne}
                className="px-6 py-3 border border-[#333] rounded-lg text-white font-medium hover:bg-[#252525] transition-colors"
              >
                Atrás
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className={`px-6 py-3 ${isSaving ? 'bg-gray-600' : 'bg-primary hover:bg-primary/90'} text-white rounded-lg font-medium transition-colors flex items-center justify-center`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  itemToEdit ? 'Actualizar' : 'Guardar'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddWishModal;
