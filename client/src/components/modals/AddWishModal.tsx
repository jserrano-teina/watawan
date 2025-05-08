import React, { useEffect, useRef, useState } from 'react';
import { WishItem } from '../../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '../../lib/queryClient';
import { Package, Image, Edit3, ChevronLeft, ClipboardPaste, AlertCircle, XCircle } from 'lucide-react';
import ProductImage from '../ProductImage';
import { CustomInput } from "@/components/ui/custom-input";
import { Button } from "@/components/ui/button";
import { CustomTextarea } from "@/components/ui/custom-textarea";
import { AutoHeightInput } from "@/components/ui/auto-height-input";
import useScrollLock from "@/hooks/useScrollLock";
import { useToast } from "@/hooks/use-toast";

// Esquema para el primer paso (solo enlace)
const stepOneSchema = z.object({
  purchaseLink: z.string().url('Debe ser una URL válida').min(1, 'El enlace de compra es obligatorio'),
}).partial(); // Hacemos todos los campos opcionales para permitir omitir este paso

// Esquema para el segundo paso (detalles completos)
const stepTwoSchema = z.object({
  title: z.string()
    .min(1, 'El nombre del producto es obligatorio')
    .max(100, 'El nombre del producto no puede tener más de 100 caracteres'),
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

// Interfaz alineada con lo que espera el componente padre
interface FormattedStepTwoValues {
  title: string;
  price: string; // Ya siempre será obligatorio
  currency: string;
  purchaseLink?: string;
  description?: string;
  imageUrl?: string;
}

type StepOneFormValues = z.infer<typeof stepOneSchema>;
type StepTwoFormValues = z.infer<typeof stepTwoSchema>;

interface AddWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormattedStepTwoValues) => void;
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
    title?: string,
    description?: string,
    imageUrl?: string,
    price?: string,
    isTitleValid?: boolean,
    isImageValid?: boolean,
    validationMessage?: string,
    originalTitle?: string,
    skipValidation?: boolean,
  }>({});
  const [purchaseLinkValue, setPurchaseLinkValue] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isIOS, setIsIOS] = useState(false);
  const { toast } = useToast();
  
  // Estado para mensajes de alerta internos (toast customizado)
  const [internalAlert, setInternalAlert] = useState<{
    visible: boolean;
    message: string;
    type: 'error' | 'warning' | 'info';
  } | null>(null);
  
  // Bloquear scroll del body cuando el modal está abierto
  useScrollLock(isOpen);
  
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
  const watchedTitle = watchStepTwo('title');

  useEffect(() => {
    // Guardar el valor del enlace para mantenerlo entre pasos
    if (watchedPurchaseLink) {
      setPurchaseLinkValue(watchedPurchaseLink);
    }
  }, [watchedPurchaseLink]);
  
  // Efecto para considerar el título como válido si el usuario lo edita manualmente
  useEffect(() => {
    // Solo aplicamos este efecto en el paso 2 durante la creación, no la edición
    if (step === 2 && !itemToEdit && watchedTitle && watchedTitle.trim() !== '') {
      // Si el usuario ha modificado el título manualmente, lo consideramos válido
      setExtractedData(prev => ({
        ...prev,
        isTitleValid: true
      }));
    }
  }, [watchedTitle, step, itemToEdit]);
  
  // Ocultar automáticamente la alerta interna después de 3 segundos
  useEffect(() => {
    if (internalAlert && internalAlert.visible) {
      const timer = setTimeout(() => {
        setInternalAlert(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [internalAlert]);
  
  // Detectar si el dispositivo es iOS
  useEffect(() => {
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      console.log('User Agent:', userAgent);
      console.log('Detectado como iOS:', isIOSDevice);
      return isIOSDevice;
    };
    
    setIsIOS(checkIOS());
  }, []);

  // Reset forms when editing an item
  useEffect(() => {
    // Asegurarnos de que isSaving está siempre en false cuando se abre el modal
    setIsSaving(false);
    
    if (itemToEdit) {
      // Para edición, colocamos ambos pasos en un solo paso
      // Usamos el paso 2 para mantener la lógica pero modificaremos su presentación
      setStep(2); 
      
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
        setExtractedData(prev => ({
          ...prev,
          imageUrl: itemToEdit.imageUrl,
          isImageValid: true,
          isTitleValid: true
        }));
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
    }
  }, [itemToEdit, resetStepOne, resetStepTwo, isOpen]);

  if (!isOpen) return null;

  // Manejar envío del paso 1 (para el modo de creación, no edición)
  const submitStepOne = async (data: StepOneFormValues) => {
    // Solo llegamos aquí durante el proceso de adición, no edición
    setIsLoading(true);
    const purchaseLink = data.purchaseLink || '';
    setPurchaseLinkValue(purchaseLink);
    
    try {
      // Extraer metadatos del enlace si existe
      if (purchaseLink) {
        const response = await apiRequest('GET', `/api/extract-metadata?url=${encodeURIComponent(purchaseLink)}`);
        const metadata = await response.json();
        
        // Log para debug de validación AI
        console.log('Metadatos extraídos con validación IA:', {
          title: metadata.title,
          imageUrl: metadata.imageUrl ? 'Disponible' : 'No disponible',
          isTitleValid: metadata.isTitleValid,
          isImageValid: metadata.isImageValid,
          validationMessage: metadata.validationMessage
        });
        console.log('Datos inválidos encontrados:', 
          !metadata.isTitleValid || !metadata.isImageValid ? 'SÍ' : 'NO',
          !metadata.isTitleValid ? 'Título inválido' : '',
          !metadata.isImageValid ? 'Imagen inválida' : '');
        
        // Guardar datos extraídos para el paso 2
        setExtractedData(prev => ({
          ...prev,
          imageUrl: metadata.imageUrl,
          price: metadata.price,
          isTitleValid: metadata.isTitleValid,
          isImageValid: metadata.isImageValid,
          validationMessage: metadata.validationMessage,
          originalTitle: metadata.title || ''
        }));
        
        // Prerellenar formulario del paso 2
        setValueStepTwo('purchaseLink', purchaseLink);
        
        // Establecer el título solo si existe y es válido, limitándolo a 100 caracteres
        if (metadata.title && metadata.isTitleValid) {
          console.log('Título extraído válido:', metadata.title);
          // Truncar el título a un máximo de 100 caracteres
          const truncatedTitle = metadata.title.substring(0, 100);
          setValueStepTwo('title', truncatedTitle);
        } else if (metadata.title && !metadata.isTitleValid) {
          console.log('Título extraído inválido, dejando el campo vacío:', metadata.title);
          // Si el título es inválido, dejamos el campo vacío para que el usuario lo complete
          setValueStepTwo('title', '');
        }
        
        // Extraer solo el valor numérico del precio si existe
        if (metadata.price) {
          // Primero eliminar todos los caracteres que no sean números, puntos o comas
          let priceValue = metadata.price.replace(/[^0-9,.]/g, '');
          
          // Sustituir todos los puntos por comas para la representación de decimales
          priceValue = priceValue.replace(/\./g, ',');
          
          const currencyValue = metadata.price.includes('$') ? '$' : '€';
          
          setValueStepTwo('price', priceValue);
          setValueStepTwo('currency', currencyValue);
        }
        
        if (metadata.imageUrl) {
          setValueStepTwo('imageUrl', metadata.imageUrl);
        }
      }
      
      // Avanzar al paso 2
      setStep(2);
    } catch (error) {
      console.error('Error extrayendo metadatos:', error);
      // Aún así, avanzamos al paso 2, pero sin datos extraídos
      if (purchaseLink) {
        setValueStepTwo('purchaseLink', purchaseLink);
      }
      setStep(2);
    } finally {
      // Asegurarnos de que los estados de carga estén desactivados
      setIsLoading(false);
      // Importante: asegurarnos de que isSaving también esté reseteado cuando pasamos al paso 2
      setIsSaving(false);
    }
  };

  // Manejar envío del paso 2 (final)
  const submitStepTwo = (data: StepTwoFormValues) => {
    // Activar estado de carga
    setIsSaving(true);
    
    try {
      // Formatear el precio con la moneda seleccionada (ahora siempre hay un precio porque es obligatorio)
      const formattedData: FormattedStepTwoValues = {
        title: data.title,
        price: `${data.price}${data.currency}`,
        currency: data.currency,
        purchaseLink: data.purchaseLink,
        description: data.description,
        imageUrl: data.imageUrl
      };
      
      // Simplemente enviamos los datos al componente padre y dejamos que 
      // él se encargue del proceso completo, incluyendo limpieza y cierre del modal
      onSubmit(formattedData);
      
      // NO reseteamos el estado aquí para evitar que el usuario vea el paso 1 
      // brevemente antes de que se cierre el modal
      // La limpieza se realizará cuando el modal se cierre
    } catch (error) {
      console.error("Error al procesar el formulario:", error);
      // En caso de error, desactivamos el estado de carga
      setIsSaving(false);
    }
    // No usamos finally porque queremos mantener el estado de carga 
    // hasta que el padre cierre el modal
  };

  // Manejar el retroceso a paso 1
  const goBackToStepOne = () => {
    // Mantener el enlace al volver al paso 1
    setValueStepOne('purchaseLink', purchaseLinkValue);
    setStep(1);
  };

  // Manejar cierre del modal
  const handleClose = () => {
    // Desactivar estado de carga si estaba activo
    if (isSaving) {
      setIsSaving(false);
    }
    
    // Limpiar todos los formularios
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
    
    // Restablecer todos los estados a sus valores iniciales
    setStep(1);
    setExtractedData({});
    setPurchaseLinkValue('');
    
    // Notificar al padre para cerrar el modal
    onClose();
  };

  // Manejar cambio de imagen
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      
      try {
        // Convertir la imagen a base64
        const base64Image = await convertFileToBase64(file);
        
        // Enviar la imagen al servidor
        const response = await apiRequest('POST', '/api/upload-image', {
          image: base64Image
        });
        
        if (!response.ok) {
          throw new Error('Error al subir la imagen');
        }
        
        const data = await response.json();
        const imageUrl = data.imageUrl;
        
        console.log('Imagen subida al servidor:', imageUrl);
        
        // Asignar URL al campo del formulario y al estado de datos extraídos
        setValueStepTwo('imageUrl', imageUrl);
        
        // Actualizar el estado para mostrar la imagen
        // Cuando el usuario sube una imagen manualmente, la consideramos válida
        setExtractedData(prev => ({
          ...prev,
          imageUrl: imageUrl,
          isImageValid: true
        }));
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        // Mostrar mensaje de error al usuario
        alert('Error al subir la imagen. Por favor, intenta de nuevo.');
      } finally {
        setUploadingImage(false);
      }
    }
  };
  
  // Función para convertir un archivo a base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Función para pegar enlace desde el portapapeles
  const handlePasteFromClipboard = async () => {
    try {
      // Verificar si la API de portapapeles está disponible
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        console.log('El navegador no soporta clipboard.readText');
        setInternalAlert({
          visible: true,
          message: "Copia primero un enlace para pegarlo",
          type: "warning"
        });
        
        // Ocultar automáticamente después de 3 segundos
        setTimeout(() => {
          setInternalAlert(prev => prev ? { ...prev, visible: false } : null);
        }, 3000);
        
        return;
      }
      
      // Leer desde el portapapeles
      const text = await navigator.clipboard.readText();
      console.log('Contenido del portapapeles:', text ? 'Tiene contenido' : 'Vacío');
      
      // Verificar si hay contenido en el portapapeles
      if (!text || text.trim() === '') {
        console.log('Portapapeles vacío, mostrando alerta interna');
        setInternalAlert({
          visible: true,
          message: "Copia primero un enlace para pegarlo",
          type: "warning"
        });
        
        // Ocultar automáticamente después de 3 segundos
        setTimeout(() => {
          setInternalAlert(prev => prev ? { ...prev, visible: false } : null);
        }, 3000);
        
        return;
      }
      
      // Verificar si es una URL válida
      let isValidUrl = false;
      try {
        // Intentar crear un objeto URL como validación básica
        new URL(text);
        isValidUrl = true;
        
        // Si llegamos aquí, es una URL válida
        console.log('URL válida, estableciendo valor');
        setValueStepOne('purchaseLink', text);
        
      } catch (urlError) {
        // No es una URL válida
        console.log('URL inválida, mostrando alerta interna');
        setInternalAlert({
          visible: true,
          message: "Copia primero un enlace para pegarlo",
          type: "warning"
        });
        
        // Ocultar automáticamente después de 3 segundos
        setTimeout(() => {
          setInternalAlert(prev => prev ? { ...prev, visible: false } : null);
        }, 3000);
      }
      
      // Si no es una URL válida y no establecimos el valor, también mostramos un toast
      if (!isValidUrl) {
        console.log('No se pegó ningún contenido porque no es una URL válida');
      }
    } catch (error) {
      console.error('Error al acceder al portapapeles:', error);
      setInternalAlert({
        visible: true,
        message: "Copia primero un enlace para pegarlo",
        type: "warning"
      });
      
      // Ocultar automáticamente después de 3 segundos
      setTimeout(() => {
        setInternalAlert(prev => prev ? { ...prev, visible: false } : null);
      }, 3000);
    }
  };
  
  // Manejar clic en botón de subir imagen
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Renderizar imagen o placeholder
  const renderImage = () => {
    const imageUrl = watchedImageUrl || extractedData.imageUrl;
    const productTitle = watchStepTwo('title') || '';
    const purchaseLink = watchStepTwo('purchaseLink') || watchedPurchaseLink;
    
    if (uploadingImage) {
      return (
        <div className="mb-6 w-24 h-24 flex items-center justify-center bg-[#252525] rounded-lg border border-[#333]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }
    
    // Siempre mostramos un cuadrado de 96x96 (h-24 w-24) con el botón redondo
    return (
      <div className="relative mb-6 flex">
        <div className="w-24 h-24 rounded-lg overflow-hidden border border-[#333] bg-[#252525]">
          {imageUrl ? (
            <ProductImage 
              imageUrl={imageUrl}
              title={productTitle}
              purchaseLink={purchaseLink}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full"></div>
          )}
        </div>
        
        {/* Botón para añadir/cambiar la imagen (siempre visible) */}
        <div className="absolute bottom-2 right-2">
          <button 
            type="button" 
            onClick={handleUploadClick} 
            className="p-2 bg-[#252525] bg-opacity-80 rounded-full hover:bg-[#333] transition-colors"
            title={imageUrl ? "Cambiar imagen" : "Añadir imagen"}
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="fixed inset-0 z-50 max-w-[500px] mx-auto overflow-hidden">
        <div className="w-full h-full flex flex-col bg-[#121212] animate-slide-up overflow-hidden">
          {/* Header con título y botón cerrar */}
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
              className="p-2 hover:bg-[#252525] rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Alerta interna fija (común para ambos pasos) */}
          {internalAlert && internalAlert.visible && (
            <div className="fixed bottom-[100px] left-1/2 transform -translate-x-1/2 z-[60] w-[90%] max-w-[450px]">
              <div className={`px-5 py-3 rounded-lg shadow-lg flex items-center transition-opacity duration-300 ${
                internalAlert.type === 'error' 
                  ? 'bg-destructive text-white' 
                  : internalAlert.type === 'warning'
                  ? 'bg-[#1d1810] text-[#FFE066] border border-[#FFE066]/20' 
                  : 'bg-[#0d1710] text-white border border-green-800/30'
              }`}>
                <div className="flex items-center w-full">
                  {internalAlert.type === 'error' ? (
                    <XCircle className="h-5 w-5 mr-2 text-white" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 text-[#FFE066]" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm">{internalAlert.message}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Formulario paso 1 */}
          {step === 1 ? (
            <form onSubmit={handleSubmitStepOne(submitStepOne)} className="flex-1 flex flex-col h-full">
              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto scrollable-container px-4 py-4 pb-[180px] flex items-center">
                <div className="flex flex-col justify-center w-full">
                  <div className="mb-0">
                    <p className="text-white text-base mb-4 mt-4">
                      Pega un enlace a la página de compra del producto que deseas
                    </p>
                    <CustomInput
                      type="text" 
                      id="purchaseLink" 
                      placeholder="https://..."
                      {...registerStepOne('purchaseLink')}
                      aria-label="Pega un enlace a la página de compra del producto que deseas"
                    />
                    {errorsStepOne.purchaseLink && (
                      <p className="text-destructive text-sm mt-2">{errorsStepOne.purchaseLink.message}</p>
                    )}
                  </div>

                  
                  {/* Botón para pegar desde el portapapeles (oculto en iOS) */}
                  {!isIOS && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4 text-base flex items-center justify-center"
                      onClick={handlePasteFromClipboard}
                    >
                      <ClipboardPaste className="h-[16px] w-[16px]" style={{ marginRight: '4px' }} />
                      <span style={{ marginLeft: '0' }}>Pegar enlace</span>
                    </Button>
                  )}
                  
                  {/* Botón para omitir paso */}
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        // Ir al paso 2 sin enlace
                        setValueStepTwo('purchaseLink', '');
                        // Marcar como omitido para evitar advertencias
                        setExtractedData({
                          title: '',
                          description: '',
                          imageUrl: '',
                          isTitleValid: true, // Marcar como válido para no mostrar la advertencia
                          isImageValid: true, // Marcar como válido para no mostrar la advertencia
                          skipValidation: true // Flag que indica que se omitió la validación
                        });
                        setStep(2);
                        // Asegurarnos de que ambos estados de carga estén desactivados
                        setIsLoading(false);
                        setIsSaving(false);
                      }}
                      className="text-white flex items-center py-2 px-4 hover:bg-[#252525] transition-colors rounded-lg text-base"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                      <span style={{ marginLeft: '0' }}>Omite este paso</span>
                    </button>
                  </div>
                </div>
              </div>
              

              
              {/* Barra de navegación fija inferior */}
              <div className="fixed bottom-0 left-0 right-0 max-w-[500px] mx-auto w-full flex justify-between bg-[#121212] p-4 border-t border-[#333] safe-area-bottom" style={{ zIndex: 40 }}>
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
                    </>
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            // Formulario paso 2
            <form onSubmit={handleSubmitStepTwo(submitStepTwo)} className="flex-1 flex flex-col h-full">
              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto scrollable-container px-4 py-4 pb-[180px]">
                {/* Campo de enlace para edición (solo visible en modo edición) */}
                {itemToEdit && (
                  <div className="mb-6">
                    <label htmlFor="purchaseLink" className="block text-sm font-medium mb-2 text-white">
                      Enlace de compra
                    </label>
                    <CustomInput
                      type="text" 
                      id="purchaseLink" 
                      placeholder="https://..."
                      {...registerStepTwo('purchaseLink')}
                    />
                    {errorsStepTwo.purchaseLink && (
                      <p className="text-destructive text-sm mt-2">{errorsStepTwo.purchaseLink.message}</p>
                    )}
                  </div>
                )}
                
                {/* Mensaje de advertencia si hay datos de baja calidad */}
                {(() => {
                  // Evaluamos y mostramos un log para depurar
                  // IMPORTANTE: Usamos doble negación para convertir undefined a false
                  const isTitleValid = !!extractedData.isTitleValid;
                  const isImageValid = !!extractedData.isImageValid;
                  const wasSkipped = !!extractedData.skipValidation;
                  
                  // Solo mostrar advertencia si:
                  // 1. Estamos en el paso 2
                  // 2. No estamos editando un item existente
                  // 3. Alguna validación falló (título o imagen)
                  // 4. NO se omitió el paso 1 (la validación no fue omitida)
                  const showWarning = step === 2 && !itemToEdit && (!isTitleValid || !isImageValid) && !wasSkipped;
                  
                  console.log('Estado de la condición de advertencia:', {
                    step,
                    isEditing: !!itemToEdit,
                    isTitleValid: extractedData.isTitleValid,
                    isImageValid: extractedData.isImageValid,
                    wasSkipped,
                    isTitleValidBool: isTitleValid,
                    isImageValidBool: isImageValid,
                    showWarning
                  });
                  
                  return showWarning ? (
                    <div className="mb-6 p-3 bg-[#15243b] border border-[#2d4a7c] rounded-lg">
                      <p className="text-white text-opacity-80 text-xs">
                        No hemos podido autocompletar la información de este deseo (es normal con algunos productos o tiendas). Puedes completarla manualmente.
                      </p>
                    </div>
                  ) : null;
                })()}
                
                {/* Imagen */}
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-2 text-white">
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
                
                <div className="mb-6">
                  <label htmlFor="title" className="block text-sm font-medium mb-2 text-white">
                    Nombre del producto
                  </label>
                  <AutoHeightInput
                    id="title" 
                    placeholder="Introduce un nombre"
                    maxLength={100}
                    minHeight={50}
                    {...registerStepTwo('title')}
                  />
                  {errorsStepTwo.title && (
                    <p className="text-destructive text-sm mt-2">{errorsStepTwo.title.message}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label htmlFor="price" className="block text-sm font-medium mb-2 text-white">
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
                    <p className="text-destructive text-sm mt-2">{errorsStepTwo.price.message}</p>
                  )}
                  <p className="text-gray-400 text-sm mt-2">
                    El precio de compra actual o un precio aproximado.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium mb-2 text-white">
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
                    <p className="text-destructive text-sm mt-2">{errorsStepTwo.description.message}</p>
                  )}
                </div>
                
                {/* Campo oculto para mantener el enlace de compra (solo para el flujo de creación) */}
                {!itemToEdit && (
                  <input 
                    type="hidden" 
                    {...registerStepTwo('purchaseLink')}
                  />
                )}
              </div>
              

              
              {/* Barra de navegación fija inferior */}
              <div className="fixed bottom-0 left-0 right-0 max-w-[500px] mx-auto w-full flex justify-between bg-[#121212] p-4 border-t border-[#333] safe-area-bottom" style={{ zIndex: 40 }}>
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
  );
};

export default AddWishModal;