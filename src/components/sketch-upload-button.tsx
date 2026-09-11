'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { ImagePlus, Loader2 } from 'lucide-react';
import { processSketch, type SketchToCabinetOutput } from '@/ai/flows/sketch-to-cabinet-flow';
import { toast } from '@/hooks/use-toast';

interface SketchUploadButtonProps {
  onSuccess: (cabinetData: SketchToCabinetOutput) => void;
}

export function SketchUploadButton({ onSuccess }: SketchUploadButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      
      setIsProcessing(true);
      try {
        const result = await processSketch(base64String);
        toast({
          title: 'Boceto Procesado',
          description: `Se detectó un mueble de ${result.width}x${result.height}mm.`,
        });
        onSuccess(result);
      } catch (error) {
        console.error("Failed to process sketch:", error);
        toast({
          variant: 'destructive',
          title: 'Error al procesar boceto',
          description: 'La IA no pudo procesar la imagen. Inténtalo de nuevo con una imagen más clara.',
        });
      } finally {
        setIsProcessing(false);
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Error de Lectura',
        description: 'No se pudo leer el archivo de imagen.',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button 
        variant="outline" 
        className="w-full gap-2 mb-4" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImagePlus className="w-4 h-4" />
        )}
        {isProcessing ? 'Procesando boceto...' : 'Desde Boceto (IA)'}
      </Button>
    </>
  );
}
