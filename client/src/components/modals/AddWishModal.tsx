import React, { useEffect, useRef } from 'react';
import { WishItem } from '../../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const wishFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  purchaseLink: z.string().url('Debe ser una URL válida').min(1, 'El enlace de compra es obligatorio'),
});

type WishFormValues = z.infer<typeof wishFormSchema>;

interface AddWishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WishFormValues) => void;
  itemToEdit?: WishItem;
}

const AddWishModal: React.FC<AddWishModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  itemToEdit 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WishFormValues>({
    resolver: zodResolver(wishFormSchema),
    defaultValues: {
      title: itemToEdit?.title || '',
      description: itemToEdit?.description || '',
      purchaseLink: itemToEdit?.purchaseLink || '',
    }
  });

  // Reset form when editing an item
  useEffect(() => {
    if (itemToEdit) {
      reset({
        title: itemToEdit.title,
        description: itemToEdit.description || '',
        purchaseLink: itemToEdit.purchaseLink,
      });
    } else {
      reset({
        title: '',
        description: '',
        purchaseLink: '',
      });
    }
  }, [itemToEdit, reset]);

  if (!isOpen) return null;

  const submitForm = (data: WishFormValues) => {
    onSubmit(data);
    // Limpiar el formulario antes de cerrarlo
    reset({
      title: '',
      description: '',
      purchaseLink: '',
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#121212] min-h-screen overflow-auto"
    >
      <div ref={modalRef} className="flex flex-col h-full text-white">
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-[#333] bg-[#121212]">
          <h2 className="text-xl font-semibold">
            {itemToEdit ? 'Editar deseo' : 'Añadir nuevo deseo'}
          </h2>
          <button 
            onClick={() => {
              // Limpiar el formulario al cerrar el modal
              reset({
                title: '',
                description: '',
                purchaseLink: '',
              });
              onClose();
            }} 
            className="p-2 hover:bg-[#252525] rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit(submitForm)} className="flex-1 p-4">
          <div className="mb-6">
            <label htmlFor="title" className="block text-white font-medium mb-2">
              Título
            </label>
            <input 
              type="text" 
              id="title" 
              className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white" 
              placeholder="¿Qué te gustaría recibir?"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2">{errors.title.message}</p>
            )}
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
              {...register('description')}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-sm mt-2">{errors.description.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="purchaseLink" className="block text-white font-medium mb-2">
              Enlace de compra
            </label>
            <input 
              type="url" 
              id="purchaseLink" 
              className="w-full px-4 py-3 bg-[#252525] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-white" 
              placeholder="https://..."
              {...register('purchaseLink')}
            />
            {errors.purchaseLink && (
              <p className="text-red-500 text-sm mt-2">{errors.purchaseLink.message}</p>
            )}
          </div>
          
          {/* El campo de imagen ha sido eliminado, ahora se obtiene automáticamente del enlace de compra */}
          <div className="mb-6 px-4 py-3 bg-[#252525] rounded-lg border border-[#333]">
            <p className="text-sm text-gray-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              La imagen se extraerá automáticamente del enlace de compra
            </p>
          </div>
        </form>
        
        <div className="sticky bottom-0 flex justify-between p-4 bg-[#121212] border-t border-[#333]">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 border border-[#333] rounded-lg text-white font-medium hover:bg-[#252525] transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit(submitForm)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {itemToEdit ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWishModal;
