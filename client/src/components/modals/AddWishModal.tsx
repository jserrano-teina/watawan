import React, { useEffect, useRef, useState } from 'react';
import { WishItem } from '../../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const wishFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  purchaseLink: z.string().url('Debe ser una URL válida').min(1, 'El enlace de compra es obligatorio'),
  imageUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
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
      imageUrl: itemToEdit?.imageUrl || '',
    }
  });

  // Reset form when editing an item
  useEffect(() => {
    if (itemToEdit) {
      reset({
        title: itemToEdit.title,
        description: itemToEdit.description || '',
        purchaseLink: itemToEdit.purchaseLink,
        imageUrl: itemToEdit.imageUrl || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        purchaseLink: '',
        imageUrl: '',
      });
    }
  }, [itemToEdit, reset]);

  if (!isOpen) return null;

  const submitForm = (data: WishFormValues) => {
    onSubmit(data);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">
            {itemToEdit ? 'Editar deseo' : 'Añadir nuevo deseo'}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit(submitForm)} className="p-4">
          <div className="mb-4">
            <label htmlFor="title" className="block text-neutral-700 font-medium mb-1">
              Título
            </label>
            <input 
              type="text" 
              id="title" 
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent" 
              placeholder="¿Qué te gustaría recibir?"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-error text-sm mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-neutral-700 font-medium mb-1">
              Descripción (opcional)
            </label>
            <textarea 
              id="description" 
              rows={3} 
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent" 
              placeholder="Añade detalles como color, talla, modelo..."
              {...register('description')}
            ></textarea>
            {errors.description && (
              <p className="text-error text-sm mt-1">{errors.description.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="purchaseLink" className="block text-neutral-700 font-medium mb-1">
              Enlace de compra
            </label>
            <input 
              type="url" 
              id="purchaseLink" 
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent" 
              placeholder="https://..."
              {...register('purchaseLink')}
            />
            {errors.purchaseLink && (
              <p className="text-error text-sm mt-1">{errors.purchaseLink.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="imageUrl" className="block text-neutral-700 font-medium mb-1">
              URL de la imagen (opcional)
            </label>
            <input 
              type="url" 
              id="imageUrl" 
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent" 
              placeholder="https://ejemplo.com/imagen.jpg"
              {...register('imageUrl')}
            />
            {errors.imageUrl && (
              <p className="text-error text-sm mt-1">{errors.imageUrl.message}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
            >
              {itemToEdit ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWishModal;
