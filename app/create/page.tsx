'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Crop, Edit3, RotateCcw, RotateCw, Image as LucideImage, ImagePlus, X, Upload, Trash2, Eye, EyeOff, Menu, ChevronDown, ChevronUp, Layers, Settings, Palette } from 'lucide-react';

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
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  imageData?: string;
  paths?: Array<{ x: number; y: number; isStart: boolean }>;
  strokeWidth?: number;
  strokeColor?: string;
  isEditing?: boolean;
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

export default function MobileMemeCreator() {
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
      width: 300,
      height: 300,
      imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCI+U2FtcGxlIEltYWdlPC90ZXh0Pjwvc3ZnPg==',
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
  const [canvasSize, setCanvasSize] = useState(300);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [cropRegion, setCropRegion] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  
  // Mobile-specific states
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [activeSection, setActiveSection] = useState<'tools' | 'layers' | 'settings' | null>(null);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);

  const templates: Template[] = [
    { id: '1', name: 'Drake', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmZjk5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIxNiI+RHJha2UgVGVtcGxhdGU8L3RleHQ+PC9zdmc+' },
    { id: '2', name: 'Distracted BF', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmY2M5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIxNCI+RGlzdHJhY3RlZCBCRjwvdGV4dD48L3N2Zz4=' },
    { id: '3', name: 'This is Fine', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2ZmOTk5OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIxNiI+VGhpcyBpcyBGaW5lPC90ZXh0Pjwvc3ZnPg==' }
  ];

  const categories = ['Doreamon', 'Bleach', 'Fight Club', 'Peter Thiel', 'Amy Schumer', 'Rani'];
  const aspectRatios = [
    { label: '1:1', ratio: 1 },
    { label: '4:3', ratio: 4/3 },
    { label: '4:5', ratio: 4/5 },
    { label: '9:16', ratio: 9/16 },
    { label: '16:9', ratio: 16/9 }
  ];

  const hasSelectedLayers = layers.some(layer => layer.selected);
  const selectedLayer = layers.find(layer => layer.id === selectedLayerId);

  useEffect(() => {
    let selected = aspectRatios.find(ar => ar.label === aspectRatio);
    let ratioNum: number;
    if (selected) {
      ratioNum = selected.ratio;
    } else {
      const parts = aspectRatio.split(':').map(Number);
      ratioNum = parts[0] / parts[1];
    }
    
    const baseSize = Math.min(300, window.innerWidth - 40);
    if (ratioNum > 1) {
      setCanvasSize(baseSize);
    } else {
      setCanvasSize(baseSize);
    }
  }, [aspectRatio]);

  useEffect(() => {
    const handleResize = () => {
      const baseSize = Math.min(300, window.innerWidth - 40);
      setCanvasSize(baseSize);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveState = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), [...layers]]);
    setRedoStack([]);
  }, [layers]);

  const handleDeselectAll = () => {
    setLayers(prev => prev.map(layer => ({ ...layer, selected: false, isEditing: false })));
    setCurrentTool('select');
    setSelectedLayerId(null);
    setCropRegion(null);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, [...layers]]);
      setUndoStack(prev => prev.slice(0, -1));
      setLayers(previousState);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, [...layers]]);
      setRedoStack(prev => prev.slice(0, -1));
      setLayers(nextState);
    }
  };

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
          x: 25,
          y: 25,
          width: canvasSize - 50,
          height: canvasSize - 50,
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

  const handleTemplateSelect = (template: Template) => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'image',
      name: template.name,
      visible: true,
      selected: false,
      x: 0,
      y: 0,
      width: canvasSize,
      height: canvasSize,
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

  const handleAddText = () => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: 'text',
      name: 'text_layer.png',
      visible: true,
      selected: true,
      x: canvasSize / 2 - 50,
      y: canvasSize / 2,
      content: 'Your text here',
      fontSize: 20,
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
    setActiveSection(null);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleLayerSelect = (layerId: string) => {
    setLayers(prev => prev.map(layer => ({
      ...layer,
      selected: layer.id === layerId ? !layer.selected : false,
      isEditing: false
    })));
    setSelectedLayerId(layerId);
  };

  const toggleLayerVisibility = (layerId: string) => {
    saveState();
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const deleteLayer = (layerId: string) => {
    saveState();
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  const updateLayerProperty = (layerId: string, property: string, value: any) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, [property]: value } : layer
    ));
    if (!isDragging && !isResizing) {
      setTimeout(() => saveState(), 300);
    }
  };

  const getLayerAtPosition = (x: number, y: number): Layer | null => {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;
      
      if (layer.type === 'image' && layer.width && layer.height) {
        if (x >= layer.x && x <= layer.x + layer.width && 
            y >= layer.y && y <= layer.y + layer.height) {
          return layer;
        }
      } else if (layer.type === 'text') {
        const textWidth = (layer.content?.length || 0) * (layer.fontSize || 20) * 0.6;
        const textHeight = layer.fontSize || 20;
        if (x >= layer.x && x <= layer.x + textWidth && 
            y >= layer.y - textHeight && y <= layer.y) {
          return layer;
        }
      }
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setTouchStart({ x, y });
    
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      const clickedLayer = getLayerAtPosition(x, y);
      if (clickedLayer && clickedLayer.type === 'text') {
        handleTextDoubleClick(clickedLayer.id);
        return;
      }
    }
    setLastTap(currentTime);
    
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
        setLayers(prev => prev.map(layer => ({
          ...layer,
          selected: layer.id === clickedLayer.id,
          isEditing: false
        })));
        setSelectedLayerId(clickedLayer.id);
        setIsDragging(true);
        setDragStart({ x: x - clickedLayer.x, y: y - clickedLayer.y });
      } else {
        handleDeselectAll();
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (isDrawing && currentTool === 'draw') {
      setLayers(prev => {
        const newLayers = [...prev];
        const lastLayer = newLayers[newLayers.length - 1];
        if (lastLayer && lastLayer.type === 'drawing') {
          lastLayer.paths = [...(lastLayer.paths || []), { x, y, isStart: false }];
        }
        return newLayers;
      });
    } else if (isDragging && currentTool === 'select') {
      const newX = Math.max(0, Math.min(canvasSize - 20, x - dragStart.x));
      const newY = Math.max(0, Math.min(canvasSize - 20, y - dragStart.y));
      
      setLayers(prev => prev.map(layer => 
        layer.selected 
          ? { ...layer, x: newX, y: newY }
          : layer
      ));
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      saveState();
    }
    setIsDrawing(false);
    setIsDragging(false);
  };

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

  const toggleSection = (section: 'tools' | 'layers' | 'settings') => {
    setActiveSection(activeSection === section ? null : section);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const renderCanvas = async () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (const layer of layers) {
        if (!layer.visible) continue;
        
        ctx.save();
        
        if (layer.type === 'image' && layer.imageData) {
          const brightnessVal = ((layer.brightness || 50) - 50) * 2;
          const contrastVal = (layer.contrast || 50) / 50;
          const warmthVal = (layer.warmth || 50) - 50;
          const hueVal = ((layer.hue || 50) - 50) * 3.6;
          
          ctx.filter = `brightness(${100 + brightnessVal}%) contrast(${contrastVal}) hue-rotate(${hueVal}deg)`;
          
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, layer.x, layer.y, layer.width || img.width, layer.height || img.height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = layer.imageData!;
          });
          
        } else if (layer.type === 'text' && layer.content && !layer.isEditing) {
          const brightnessVal = ((layer.brightness || 50) - 50) * 2;
          const contrastVal = (layer.contrast || 50) / 50;
          const hueVal = ((layer.hue || 50) - 50) * 3.6;
          
          ctx.filter = `brightness(${100 + brightnessVal}%) contrast(${contrastVal}) hue-rotate(${hueVal}deg)`;
          ctx.font = `${layer.fontSize || 20}px ${layer.fontFamily || 'Inter'}`;
          ctx.fillStyle = layer.color || '#000000';
          ctx.fillText(layer.content, layer.x, layer.y);
          
        } else if (layer.type === 'drawing' && layer.paths) {
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
      
      // Selection indicators
      ctx.filter = 'none';
      layers.forEach(layer => {
        if (!layer.visible || !layer.selected) return;
        
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        
        if (layer.type === 'image' && layer.width && layer.height) {
          ctx.strokeRect(layer.x - 1, layer.y - 1, layer.width + 2, layer.height + 2);
        } else if (layer.type === 'text' && layer.content) {
          const tempCtx = ctx;
          tempCtx.font = `${layer.fontSize || 20}px ${layer.fontFamily || 'Inter'}`;
          const metrics = tempCtx.measureText(layer.content);
          ctx.strokeRect(layer.x - 1, layer.y - (layer.fontSize || 20) - 1, metrics.width + 2, (layer.fontSize || 20) + 2);
        }
        
        ctx.restore();
      });
    };
    
    renderCanvas();
  }, [layers, canvasSize]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="bg-white mx-2 my-4 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
          <h1 className="text-lg font-semibold text-gray-900">Create Meme</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              <RotateCw size={18} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="border-2 border-gray-300 bg-white rounded-lg shadow-sm touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
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
                    className="absolute bg-transparent border-2 border-blue-400 outline-none rounded px-1"
                    style={{
                      left: layer.x,
                      top: layer.y - (layer.fontSize || 20),
                      fontSize: layer.fontSize || 20,
                      fontFamily: layer.fontFamily || 'Inter',
                      color: layer.color || '#000000',
                      width: `${Math.max((layer.content?.length || 0) * 12, 100)}px`,
                      height: `${layer.fontSize || 20}px`
                    }}
                  />
                ) : null
              )}
            </div>
          </div>

          {/* Current Tool Display */}
          <div className="text-center text-sm text-gray-600 mb-4">
            Mode: <span className="font-medium capitalize">{currentTool}</span>
            {hasSelectedLayers && <span className="ml-3">Selected: {layers.filter(l => l.selected).length}</span>}
          </div>
        </div>

        {/* Mobile Tool Panels */}
        <div className="border-t bg-gray-50">
          {/* Section Tabs */}
          <div className="flex border-b">
            <button 
              onClick={() => toggleSection('tools')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
                activeSection === 'tools' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600'
              }`}
            >
              <Menu size={16} />
              Tools
            </button>
            <button 
              onClick={() => toggleSection('layers')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
                activeSection === 'layers' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600'
              }`}
            >
              <Layers size={16} />
              Layers
            </button>
            <button 
              onClick={() => toggleSection('settings')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
                activeSection === 'settings' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600'
              }`}
            >
              <Settings size={16} />
              Settings
            </button>
          </div>

          {/* Tools Panel */}
          {activeSection === 'tools' && (
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {/* Templates */}
              <div>
                <button 
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="w-full flex items-center justify-between py-2 px-3 bg-white border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <LucideImage size={16} />
                    <span className="text-sm font-medium">Templates</span>
                  </div>
                  <ChevronDown size={16} className={`transform transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                </button>
                
                {showTemplates && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-2 bg-gray-100 rounded-lg text-xs text-center hover:bg-gray-200 transition-colors"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Image */}
              <label className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <ImagePlus size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Add Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Add Text */}
              <button 
                onClick={handleAddText}
                className={`w-full flex items-center gap-2 py-3 px-3 border rounded-lg ${
                  currentTool === 'text' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
                }`}
              >
                <Type size={16} />
                <span className="text-sm font-medium">Add Text</span>
              </button>

              {/* Font Selection for Text */}
              {currentTool === 'text' && (
                <div className="bg-white p-3 rounded-lg border">
                  <label className="text-xs text-gray-600 mb-2 block">Font Family</label>
                  <select 
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full px-2 py-2 text-sm border rounded"
                  >
                    <option>Inter</option>
                    <option>Poppins</option>
                    <option>Times New Roman</option>
                    <option>Sans Serif</option>
                  </select>
                </div>
              )}

              {/* Drawing Tools */}
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentTool(currentTool === 'draw' ? 'select' : 'draw')}
                  className={`w-full flex items-center gap-2 py-3 px-3 border rounded-lg ${
                    currentTool === 'draw' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
                  }`}
                >
                  <Edit3 size={16} />
                  <span className="text-sm font-medium">Draw</span>
                </button>
                
                {currentTool === 'draw' && (
                  <div className="bg-white p-3 rounded-lg border space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600">Color:</label>
                      <input 
                        type="color" 
                        value={drawColor}
                        onChange={(e) => setDrawColor(e.target.value)}
                        className="w-10 h-8 rounded border cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Brush Size: {drawWeight}px</label>
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
                )}
              </div>

              {/* Crop Tool */}
              <button 
                onClick={() => setCurrentTool(currentTool === 'crop' ? 'select' : 'crop')}
                className={`w-full flex items-center gap-2 py-3 px-3 border rounded-lg ${
                  currentTool === 'crop' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
                }`}
              >
                <Crop size={16} />
                <span className="text-sm font-medium">Crop</span>
              </button>
            </div>
          )}

          {/* Layers Panel */}
          {activeSection === 'layers' && (
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-2">
                {layers.slice().reverse().map((layer, displayIndex) => (
                  <div
                    key={layer.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      layer.selected ? 'bg-blue-100 border border-blue-300' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="flex-shrink-0"
                    >
                      {layer.visible ? (
                        <Eye size={16} className="text-gray-600" />
                      ) : (
                        <EyeOff size={16} className="text-gray-400" />
                      )}
                    </button>
                    
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => handleLayerSelect(layer.id)}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{layer.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{layer.type}</p>
                    </div>
                    
                    <button
                      onClick={() => deleteLayer(layer.id)}
                      className="flex-shrink-0 p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              {layers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No layers yet</p>
                  <p className="text-xs mt-1">Add an image or text to get started</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Panel */}
          {activeSection === 'settings' && (
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {/* Layer Adjustments */}
              {selectedLayer && (
                <div className="bg-white rounded-lg border p-3 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Palette size={14} />
                    Layer Adjustments
                  </h4>
                  
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Brightness</label>
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
                    <label className="text-xs text-gray-600 mb-1 block">Contrast</label>
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
                    <label className="text-xs text-gray-600 mb-1 block">Warmth</label>
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
                    <label className="text-xs text-gray-600 mb-1 block">Hue</label>
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

              {/* Aspect Ratios */}
              <div className="bg-white rounded-lg border p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Aspect Ratio</h4>
                <div className="grid grid-cols-3 gap-2">
                  {aspectRatios.map(ar => (
                    <button
                      key={ar.label}
                      onClick={() => setAspectRatio(ar.label)}
                      className={`py-2 px-3 text-xs rounded transition-colors ${
                        aspectRatio === ar.label 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg border p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategories(prev => 
                          prev.includes(category) 
                            ? prev.filter(c => c !== category)
                            : [...prev, category]
                        )
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedCategories.includes(category)
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  placeholder="Search categories..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>

              {/* Caption */}
              <div className="bg-white rounded-lg border p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Caption</h4>
                <textarea 
                  placeholder="Add a funny caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg resize-none"
                  rows={3}
                />
              </div>

              {/* Tag Search */}
              <div className="bg-white rounded-lg border p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tag Friends</h4>
                <input 
                  type="text" 
                  placeholder="Search friends..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Tag your friends in this meme</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentTool('select')}
                className={`px-4 py-2 text-xs rounded-full border transition-colors ${
                  currentTool === 'select' 
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                Select
              </button>
              {hasSelectedLayers && (
                <button 
                  onClick={handleDeselectAll}
                  className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-full border border-gray-300"
                >
                  Deselect
                </button>
              )}
            </div>
          </div>
          
          <button className="w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Post Meme
          </button>
        </div>
      </div>
    </div>
  );
}