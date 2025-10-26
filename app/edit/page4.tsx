'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Crop, Edit3, RotateCcw, RotateCw, Image as LucideImage, ImagePlus, X, Upload, Trash2, Eye, EyeOff } from 'lucide-react';

interface Layer {
  id: string;
  type: 'image' | 'text' | 'drawing';
  name: string;
  visible: boolean;
  selected: boolean;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string; // For text layers
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  imageData?: string; // For image layers
  paths?: Array<{x: number, y: number, isStart: boolean}>; // For drawing layers
  strokeWidth?: number;
  strokeColor?: string;
  isEditing?: boolean; // For text editing
  brightness?: number;
  contrast?: number;
  warmth?: number;
  hue?: number;
}

interface Template {
  id: string;
  name: string;
  imageUrl: string;
}

export default function MemeEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: '1',
      type: 'image',
      name: 'background.jpg',
      visible: true,
      selected: false,
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCI+U2FtcGxlIEltYWdlPC90ZXh0Pjwvc3ZnPg==',
      brightness: 50,
      contrast: 50,
      warmth: 50,
      hue: 50
    }
  ]);

  const [currentTool, setCurrentTool] = useState<'select' | 'text' | 'draw' | 'crop'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawWeight, setDrawWeight] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [tagSearch, setTagSearch] = useState('');
  const [undoStack, setUndoStack] = useState<Layer[][]>([]);
  const [redoStack, setRedoStack] = useState<Layer[][]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const templates: Template[] = [
    { id: '1', name: 'Drake Template', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmZjk5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIxOCI+RHJha2UgVGVtcGxhdGU8L3RleHQ+PC9zdmc+' },
    { id: '2', name: 'Distracted Boyfriend', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmY2M5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIxNiI+RGlzdHJhY3RlZCBCb3lmcmllbmQ8L3RleHQ+PC9zdmc+' },
    { id: '3', name: 'This is Fine', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmOTk5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIxOCI+VGhpcyBpcyBGaW5lPC90ZXh0Pjwvc3ZnPg==' }
  ];

  const categories = ['Doreamon', 'Bleach', 'Fight Club', 'Peter Thiel', 'Amy Schumer', 'Rani'];
  const aspectRatios = [
    { label: '1:1', ratio: 1 },
    { label: '4:3', ratio: 4/3 },
    { label: '4:5', ratio: 4/5 },
    { label: '9:16', ratio: 9/16 },
    { label: '16:9', ratio: 16/9 },
    { label: 'Custom', ratio: 1 }
  ];

  // Check if any layer is selected
  const hasSelectedLayers = layers.some(layer => layer.selected);
  const selectedLayer = layers.find(layer => layer.id === selectedLayerId);

  // Calculate canvas height based on aspect ratio
  useEffect(() => {
    const selectedRatio = aspectRatios.find(ar => ar.label === aspectRatio);
    if (selectedRatio && selectedRatio.label !== 'Custom') {
      setCanvasHeight(400 / selectedRatio.ratio);
    }
  }, [aspectRatio]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDeselectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save state for undo/redo
  const saveState = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), [...layers]]);
    setRedoStack([]);
  }, [layers]);

  // Deselect all layers
  const handleDeselectAll = () => {
    setLayers(prev => prev.map(layer => ({ ...layer, selected: false, isEditing: false })));
    setCurrentTool('select');
    setSelectedLayerId(null);
  };

  // Handle clicks outside canvas
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleDeselectAll();
    }
  };

  // Undo function
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, [...layers]]);
      setUndoStack(prev => prev.slice(0, -1));
      setLayers(previousState);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, [...layers]]);
      setRedoStack(prev => prev.slice(0, -1));
      setLayers(nextState);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const newLayer: Layer = {
          id: Date.now().toString(),
          type: 'image',
          name: file.name,
          visible: true,
          selected: false,
          x: 50,
          y: 50,
          width: 200,
          height: 150,
          imageData,
          brightness: 50,
          contrast: 50,
          warmth: 50,
          hue: 50
        };
        saveState();
        setLayers(prev => [...prev, newLayer]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'image',
      name: template.name,
      visible: true,
      selected: false,
      x: 0,
      y: 0,
      width: 400,
      height: canvasHeight,
      imageData: template.imageUrl,
      brightness: 50,
      contrast: 50,
      warmth: 50,
      hue: 50
    };
    saveState();
    setLayers([newLayer]);
    setShowTemplates(false);
  };

  // Add text layer
  const handleAddText = () => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'text',
      name: 'text_layer.png',
      visible: true,
      selected: true,
      x: 200,
      y: canvasHeight / 2,
      content: 'Your text here',
      fontSize: 24,
      fontFamily: selectedFont,
      color: '#000000',
      isEditing: true,
      brightness: 50,
      contrast: 50,
      warmth: 50,
      hue: 50
    };
    saveState();
    setLayers(prev => [...prev, newLayer]);
    setCurrentTool('text');
    setSelectedLayerId(newLayer.id);
    
    // Focus the text input after a short delay
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  // Layer selection
  const handleLayerSelect = (layerId: string) => {
    setLayers(prev => prev.map(layer => ({
      ...layer,
      selected: layer.id === layerId ? !layer.selected : false,
      isEditing: false
    })));
    setSelectedLayerId(layerId);
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    saveState();
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  // Delete layer
  const deleteLayer = (layerId: string) => {
    saveState();
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  // Select all layers
  const handleSelectAll = () => {
    const allSelected = layers.every(layer => layer.selected);
    setLayers(prev => prev.map(layer => ({
      ...layer,
      selected: !allSelected,
      isEditing: false
    })));
  };

  // Move layer up/down
  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    saveState();
    setLayers(prev => {
      const index = prev.findIndex(layer => layer.id === layerId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers;
    });
  };

  // Category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Update layer property
  const updateLayerProperty = (layerId: string, property: string, value: any) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, [property]: value } : layer
    ));
    // Trigger a save state on mouse up or after a delay for better UX
    if (!isDragging && !isResizing) {
      setTimeout(() => saveState(), 300);
    }
  };

  // Get layer at position
  const getLayerAtPosition = (x: number, y: number): Layer | null => {
    // Check layers in reverse order (top to bottom)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;
      
      if (layer.type === 'image' && layer.width && layer.height) {
        if (x >= layer.x && x <= layer.x + layer.width && 
            y >= layer.y && y <= layer.y + layer.height) {
          return layer;
        }
      } else if (layer.type === 'text') {
        // Rough text bounds estimation
        const textWidth = (layer.content?.length || 0) * (layer.fontSize || 24) * 0.6;
        const textHeight = layer.fontSize || 24;
        if (x >= layer.x && x <= layer.x + textWidth && 
            y >= layer.y - textHeight && y <= layer.y) {
          return layer;
        }
      }
    }
    return null;
  };

  // Get resize handle at position
  const getResizeHandle = (layer: Layer, x: number, y: number): string => {
    if (!layer.selected) return '';
    
    const handleSize = 8;
    const layerRight = layer.x + (layer.width || 0);
    const layerBottom = layer.y + (layer.height || 0);
    
    // Check corners first
    if (Math.abs(x - layer.x) < handleSize && Math.abs(y - layer.y) < handleSize) return 'nw';
    if (Math.abs(x - layerRight) < handleSize && Math.abs(y - layer.y) < handleSize) return 'ne';
    if (Math.abs(x - layer.x) < handleSize && Math.abs(y - layerBottom) < handleSize) return 'sw';
    if (Math.abs(x - layerRight) < handleSize && Math.abs(y - layerBottom) < handleSize) return 'se';
    
    // Check edges
    if (Math.abs(x - layer.x) < handleSize && y >= layer.y && y <= layerBottom) return 'w';
    if (Math.abs(x - layerRight) < handleSize && y >= layer.y && y <= layerBottom) return 'e';
    if (Math.abs(y - layer.y) < handleSize && x >= layer.x && x <= layerRight) return 'n';
    if (Math.abs(y - layerBottom) < handleSize && x >= layer.x && x <= layerRight) return 's';
    
    return '';
  };

  // Canvas mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'draw') {
      setIsDrawing(true);
      const newLayer: Layer = {
        id: Date.now().toString(),
        type: 'drawing',
        name: 'drawing_layer.png',
        visible: true,
        selected: true,
        x: 0,
        y: 0,
        paths: [{ x, y, isStart: true }],
        strokeWidth: drawWeight,
        strokeColor: drawColor,
        brightness: 50,
        contrast: 50,
        warmth: 50,
        hue: 50
      };
      
      saveState();
      setLayers(prev => [...prev, newLayer]);
    } else if (currentTool === 'select') {
      const clickedLayer = getLayerAtPosition(x, y);
      
      if (clickedLayer) {
        // Check for resize handles first
        const handle = getResizeHandle(clickedLayer, x, y);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setSelectedLayerId(clickedLayer.id);
          return;
        }
        
        // Select the clicked layer and deselect others unless holding Ctrl/Cmd
        if (!e.ctrlKey && !e.metaKey) {
          setLayers(prev => prev.map(layer => ({
            ...layer,
            selected: layer.id === clickedLayer.id,
            isEditing: false
          })));
          setSelectedLayerId(clickedLayer.id);
        } else {
          setLayers(prev => prev.map(layer => 
            layer.id === clickedLayer.id 
              ? { ...layer, selected: !layer.selected, isEditing: false }
              : layer
          ));
        }
        
        // Start dragging
        setIsDragging(true);
        setDragStart({ x: x - clickedLayer.x, y: y - clickedLayer.y });
      } else {
        // Clicked on empty space - deselect all
        handleDeselectAll();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDrawing && currentTool === 'draw') {
      setLayers(prev => {
        const newLayers = [...prev];
        const lastLayer = newLayers[newLayers.length - 1];
        if (lastLayer && lastLayer.type === 'drawing') {
          lastLayer.paths = [...(lastLayer.paths || []), { x, y, isStart: false }];
        }
        return newLayers;
      });
    } else if (isDragging && currentTool === 'select' && !isResizing) {
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      
      setLayers(prev => prev.map(layer => 
        layer.selected 
          ? { ...layer, x: Math.max(0, newX), y: Math.max(0, newY) }
          : layer
      ));
    } else if (isResizing && selectedLayerId) {
      const layer = layers.find(l => l.id === selectedLayerId);
      if (layer && layer.width && layer.height) {
        let newWidth = layer.width;
        let newHeight = layer.height;
        let newX = layer.x;
        let newY = layer.y;
        
        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(20, x - layer.x);
            newHeight = Math.max(20, y - layer.y);
            break;
          case 'sw':
            newWidth = Math.max(20, layer.x + layer.width - x);
            newHeight = Math.max(20, y - layer.y);
            newX = Math.min(x, layer.x + layer.width - 20);
            break;
          case 'ne':
            newWidth = Math.max(20, x - layer.x);
            newHeight = Math.max(20, layer.y + layer.height - y);
            newY = Math.min(y, layer.y + layer.height - 20);
            break;
          case 'nw':
            newWidth = Math.max(20, layer.x + layer.width - x);
            newHeight = Math.max(20, layer.y + layer.height - y);
            newX = Math.min(x, layer.x + layer.width - 20);
            newY = Math.min(y, layer.y + layer.height - 20);
            break;
          case 'e':
            newWidth = Math.max(20, x - layer.x);
            break;
          case 'w':
            newWidth = Math.max(20, layer.x + layer.width - x);
            newX = Math.min(x, layer.x + layer.width - 20);
            break;
          case 's':
            newHeight = Math.max(20, y - layer.y);
            break;
          case 'n':
            newHeight = Math.max(20, layer.y + layer.height - y);
            newY = Math.min(y, layer.y + layer.height - 20);
            break;
        }
        
        setLayers(prev => prev.map(l => 
          l.id === selectedLayerId 
            ? { ...l, width: newWidth, height: newHeight, x: newX, y: newY }
            : l
        ));
      }
    }
    
    // Update cursor based on hover state
    if (currentTool === 'select') {
      const hoveredLayer = getLayerAtPosition(x, y);
      if (hoveredLayer?.selected) {
        const handle = getResizeHandle(hoveredLayer, x, y);
        if (handle) {
          canvas.style.cursor = `${handle}-resize`;
        } else {
          canvas.style.cursor = 'move';
        }
      } else {
        canvas.style.cursor = 'default';
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      saveState();
    }
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  // Handle text editing
  const handleTextDoubleClick = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, isEditing: true, selected: true }
        : { ...layer, isEditing: false }
    ));
    setSelectedLayerId(layerId);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleTextChange = (layerId: string, newContent: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, content: newContent }
        : layer
    ));
  };

  const handleTextSubmit = (layerId: string) => {
    saveState();
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, isEditing: false }
        : layer
    ));
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const renderCanvas = async () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Process layers sequentially to ensure proper order
      for (const layer of layers) {
        if (!layer.visible) continue;
        
        ctx.save();
        
        if (layer.type === 'image' && layer.imageData) {
          // Apply layer-specific filters
          const brightnessVal = ((layer.brightness || 50) - 50) * 2;
          const contrastVal = (layer.contrast || 50) / 50;
          const warmthVal = (layer.warmth || 50) - 50;
          const hueVal = ((layer.hue || 50) - 50) * 3.6;
          
          ctx.filter = `brightness(${100 + brightnessVal}%) contrast(${contrastVal}) hue-rotate(${hueVal}deg)`;
          
          // Load and draw image
          await new Promise<void>((resolve) => {
            const img = new window.Image();
            img.onload = () => {
              ctx.drawImage(img, layer.x, layer.y, layer.width || img.width, layer.height || img.height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = layer.imageData!;
          });
          
        } else if (layer.type === 'text' && layer.content && !layer.isEditing) {
          // Apply layer-specific filters for text
          const brightnessVal = ((layer.brightness || 50) - 50) * 2;
          const contrastVal = (layer.contrast || 50) / 50;
          const hueVal = ((layer.hue || 50) - 50) * 3.6;
          
          ctx.filter = `brightness(${100 + brightnessVal}%) contrast(${contrastVal}) hue-rotate(${hueVal}deg)`;
          ctx.font = `${layer.fontSize || 24}px ${layer.fontFamily || 'Inter'}`;
          ctx.fillStyle = layer.color || '#000000';
          ctx.fillText(layer.content, layer.x, layer.y);
          
        } else if (layer.type === 'drawing' && layer.paths) {
          // Apply layer-specific filters for drawings
          const brightnessVal = ((layer.brightness || 50) - 50) * 2;
          const contrastVal = (layer.contrast || 50) / 50;
          const hueVal = ((layer.hue || 50) - 50) * 3.6;
          
          ctx.filter = `brightness(${100 + brightnessVal}%) contrast(${contrastVal}) hue-rotate(${hueVal}deg)`;
          ctx.strokeStyle = layer.strokeColor || '#000000';
          ctx.lineWidth = layer.strokeWidth || 5;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          layer.paths.forEach((point, index) => {
            if (point.isStart || index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        }
        
        ctx.restore();
      }
      
      // Draw selection borders and handles after all layers are rendered
      ctx.filter = 'none';
      layers.forEach(layer => {
        if (!layer.visible || !layer.selected) return;
        
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        if (layer.type === 'image' && layer.width && layer.height) {
          // Draw selection border
          ctx.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4);
          
          // Draw resize handles
          ctx.setLineDash([]);
          ctx.fillStyle = '#3b82f6';
          const handleSize = 8;
          const handles = [
            { x: layer.x - handleSize/2, y: layer.y - handleSize/2 }, // nw
            { x: layer.x + layer.width - handleSize/2, y: layer.y - handleSize/2 }, // ne
            { x: layer.x - handleSize/2, y: layer.y + layer.height - handleSize/2 }, // sw
            { x: layer.x + layer.width - handleSize/2, y: layer.y + layer.height - handleSize/2 }, // se
            { x: layer.x - handleSize/2, y: layer.y + layer.height/2 - handleSize/2 }, // w
            { x: layer.x + layer.width - handleSize/2, y: layer.y + layer.height/2 - handleSize/2 }, // e
            { x: layer.x + layer.width/2 - handleSize/2, y: layer.y - handleSize/2 }, // n
            { x: layer.x + layer.width/2 - handleSize/2, y: layer.y + layer.height - handleSize/2 }, // s
          ];
          
          handles.forEach(handle => {
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
          });
          
        } else if (layer.type === 'text' && layer.content) {
          // Draw text selection border
          const tempCtx = ctx;
          tempCtx.font = `${layer.fontSize || 24}px ${layer.fontFamily || 'Inter'}`;
          const metrics = tempCtx.measureText(layer.content);
          ctx.strokeRect(layer.x - 2, layer.y - (layer.fontSize || 24) - 2, metrics.width + 4, (layer.fontSize || 24) + 4);
        }
        
        ctx.restore();
      });
    };
    
    renderCanvas();
  }, [layers, canvasHeight]);

  // Handle drag and drop for file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          const newLayer: Layer = {
            id: Date.now().toString(),
            type: 'image',
            name: file.name,
            visible: true,
            selected: false,
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            imageData,
            brightness: 50,
            contrast: 50,
            warmth: 50,
            hue: 50
          };
          saveState();
          setLayers(prev => [...prev, newLayer]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg max-w-6xl mx-auto" onClick={handleOutsideClick}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Edit meme</h2>
        <div className="flex items-center gap-4">
          {hasSelectedLayers && (
            <button 
              onClick={handleDeselectAll}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              <X size={14} />
              <span>Esc</span>
            </button>
          )}
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <ImagePlus size={18} className='text-black'/>
            <span className='text-black'>Add Image</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button 
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <RotateCcw size={18} />
          </button>
          <button 
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <RotateCw size={18} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-52 p-4 border-r border-gray-200 space-y-6">
          {/* Choose Template */}
          <div>
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-2xl hover:bg-gray-50 w-full"
            >
              <span className="font-medium text-gray-700">Choose Template</span>
              <LucideImage size={18} className='text-black'/>
            </button>
            
            {showTemplates && (
              <div className="mt-2 p-2 border border-gray-300 rounded-lg bg-white shadow-lg">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full text-left p-2 hover:bg-gray-100 rounded text-xs"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Text */}
          <div>
            <button 
              onClick={handleAddText}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-2xl hover:bg-gray-50 ${
                currentTool === 'text' ? 'bg-blue-100 border-blue-300' : ''
              }`}
            >
              <span className="font-medium text-gray-700">Add Text</span>
              <Type size={16} className="text-gray-600" />
            </button>
            <div className="mt-2">
              <label className="text-xs text-gray-500">Font</label>
              <select 
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option>Inter</option>
                <option>Poppins</option>
                <option>Times New Roman</option>
                <option>Sans Serif</option>
              </select>
            </div>
          </div>

          {/* Crop */}
          <div>
            <button 
              onClick={() => setCurrentTool(currentTool === 'crop' ? 'select' : 'crop')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-2xl hover:bg-gray-50 ${
                currentTool === 'crop' ? 'bg-blue-100 border-blue-300' : ''
              }`}
            >
              <span className="text-sm font-medium text-gray-700">Crop</span>
              <Crop size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Draw */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentTool(currentTool === 'draw' ? 'select' : 'draw')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-2xl hover:bg-gray-50 ${
                  currentTool === 'draw' ? 'bg-blue-100 border-blue-300' : ''
                }`}
              >
                <span className="text-sm font-medium text-gray-700">Draw</span>
                <Edit3 size={16} className="text-gray-600" />
              </button>
              
              <input 
                type="color" 
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                className="w-8 h-8 bg-white rounded-md cursor-pointer border border-gray-300"
                title="Select color"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Weight</label>
              <input
                type="range"
                min="1"
                max="20"
                value={drawWeight}
                onChange={(e) => setDrawWeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Layer Adjustments */}
          {selectedLayer && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700">Layer Adjustments</h4>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Brightness</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer.brightness || 50}
                  onChange={(e) => updateLayerProperty(selectedLayer.id, 'brightness', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Contrast</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer.contrast || 50}
                  onChange={(e) => updateLayerProperty(selectedLayer.id, 'contrast', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Warmth</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer.warmth || 50}
                  onChange={(e) => updateLayerProperty(selectedLayer.id, 'warmth', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Hue</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer.hue || 50}
                  onChange={(e) => updateLayerProperty(selectedLayer.id, 'hue', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {/* Canvas Area */}
            <div 
              className="relative bg-gray-100 rounded-lg overflow-hidden w-full flex items-center justify-center"
              style={{ height: `${canvasHeight + 40}px` }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={canvasHeight}
                  className="border border-gray-300 bg-white cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                
                {/* Text editing overlay */}
                {layers.map(layer => 
                  layer.type === 'text' && layer.isEditing ? (
                    <input
                      key={layer.id}
                      ref={textInputRef}
                      type="text"
                      value={layer.content || ''}
                      onChange={(e) => handleTextChange(layer.id, e.target.value)}
                      onBlur={() => handleTextSubmit(layer.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTextSubmit(layer.id);
                        }
                      }}
                      className="absolute bg-transparent border-2 border-blue-400 outline-none"
                      style={{
                        left: layer.x,
                        top: layer.y - (layer.fontSize || 24),
                        fontSize: layer.fontSize || 24,
                        fontFamily: layer.fontFamily || 'Inter',
                        color: layer.color || '#000000',
                        width: `${Math.max((layer.content?.length || 0) * 12, 100)}px`,
                        height: `${layer.fontSize || 24}px`
                      }}
                    />
                  ) : null
                )}
                
                {/* Text double-click handlers */}
                {layers.map(layer => 
                  layer.type === 'text' && !layer.isEditing ? (
                    <div
                      key={layer.id}
                      className="absolute cursor-text"
                      style={{
                        left: layer.x,
                        top: layer.y - (layer.fontSize || 24),
                        width: `${(layer.content?.length || 0) * 12}px`,
                        height: `${layer.fontSize || 24}px`
                      }}
                      onDoubleClick={() => handleTextDoubleClick(layer.id)}
                    />
                  ) : null
                )}
              </div>
              
              {layers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Upload size={48} className="mx-auto mb-2 text-gray-400" />
                    <p>Drag and drop images or click "Add Image"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Add or search</p>
                <input 
                  type="text" 
                  placeholder="typing will open a dropdown of similar titles"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Caption */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add a caption</h3>
              <input 
                type="text" 
                placeholder="style when I hit snooze....."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-54 p-4 border-l border-gray-200">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Layers</h3>
            <div className="space-y-2 bg-gray-200 p-2 rounded max-h-52 overflow-y-auto">
              {layers.map((layer, index) => (
                <div
                  key={layer.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors duration-200 ${
                    layer.selected ? 'bg-gray-300' : 'hover:bg-gray-100'
                  }`}
                  onMouseEnter={() => setHoveredLayer(layer.id)}
                  onMouseLeave={() => setHoveredLayer(null)}
                >
                  <div className="flex items-center gap-2 flex-1" onClick={() => handleLayerSelect(layer.id)}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                      className="w-4 h-4 flex items-center justify-center"
                    >
                      {layer.visible ? (
                        <Eye size={14} className="text-gray-700" />
                      ) : (
                        <EyeOff size={14} className="text-gray-400" />
                      )}
                    </button>
                    <span className="text-xs text-black truncate">{layer.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {hoveredLayer === layer.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLayer(layer.id);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete layer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayer(layer.id, 'up');
                      }}
                      disabled={index === layers.length - 1}
                      className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayer(layer.id, 'down');
                      }}
                      disabled={index === 0}
                      className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Select All Button */}
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {layers.every(layer => layer.selected) ? 'Deselect all' : 'Select all'}
            </button>
            
            {/* Aspect Ratio */}
            <div className="space-y-2 mt-8">
              <h4 className="text-gray-700 font-medium text-sm">Aspect Ratio</h4>
              {aspectRatios.map(ar => (
                <button
                  key={ar.label}
                  onClick={() => setAspectRatio(ar.label)}
                  className={`block w-full text-left text-xs py-1 px-2 rounded transition-colors ${
                    aspectRatio === ar.label ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>

            {/* Tag your mates */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tag your mates</h4>
              <input 
                type="text" 
                placeholder="Search..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
              <p className="text-xs text-gray-400 mt-1">
                #Dropdown of followers4following
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Current tool: <span className="font-medium capitalize">{currentTool}</span>
          {layers.filter(l => l.selected).length > 0 && (
            <span className="ml-4">
              Selected: {layers.filter(l => l.selected).length} layer(s)
            </span>
          )}
        </div>
        <button className="px-6 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800">
          Post meme
        </button>
      </div>
    </div>
  );
}