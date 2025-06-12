import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';

interface SharedData {
  title?: string;
  text?: string;
  url?: string;
  timestamp: number;
}

export function useNativeSharing() {
  const [sharedData, setSharedData] = useState<SharedData | null>(null);

  useEffect(() => {
    // Escuchar cuando se abre la app desde un intent de compartir
    const handleAppUrlOpen = (data: any) => {
      const url = data.url;
      
      // Extraer parámetros compartidos de la URL
      if (url && url.includes('shared=')) {
        try {
          const urlParams = new URLSearchParams(url.split('?')[1]);
          const sharedParam = urlParams.get('shared');
          
          if (sharedParam) {
            const parsedData = JSON.parse(decodeURIComponent(sharedParam));
            setSharedData({
              ...parsedData,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('Error parsing shared data:', error);
        }
      }
    };

    // Registrar listener para URLs de la app
    App.addListener('appUrlOpen', handleAppUrlOpen);

    // Verificar si hay datos compartidos al abrir
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleAppUrlOpen({ url: result.url });
      }
    });

    return () => {
      App.removeAllListeners();
    };
  }, []);

  const shareContent = async (content: { title: string; text?: string; url: string }) => {
    try {
      await Share.share({
        title: content.title,
        text: content.text || `Mira mi lista de deseos en WataWan`,
        url: content.url,
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  };

  const clearSharedData = () => {
    setSharedData(null);
  };

  return {
    sharedData,
    shareContent,
    clearSharedData,
    hasSharedData: !!sharedData
  };
}