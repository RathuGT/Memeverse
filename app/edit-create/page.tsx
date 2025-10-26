'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Type, Crop, Pen, Undo2, Redo2, Check, Trash2, Eye, EyeOff, Square, ChevronUp, ChevronDown } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Layer {
  id: number;
  name: string;
  type: 'image' | 'text' | 'draw' | 'vector';
  visible: boolean;
  selected: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  shape?: string;
  isBase?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
}

const MEME_TEMPLATES = [
  { id: 1, name: 'Drake Hotline', url: 'https://i.imgflip.com/30b1gx.jpg' },
  { id: 2, name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg' },
  { id: 3, name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg' },
  { id: 4, name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg' },
  { id: 5, name: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg' },
  { id: 6, name: 'Is This A Pigeon', url: 'https://i.imgflip.com/1o00in.jpg' },
  { id: 7, name: 'Left Exit 12', url: 'https://i.imgflip.com/22bdq6.jpg' },
  { id: 8, name: 'Waiting Skeleton', url: 'https://i.imgflip.com/2fm6x.jpg' },
  { id: 9, name: 'Woman Yelling at Cat', url: 'https://i.imgflip.com/345v97.jpg' },
  { id: 10, name: 'Bernie Sanders', url: 'https://i.imgflip.com/4x6d.jpg' },
  { id: 11, name: 'Disaster Girl', url: 'https://i.imgflip.com/23ls.jpg' },
  { id: 12, name: 'Mocking SpongeBob', url: 'https://i.imgflip.com/1otk96.jpg' }
];

const VECTOR_SHAPES = ['rectangle', 'circle', 'triangle', 'star', 'heart', 'arrow'];
const ASPECT_RATIOS = ['1:1', '4:3', '4:5', '5:4', '16:9', 'Custom'];
const DRAW_PATTERNS = ['solid', 'dashed', 'dotted'];
const CATEGORIES = ['Doremon', 'Bleach', 'Fight Club', 'Peter Thiel', 'Amy Schumer', 'Ranil', 'Animals', 'Work', 'Gaming', 'Sports'];
const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Impact', value: 'Impact, sans-serif' },
  { name: 'Comic Sans', value: 'Comic Sans MS, cursive' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' }
];

const MemeEditor = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        alert('Please log in to create memes');
        router.push('/login');
        return;
      }
      setUser(session.user);
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const [layers, setLayers] = useState<Layer[]>([
    { id: 0, name: 'Base Layer', type: 'image', visible: true, selected: false, x: 0, y: 0, width: 0, height: 0, isBase: true }
  ]);
  const nextLayerId = useRef(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showMemeTemplates, setShowMemeTemplates] = useState(false);
  const [showVectorShapes, setShowVectorShapes] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [warmth, setWarmth] = useState(50);
  const [hue, setHue] = useState(50);
  
  const [drawWeight, setDrawWeight] = useState(5);
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawPattern, setDrawPattern] = useState('solid');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<{x: number, y: number}[]>([]);
  
  const [caption, setCaption] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  
  const [aspectRatio, setAspectRatio] = useState('Custom');
  const [showCustomRatio, setShowCustomRatio] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 600 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [layerStart, setLayerStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [cropLayerId, setCropLayerId] = useState<number | null>(null);
  
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  
  const [history, setHistory] = useState<Layer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(layers)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const addTextLayer = () => {
    if (layers.length >= 20) {
      alert('Maximum 20 layers allowed');
      return;
    }
    saveToHistory();
    const newLayer: Layer = {
      id: nextLayerId.current++,
      name: `Text ${nextLayerId.current - 1}`,
      type: 'text',
      visible: true,
      selected: true,
      content: 'New Text',
      fontSize: 32,
      textAlign: 'left',
      fontFamily: 'Inter, sans-serif',
      x: 100,
      y: 100,
      width: 200,
      height: 50
    };
    setLayers(prev => [...prev.map(l => ({ ...l, selected: false })), newLayer]);
  };

  const addImageLayer = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (layers.length >= 20) {
      alert('Maximum 20 layers allowed');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      saveToHistory();
      const reader = new FileReader();
      reader.onload = (event) => {
        const newLayer: Layer = {
          id: nextLayerId.current++,
          name: file.name,
          type: 'image',
          visible: true,
          selected: true,
          content: event.target?.result as string,
          x: 50,
          y: 50,
          width: 250,
          height: 250
        };
        setLayers(prev => [...prev.map(l => ({ ...l, selected: false })), newLayer]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addVectorLayer = (shape: string) => {
    if (layers.length >= 20) {
      alert('Maximum 20 layers allowed');
      return;
    }
    saveToHistory();
    const newLayer: Layer = {
      id: nextLayerId.current++,
      name: `${shape.charAt(0).toUpperCase() + shape.slice(1)}`,
      type: 'vector',
      visible: true,
      selected: true,
      shape: shape,
      x: 150,
      y: 150,
      width: 120,
      height: 120
    };
    setLayers(prev => [...prev.map(l => ({ ...l, selected: false })), newLayer]);
  };

  const loadMemeTemplate = (templateUrl: string, templateName: string) => {
    if (layers.length >= 20) {
      alert('Maximum 20 layers allowed');
      return;
    }
    saveToHistory();
    const newLayer: Layer = {
      id: nextLayerId.current++,
      name: templateName,
      type: 'image',
      visible: true,
      selected: true,
      content: templateUrl,
      x: 50,
      y: 50,
      width: 400,
      height: 400
    };
    setLayers(prev => [...prev.map(l => ({ ...l, selected: false })), newLayer]);
    setShowMemeTemplates(false);
  };

  const deleteLayer = (layerId: number) => {
    if (layerId === 0) return;
    saveToHistory();
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
  };

  const toggleLayerSelection = (layerId: number) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, selected: !layer.selected } : layer
    ));
  };

  const toggleLayerVisibility = (layerId: number) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const selectAllLayers = () => {
    const nonBaseLayers = layers.filter(l => l.id !== 0);
    const allSelected = nonBaseLayers.every(l => l.selected);
    setLayers(prev => prev.map(layer => 
      layer.id === 0 ? layer : { ...layer, selected: !allSelected }
    ));
  };

  const bringForward = (layerId: number) => {
    if (layerId === 0) return;
    saveToHistory();
    setLayers(prev => {
      const currentIndex = prev.findIndex(l => l.id === layerId);
      if (currentIndex === prev.length - 1) return prev;
      const newLayers = [...prev];
      const [layer] = newLayers.splice(currentIndex, 1);
      newLayers.splice(currentIndex + 1, 0, layer);
      return newLayers;
    });
  };

  const sendBackward = (layerId: number) => {
    if (layerId === 0) return;
    saveToHistory();
    setLayers(prev => {
      const currentIndex = prev.findIndex(l => l.id === layerId);
      if (currentIndex === 0 || (currentIndex === 1 && prev[0].isBase)) return prev;
      const newLayers = [...prev];
      const [layer] = newLayers.splice(currentIndex, 1);
      newLayers.splice(currentIndex - 1, 0, layer);
      return newLayers;
    });
  };

  const startEditingText = (layerId: number) => {
    const layer = layers.find(l => l.id === layerId && l.type === 'text');
    if (layer) {
      setEditingTextId(layerId);
      setEditingTextValue(layer.content || '');
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  };

  const finishEditingText = () => {
    if (editingTextId !== null) {
      saveToHistory();
      setLayers(prev => prev.map(l => 
        l.id === editingTextId ? { ...l, content: editingTextValue } : l
      ));
      setEditingTextId(null);
      setEditingTextValue('');
    }
  };

  const changeTextAlignment = (layerId: number, alignment: 'left' | 'center' | 'right') => {
    saveToHistory();
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, textAlign: alignment } : l
    ));
  };

  const changeFontSize = (layerId: number, fontSize: number) => {
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, fontSize } : l
    ));
  };

  const changeFontFamily = (layerId: number, fontFamily: string) => {
    saveToHistory();
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, fontFamily } : l
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, layerId: number, action: 'drag' | 'resize', direction?: string) => {
    if (selectedTool === 'crop') return;
    e.preventDefault();
    e.stopPropagation();
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setLayerStart({ x: layer.x, y: layer.y, width: layer.width, height: layer.height });
    } else if (action === 'resize' && direction) {
      setIsResizing(true);
      setResizeDirection(direction);
      setDragStart({ x: e.clientX, y: e.clientY });
      setLayerStart({ x: layer.x, y: layer.y, width: layer.width, height: layer.height });
    }

    setLayers(prev => prev.map(l => ({ ...l, selected: l.id === layerId })));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;

    const selectedLayer = layers.find(l => l.selected && !l.isBase);
    if (!selectedLayer) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (isDragging) {
      setLayers(prev => prev.map(layer => {
        if (layer.id === selectedLayer.id) {
          return {
            ...layer,
            x: layerStart.x + deltaX,
            y: layerStart.y + deltaY
          };
        }
        return layer;
      }));
    } else if (isResizing) {
      setLayers(prev => prev.map(layer => {
        if (layer.id === selectedLayer.id) {
          let newX = layer.x;
          let newY = layer.y;
          let newWidth = layer.width;
          let newHeight = layer.height;

          switch (resizeDirection) {
            case 'se':
              newWidth = Math.max(20, layerStart.width + deltaX);
              newHeight = Math.max(20, layerStart.height + deltaY);
              break;
            case 'sw':
              newWidth = Math.max(20, layerStart.width - deltaX);
              newHeight = Math.max(20, layerStart.height + deltaY);
              newX = layerStart.x + (layerStart.width - newWidth);
              break;
            case 'ne':
              newWidth = Math.max(20, layerStart.width + deltaX);
              newHeight = Math.max(20, layerStart.height - deltaY);
              newY = layerStart.y + (layerStart.height - newHeight);
              break;
            case 'nw':
              newWidth = Math.max(20, layerStart.width - deltaX);
              newHeight = Math.max(20, layerStart.height - deltaY);
              newX = layerStart.x + (layerStart.width - newWidth);
              newY = layerStart.y + (layerStart.height - newHeight);
              break;
            case 'e':
              newWidth = Math.max(20, layerStart.width + deltaX);
              break;
            case 'w':
              newWidth = Math.max(20, layerStart.width - deltaX);
              newX = layerStart.x + (layerStart.width - newWidth);
              break;
            case 'n':
              newHeight = Math.max(20, layerStart.height - deltaY);
              newY = layerStart.y + (layerStart.height - newHeight);
              break;
            case 's':
              newHeight = Math.max(20, layerStart.height + deltaY);
              break;
          }

          return { ...layer, x: newX, y: newY, width: newWidth, height: newHeight };
        }
        return layer;
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      saveToHistory();
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (selectedTool !== 'draw') return;

    const target = e.target as HTMLElement;
    if (target.closest('[data-layer-id]')) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setDrawPoints([{ x, y }]);
  };

  const continueDrawing = (e: React.MouseEvent) => {
    if (!isDrawing || selectedTool !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawPoints(prev => [...prev, { x, y }]);
  };

  const finishDrawing = () => {
    if (!isDrawing || drawPoints.length < 2) {
      setIsDrawing(false);
      setDrawPoints([]);
      return;
    }

    saveToHistory();

    const minX = Math.min(...drawPoints.map(p => p.x));
    const minY = Math.min(...drawPoints.map(p => p.y));
    const maxX = Math.max(...drawPoints.map(p => p.x));
    const maxY = Math.max(...drawPoints.map(p => p.y));

    const pathData = drawPoints.map((point, index) => {
      const relativeX = point.x - minX;
      const relativeY = point.y - minY;
      return `${index === 0 ? 'M' : 'L'} ${relativeX} ${relativeY}`;
    }).join(' ');

    const newLayer: Layer = {
      id: nextLayerId.current++,
      name: `Drawing ${nextLayerId.current - 1}`,
      type: 'draw',
      visible: true,
      selected: true,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      content: pathData
    };

    setLayers(prev => [...prev.map(l => ({ ...l, selected: false })), newLayer]);
    setIsDrawing(false);
    setDrawPoints([]);
  };

  const startCrop = (e: React.MouseEvent, layerId: number) => {
    if (selectedTool !== 'crop') return;
    e.preventDefault();
    e.stopPropagation();
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.isBase) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsCropping(true);
    setCropLayerId(layerId);
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setLayers(prev => prev.map(l => ({ ...l, selected: l.id === layerId })));
  };

  const updateCrop = (e: React.MouseEvent) => {
    if (!isCropping || selectedTool !== 'crop') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropEnd({ x, y });
  };

  const getCropRect = () => {
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    return { x, y, width, height };
  };

  const applyCrop = () => {
    if (!isCropping || cropLayerId === null) return;
    
    const layer = layers.find(l => l.id === cropLayerId);
    if (!layer || layer.type === 'text') return;
    
    saveToHistory();
    
    const cropX = Math.min(cropStart.x, cropEnd.x);
    const cropY = Math.min(cropStart.y, cropEnd.y);
    const cropWidth = Math.abs(cropEnd.x - cropStart.x);
    const cropHeight = Math.abs(cropEnd.y - cropStart.y);
    
    if (cropWidth < 10 || cropHeight < 10) {
      setIsCropping(false);
      setCropLayerId(null);
      return;
    }
    
    if (layer.type === 'image' && layer.content) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        const relativeX = Math.max(0, cropX - layer.x);
        const relativeY = Math.max(0, cropY - layer.y);
        const relativeCropWidth = Math.min(cropWidth, layer.width - relativeX);
        const relativeCropHeight = Math.min(cropHeight, layer.height - relativeY);
        
        const scaleX = img.width / layer.width;
        const scaleY = img.height / layer.height;
        
        const sourceX = relativeX * scaleX;
        const sourceY = relativeY * scaleY;
        const sourceWidth = relativeCropWidth * scaleX;
        const sourceHeight = relativeCropHeight * scaleY;
        
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        
        ctx?.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, sourceWidth, sourceHeight
        );
        
        const croppedContent = canvas.toDataURL();
        
        setLayers(prev => prev.map(l => {
          if (l.id === cropLayerId) {
            return {
              ...l,
              content: croppedContent,
              x: cropX,
              y: cropY,
              width: cropWidth,
              height: cropHeight
            };
          }
          return l;
        }));
        
        setIsCropping(false);
        setCropLayerId(null);
      };
      
      img.src = layer.content!;
    } else if (layer.type === 'vector') {
      setLayers(prev => prev.map(l => {
        if (l.id === cropLayerId) {
          return {
            ...l,
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight
          };
        }
        return l;
      }));
      
      setIsCropping(false);
      setCropLayerId(null);
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setCropLayerId(null);
  };

  const exportAndUploadMeme = async () => {
    if (!user) {
      alert('You must be logged in to post memes');
      return;
    }

    if (!caption.trim()) {
      alert('Please add a title/caption for your meme');
      return;
    }

    setIsUploading(true);
    
    try {
      const QUALITY_MULTIPLIER = 3;
      
      // Create high-quality canvas export
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasDimensions.width * QUALITY_MULTIPLIER;
      exportCanvas.height = canvasDimensions.height * QUALITY_MULTIPLIER;
      const ctx = exportCanvas.getContext('2d', { 
        alpha: false,
        desynchronized: false,
        willReadFrequently: false
      });
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.scale(QUALITY_MULTIPLIER, QUALITY_MULTIPLIER);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Render all layers
      for (const layer of layers) {
        if (!layer.visible || layer.isBase) continue;

        if (layer.type === 'image' && layer.content) {
          await new Promise<void>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              ctx.save();
              
              const imgAspect = img.width / img.height;
              const layerAspect = layer.width / layer.height;
              
              let drawWidth = layer.width;
              let drawHeight = layer.height;
              let offsetX = 0;
              let offsetY = 0;
              
              if (imgAspect > layerAspect) {
                drawHeight = layer.width / imgAspect;
                offsetY = (layer.height - drawHeight) / 2;
              } else {
                drawWidth = layer.height * imgAspect;
                offsetX = (layer.width - drawWidth) / 2;
              }
              
              ctx.drawImage(img, layer.x + offsetX, layer.y + offsetY, drawWidth, drawHeight);
              ctx.restore();
              resolve();
            };
            img.onerror = () => {
              console.error('Failed to load image layer:', layer.name);
              resolve();
            };
            img.src = layer.content!;
          });
        } else if (layer.type === 'text' && layer.content) {
          ctx.save();
          ctx.font = `bold ${layer.fontSize}px ${layer.fontFamily || 'Inter, sans-serif'}`;
          ctx.fillStyle = '#000000';
          ctx.textAlign = layer.textAlign || 'left';
          ctx.textBaseline = 'top';
          
          const lines = layer.content.split('\n');
          const lineHeight = layer.fontSize! * 1.2;
          
          lines.forEach((line, index) => {
            let x = layer.x;
            if (layer.textAlign === 'center') {
              x = layer.x + layer.width / 2;
            } else if (layer.textAlign === 'right') {
              x = layer.x + layer.width;
            }
            ctx.fillText(line, x, layer.y + (index * lineHeight));
          });
          ctx.restore();
        } else if (layer.type === 'vector' && layer.shape) {
          ctx.save();
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 2;
          ctx.translate(layer.x, layer.y);
          
          switch(layer.shape) {
            case 'rectangle':
              ctx.strokeRect(4, 4, layer.width - 8, layer.height - 8);
              break;
            case 'circle':
              ctx.beginPath();
              ctx.arc(layer.width/2, layer.height/2, Math.min(layer.width, layer.height)/2 - 4, 0, Math.PI * 2);
              ctx.stroke();
              break;
            case 'triangle':
              ctx.beginPath();
              ctx.moveTo(layer.width/2, 4);
              ctx.lineTo(layer.width - 4, layer.height - 4);
              ctx.lineTo(4, layer.height - 4);
              ctx.closePath();
              ctx.stroke();
              break;
            case 'star':
              const cx = layer.width/2, cy = layer.height/2;
              const r1 = Math.min(layer.width, layer.height)/2 - 4;
              const r2 = r1/2;
              ctx.beginPath();
              for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI / 5) - Math.PI / 2;
                const r = i % 2 === 0 ? r1 : r2;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.stroke();
              break;
            case 'heart':
              const w = layer.width, h = layer.height;
              ctx.beginPath();
              ctx.moveTo(w/2, h*0.9);
              ctx.bezierCurveTo(w*0.1, h*0.5, w*0.1, h*0.1, w/2, h*0.3);
              ctx.bezierCurveTo(w*0.9, h*0.1, w*0.9, h*0.5, w/2, h*0.9);
              ctx.stroke();
              break;
            case 'arrow':
              ctx.beginPath();
              ctx.moveTo(4, layer.height/2);
              ctx.lineTo(layer.width - 20, layer.height/2);
              ctx.moveTo(layer.width - 30, layer.height * 0.25);
              ctx.lineTo(layer.width - 4, layer.height/2);
              ctx.lineTo(layer.width - 30, layer.height * 0.75);
              ctx.stroke();
              break;
          }
          ctx.restore();
        } else if (layer.type === 'draw' && layer.content) {
          ctx.save();
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = drawWeight;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.translate(layer.x, layer.y);
          
          const path = new Path2D(layer.content);
          ctx.stroke(path);
          ctx.restore();
        }
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });

      // Upload to Supabase Storage
      const fileName = `meme-${user.id}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meme-images')
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meme-images')
        .getPublicUrl(fileName);

      // Save meme to database
      const { data: memeData, error: memeError } = await supabase
        .from('meme')
        .insert({
          creator_id: user.id,
          title: caption,
          description: null,
          image_url: publicUrl,
          thumbnail_url: publicUrl,
          category_id: null,
          is_published: true,
          is_featured: false,
          views_count: 0,
          smiles_count: 0,
          comments_count: 0,
          shares_count: 0,
          visibility: 'public'
        })
        .select()
        .single();

      if (memeError) {
        throw new Error(`Failed to save meme: ${memeError.message}`);
      }

      // Update user's total memes count
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('total_memes_created')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          await supabase
           .from('user_profiles')
           .update({ 
             total_memes_created: (profile.total_memes_created || 0) + 1
           })
            .eq('user_id', user.id);
        }

alert('Meme posted successfully! 🎉');
router.push('/');
      
    } catch (error) {
      console.error('Error uploading meme:', error);
      alert(`Failed to post meme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories(prev => [...prev, category]);
    }
  };

  const addCategory = () => {
    if (categoryInput.trim() && !selectedCategories.includes(categoryInput.trim()) && selectedCategories.length < 5) {
      setSelectedCategories(prev => [...prev, categoryInput.trim()]);
      setCategoryInput('');
    }
  };

  const handleCustomRatio = () => {
    if (customWidth && customHeight) {
      const ratio = `${customWidth}:${customHeight}`;
      setAspectRatio(ratio);
      applyAspectRatio(Number(customWidth), Number(customHeight));
      setShowCustomRatio(false);
    }
  };

  const applyAspectRatio = (widthRatio: number, heightRatio: number) => {
    const maxWidth = 600;
    const maxHeight = 600;
    
    let newWidth, newHeight;
    
    if (widthRatio / heightRatio > 1) {
      newWidth = maxWidth;
      newHeight = (maxWidth / widthRatio) * heightRatio;
    } else {
      newHeight = maxHeight;
      newWidth = (maxHeight / heightRatio) * widthRatio;
    }
    
    setCanvasDimensions({ width: Math.round(newWidth), height: Math.round(newHeight) });
  };

  const handleAspectRatioClick = (ratio: string) => {
    if (ratio === 'Custom') {
      setShowCustomRatio(!showCustomRatio);
      setAspectRatio(ratio);
    } else {
      setAspectRatio(ratio);
      setShowCustomRatio(false);
      
      const [w, h] = ratio.split(':').map(Number);
      applyAspectRatio(w, h);
    }
  };

  const renderVectorShape = (shape: string, width: number, height: number) => {
    const props = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, className: 'text-gray-700' };
    
    switch(shape) {
      case 'rectangle':
        return <rect x="4" y="4" width={width-8} height={height-8} {...props} />;
      case 'circle':
        return <circle cx={width/2} cy={height/2} r={Math.min(width, height)/2-4} {...props} />;
      case 'triangle':
        return <polygon points={`${width/2},4 ${width-4},${height-4} 4,${height-4}`} {...props} />;
      case 'star':
        const cx = width/2, cy = height/2, r1 = Math.min(width, height)/2-4, r2 = r1/2;
        const points = Array.from({length: 10}, (_, i) => {
          const angle = (i * Math.PI / 5) - Math.PI / 2;
          const r = i % 2 === 0 ? r1 : r2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon points={points} {...props} />;
      case 'heart':
        const w = width, h = height;
        return <path d={`M${w/2},${h*0.9} C${w*0.1},${h*0.5} ${w*0.1},${h*0.1} ${w/2},${h*0.3} C${w*0.9},${h*0.1} ${w*0.9},${h*0.5} ${w/2},${h*0.9}`} {...props} />;
      case 'arrow':
        return <path d={`M4,${height/2} L${width-20},${height/2} M${width-30},${height*0.25} L${width-4},${height/2} L${width-30},${height*0.75}`} {...props} />;
      default:
        return null;
    }
  };

  const selectedLayersCount = layers.filter(l => l.selected && l.id !== 0).length;
  const allLayersSelected = layers.filter(l => l.id !== 0).every(l => l.selected) && layers.length > 1;

  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Create meme</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Image size={18} />
              Add image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={addImageLayer}
            />
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              onClick={undo} 
              disabled={historyIndex <= 0}
            >
              <Undo2 size={20} className={historyIndex <= 0 ? 'text-gray-300' : 'text-gray-700'} />
            </button>
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 size={20} className={historyIndex >= history.length - 1 ? 'text-gray-300' : 'text-gray-700'} />
            </button>
            <button 
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Tools */}
          <div className="w-56 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-4 space-y-4">
              {/* Meme Templates */}
              <button 
                onClick={() => setShowMemeTemplates(!showMemeTemplates)}
                className="w-full py-2 text-sm font-medium text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Choose Meme
              </button>

              {showMemeTemplates && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded-lg max-h-80 overflow-y-auto">
                  {MEME_TEMPLATES.map(template => (
                    <div 
                      key={template.id}
                      onClick={() => loadMemeTemplate(template.url, template.name)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img 
                        src={template.url} 
                        alt={template.name}
                        className="w-full h-24 object-cover rounded border border-gray-300"
                      />
                      <p className="text-xs text-gray-600 mt-1 truncate text-center">{template.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Tool */}
              <div>
                <button 
                  onClick={() => {
                    addTextLayer();
                    setSelectedTool('text');
                  }}
                  className={`flex items-center gap-2 text-sm font-medium w-full text-left ${selectedTool === 'text' ? 'text-blue-600' : 'text-black'}`}
                >
                  <Type size={18} />
                  Add Text
                </button>

                {selectedTool === 'text' && layers.find(l => l.selected && l.type === 'text') && (
                  <div className="ml-6 mt-2 space-y-3">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Font</div>
                      <select
                        value={layers.find(l => l.selected && l.type === 'text')?.fontFamily || 'Inter, sans-serif'}
                        onChange={(e) => {
                          const textLayer = layers.find(l => l.selected && l.type === 'text');
                          if (textLayer) changeFontFamily(textLayer.id, e.target.value);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        {FONT_FAMILIES.map(font => (
                          <option key={font.value} value={font.value}>{font.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-xs text-gray-600 mb-1">Font Size</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="12"
                          max="72"
                          value={layers.find(l => l.selected && l.type === 'text')?.fontSize || 32}
                          onChange={(e) => {
                            const textLayer = layers.find(l => l.selected && l.type === 'text');
                            if (textLayer) changeFontSize(textLayer.id, Number(e.target.value));
                          }}
                          className="flex-1 h-1 bg-gray-300 rounded-lg"
                        />
                        <span className="text-xs text-gray-500 w-8">
                          {layers.find(l => l.selected && l.type === 'text')?.fontSize || 32}px
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-600 mb-1">Alignment</div>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button
                            key={align}
                            onClick={() => {
                              const textLayer = layers.find(l => l.selected && l.type === 'text');
                              if (textLayer) changeTextAlignment(textLayer.id, align);
                            }}
                            className={`flex-1 px-2 py-1 text-xs rounded border transition-colors capitalize ${
                              layers.find(l => l.selected && l.type === 'text')?.textAlign === align
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Crop Tool */}
              <button 
                onClick={() => {
                  const newTool = selectedTool === 'crop' ? null : 'crop';
                  setSelectedTool(newTool);
                  if (newTool !== 'crop') {
                    cancelCrop();
                  }
                }}
                className={`flex items-center gap-2 text-sm font-medium ${selectedTool === 'crop' ? 'text-blue-600' : 'text-black'}`}
              >
                <Crop size={18} />
                Crop
              </button>

              {selectedTool === 'crop' && (
                <div className="ml-6 text-xs text-gray-600 space-y-1">
                  <p>• Select a layer</p>
                  <p>• Drag to define crop area</p>
                  <p>• Click Apply to crop</p>
                </div>
              )}

              {/* Vector Shapes */}
              <div>
                <button
                  onClick={() => setShowVectorShapes(!showVectorShapes)}
                  className={`flex items-center gap-2 text-sm font-medium mb-2 ${showVectorShapes ? 'text-blue-600' : 'text-black'}`}
                >
                  <Square size={18} />
                  Vectors
                </button>

                {showVectorShapes && (
                  <div className="ml-6 grid grid-cols-2 gap-2">
                    {VECTOR_SHAPES.map(shape => (
                      <button
                        key={shape}
                        onClick={() => addVectorLayer(shape)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors capitalize"
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Draw Tool */}
              <div>
                <button
                  onClick={() => setSelectedTool(selectedTool === 'draw' ? null : 'draw')}
                  className={`flex items-center gap-2 text-sm font-medium mb-2 ${selectedTool === 'draw' ? 'text-blue-600' : 'text-black'}`}
                >
                  <Pen size={18} />
                  Draw
                </button>

                {selectedTool === 'draw' && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Weight</label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={drawWeight}
                        onChange={(e) => setDrawWeight(Number(e.target.value))}
                        className="w-full h-1 bg-gray-300 rounded-lg"
                      />
                      <span className="text-xs text-gray-500">{drawWeight}px</span>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Color</label>
                      <input
                        type="color"
                        value={drawColor}
                        onChange={(e) => setDrawColor(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Pattern</label>
                      <select 
                        value={drawPattern}
                        onChange={(e) => setDrawPattern(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        {DRAW_PATTERNS.map(pattern => (
                          <option key={pattern} value={pattern}>{pattern}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Adjustments */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  Adjustments {selectedLayersCount > 0 && `(${selectedLayersCount} selected)`}
                </div>

                <div>
                  <label className="block text-xs text-gray-700 mb-1">Brightness</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-700 mb-1">Contrast</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-700 mb-1">Warmth</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={warmth}
                    onChange={(e) => setWarmth(Number(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-700 mb-1">Hue</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={hue}
                    onChange={(e) => setHue(Number(e.target.value))}
                    className="w-full h-1 bg-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 bg-gray-100 p-6 overflow-auto flex items-center justify-center min-w-0">
            <div 
              ref={canvasRef}
              onMouseMove={(e) => {
                if (isCropping) {
                  updateCrop(e);
                } else if (isDrawing) {
                  continueDrawing(e);
                } else {
                  handleMouseMove(e);
                }
              }}
              onMouseUp={() => {
                if (isDrawing) {
                  finishDrawing();
                } else if (!isCropping) {
                  handleMouseUp();
                }
              }}
              onMouseLeave={() => {
                if (!isCropping && !isDrawing) {
                  handleMouseUp();
                }
              }}
              onMouseDown={(e) => {
                if (selectedTool === 'draw') {
                  startDrawing(e);
                }
              }}
              className="bg-white rounded-lg w-full max-w-2xl relative shadow-lg border border-gray-300 overflow-hidden"
              style={{ 
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
                userSelect: 'none', 
                cursor: selectedTool === 'draw' ? 'crosshair' : 'default' 
              }}
            >
              {/* Render Layers */}
              {layers.map(layer => {
                if (!layer.visible || layer.isBase) return null;
                
                return (
                  <div
                    key={layer.id}
                    data-layer-id={layer.id}
                    className={`absolute ${layer.selected ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: `${layer.x}px`,
                      top: `${layer.y}px`,
                      width: `${layer.width}px`,
                      height: `${layer.height}px`,
                      cursor: selectedTool === 'crop' ? 'crosshair' : (isDragging ? 'move' : 'pointer')
                    }}
                    onMouseDown={(e) => {
                      if (selectedTool === 'crop') {
                        startCrop(e, layer.id);
                      } else if (selectedTool === 'draw') {
                        e.stopPropagation();
                        handleMouseDown(e, layer.id, 'drag');
                      } else {
                        handleMouseDown(e, layer.id, 'drag');
                      }
                    }}
                    onDoubleClick={() => {
                      if (layer.type === 'text') {
                        startEditingText(layer.id);
                      }
                    }}
                  >
                    {layer.type === 'image' && layer.content && (
                      <img 
                        src={layer.content} 
                        alt={layer.name}
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                        style={layer.selected ? {
                          filter: `brightness(${brightness / 50}) contrast(${contrast / 50}) saturate(${warmth / 50}) hue-rotate(${(hue - 50) * 3.6}deg)`
                        } : undefined}
                      />
                    )}
                    
                    {layer.type === 'text' && editingTextId === layer.id ? (
                      <textarea
                        ref={textInputRef}
                        value={editingTextValue}
                        onChange={(e) => setEditingTextValue(e.target.value)}
                        onBlur={finishEditingText}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            finishEditingText();
                          }
                          if (e.key === 'Escape') {
                            setEditingTextId(null);
                            setEditingTextValue('');
                          }
                        }}
                        className="w-full h-full text-gray-900 font-bold bg-transparent border-2 border-blue-500 px-2 py-1 outline-none resize-none overflow-hidden"
                        style={{ 
                          fontSize: `${layer.fontSize}px`,
                          fontFamily: layer.fontFamily || 'Inter, sans-serif',
                          textAlign: layer.textAlign || 'left',
                          lineHeight: '1.2'
                        }}
                      />
                    ) : layer.type === 'text' ? (
                      <div 
                        className="text-gray-900 font-bold pointer-events-none w-full h-full overflow-hidden"
                        style={{ 
                          fontSize: `${layer.fontSize}px`,
                          fontFamily: layer.fontFamily || 'Inter, sans-serif',
                          textAlign: layer.textAlign || 'left',
                          lineHeight: '1.2',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word'
                        }}
                      >
                        {layer.content}
                      </div>
                    ) : null}
                    
                    {layer.type === 'vector' && layer.shape && (
                      <svg 
                        width={layer.width} 
                        height={layer.height}
                        viewBox={`0 0 ${layer.width} ${layer.height}`}
                        className="pointer-events-none"
                      >
                        {renderVectorShape(layer.shape, layer.width, layer.height)}
                      </svg>
                    )}
                    
                    {layer.type === 'draw' && layer.content && (
                      <svg 
                        width={layer.width} 
                        height={layer.height}
                        viewBox={`0 0 ${layer.width} ${layer.height}`}
                        className="pointer-events-none"
                      >
                        <path
                          d={layer.content}
                          stroke={drawColor}
                          strokeWidth={drawWeight}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                          strokeDasharray={drawPattern === 'dashed' ? '5,5' : drawPattern === 'dotted' ? '2,2' : 'none'}
                        />
                      </svg>
                    )}

                    {/* Resize Handles */}
                    {layer.selected && selectedTool !== 'crop' && (
                      <>
                        <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize" style={{ top: -6, left: -6 }} onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'nw')} />
                        <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize" style={{ top: -6, right: -6 }} onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'ne')} />
                        <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize" style={{ bottom: -6, left: -6 }} onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'sw')} />
                        <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize" style={{ bottom: -6, right: -6 }} onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'se')} />
                        <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize" style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }} onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'n')} />
                        <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize" style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }} onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 's')} />
                        <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize" style={{ top: '50%', left: -6, transform: 'translateY(-50%)' }} onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'w')} />
                        <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize" style={{ top: '50%', right: -6, transform: 'translateY(-50%)' }} onMouseDown={(e) => handleMouseDown(e, layer.id, 'resize', 'e')} />
                      </>
                    )}
                  </div>
                );
              })}

              {/* Crop Overlay */}
              {isCropping && selectedTool === 'crop' && (
                <>
                  <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />
                  <div
                    className="absolute border-2 border-blue-500 bg-transparent pointer-events-none"
                    style={{
                      left: `${getCropRect().x}px`,
                      top: `${getCropRect().y}px`,
                      width: `${getCropRect().width}px`,
                      height: `${getCropRect().height}px`,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    <div className="absolute inset-0 border-2 border-dashed border-white"></div>
                  </div>

                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                    <button 
                      onClick={applyCrop} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Apply Crop
                    </button>
                    <button 
                      onClick={cancelCrop} 
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Draw Preview */}
              {isDrawing && drawPoints.length > 0 && (
                <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                  <path
                    d={drawPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')}
                    stroke={drawColor}
                    strokeWidth={drawWeight}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    strokeDasharray={drawPattern === 'dashed' ? '5,5' : drawPattern === 'dotted' ? '2,2' : 'none'}
                  />
                </svg>
              )}
              
              {/* Empty State */}
              {layers.length === 1 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                  <div className="text-center">
                    <Image size={48} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Add images, text, or vectors</p>
                    <p className="text-xs mt-1">Base layer (white background)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Layers & Settings */}
          <div className="w-60 border-l border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm text-black font-semibold">Layers ({layers.length}/20)</h3>
                <button 
                  onClick={selectAllLayers} 
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  {allLayersSelected && <Check size={12} />}
                  Select all
                </button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {[...layers].reverse().map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => !layer.isBase && toggleLayerSelection(layer.id)}
                    className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                      layer.isBase 
                        ? 'bg-gray-50 cursor-not-allowed opacity-60' 
                        : layer.selected 
                        ? 'bg-blue-50 border border-blue-200 cursor-pointer' 
                        : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                      layer.selected ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
                    } ${layer.isBase ? 'opacity-50' : ''}`}>
                      {layer.selected && <Check size={10} className="text-white" />}
                    </div>

                    <span className="flex-1 truncate text-gray-700 min-w-0">
                      {layer.name}{layer.isBase && ' (Base)'}
                    </span>

                    {!layer.isBase && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); bringForward(layer.id); }} 
                          className="p-0.5 flex-shrink-0 hover:bg-gray-200 rounded" 
                          title="Bring forward"
                        >
                          <ChevronUp size={14} className="text-gray-600" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); sendBackward(layer.id); }} 
                          className="p-0.5 flex-shrink-0 hover:bg-gray-200 rounded" 
                          title="Send backward"
                        >
                          <ChevronDown size={14} className="text-gray-600" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} 
                          className="p-0.5 flex-shrink-0 hover:bg-gray-200 rounded" 
                          title="Toggle visibility"
                        >
                          {layer.visible ? (
                            <Eye size={14} className="text-gray-600" />
                          ) : (
                            <EyeOff size={14} className="text-gray-400" />
                          )}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} 
                          className="p-0.5 flex-shrink-0 hover:bg-red-100 rounded" 
                          title="Delete layer"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button 
                    key={ratio} 
                    onClick={() => handleAspectRatioClick(ratio)} 
                    className={`py-1.5 text-xs text-black rounded border transition-colors ${
                      aspectRatio === ratio 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {showCustomRatio && (
                <div className="space-y-2 p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="W" 
                      value={customWidth} 
                      onChange={(e) => setCustomWidth(e.target.value)} 
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded" 
                    />
                    <span className="text-xs">:</span>
                    <input 
                      type="number" 
                      placeholder="H" 
                      value={customHeight} 
                      onChange={(e) => setCustomHeight(e.target.value)} 
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded" 
                    />
                  </div>
                  <button 
                    onClick={handleCustomRatio} 
                    className="w-full py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm text-black font-semibold mb-2">
                Select categories ({selectedCategories.length}/5)
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CATEGORIES.map((category) => (
                  <button 
                    key={category} 
                    onClick={() => toggleCategory(category)} 
                    disabled={!selectedCategories.includes(category) && selectedCategories.length >= 5} 
                    className={`px-2 py-1 text-xs text-black rounded transition-colors ${
                      selectedCategories.includes(category) 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex gap-1">
                <input 
                  type="text" 
                  placeholder="Add or search" 
                  value={categoryInput} 
                  onChange={(e) => setCategoryInput(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()} 
                  disabled={selectedCategories.length >= 5} 
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100" 
                />
                <button 
                  onClick={addCategory} 
                  disabled={selectedCategories.length >= 5} 
                  className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Search for similar titles</p>
            </div>

            {/* Caption */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold mb-2">
                Add a title ({caption.length}/50) *
              </h3>
              <textarea 
                value={caption} 
                onChange={(e) => e.target.value.length <= 50 && setCaption(e.target.value)} 
                maxLength={50} 
                placeholder="Give your meme a title..." 
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" 
                rows={3} 
              />
              <p className="text-xs text-gray-500 mt-1">* Required</p>
            </div>

            {/* Tags */}
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-2">Tag your mates</h3>
              <input 
                type="text" 
                placeholder="Search followers/following..." 
                value={tagInput} 
                onChange={(e) => setTagInput(e.target.value)} 
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
              <p className="text-xs text-gray-500 mt-1.5">Search from your network</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 flex justify-end flex-shrink-0">
          <button 
            onClick={exportAndUploadMeme} 
            disabled={isUploading || !caption.trim()} 
            className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Posting...' : 'Post meme'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemeEditor;