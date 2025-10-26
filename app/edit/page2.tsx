'use client';

import React from 'react';
import { useState } from 'react';
import { Type, Crop, Edit3, RotateCcw, RotateCw, Image, ImagePlus, X, Circle } from 'lucide-react';

export default function MemeEditor() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Hardcoded list of files to display as layers.
  const files = [
    'papeltonado.svg',
    'photo.jpg',
    'text_layer.png',
    'background.jpg',
    'another_text.png',
    'sticker.svg',
    'logo.png',
    'filter_overlay.png'];

  // Function to handle the selection/deselection of a layer.
  const handleFileSelect = (file: string) => {
    // Check if the file is already in the selectedFiles array.
    if (selectedFiles.includes(file)) {
      // If it is, remove it from the array (deselect).
      setSelectedFiles(selectedFiles.filter((f) => f !== file));
    } else {
      // If it's not, add it to the array (select).
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  // Function to handle the "Select All" button click.
  const handleSelectAll = () => {
    // Check if all files are currently selected.
    const allSelected = selectedFiles.length === files.length;

    // If all are selected, deselect all by setting the array to empty.
    // Otherwise, select all by setting the array to the full list of files.
    if (allSelected) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles([...files]);
    }
  };
  return (
    <div className="bg-white rounded-2xl shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Edit meme</h2>
        <div className="flex items-center gap-8">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            <ImagePlus size={18} className='text-black'/>
            <h2 className='text-black'>Add Image</h2>
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600">
            <RotateCcw size={18} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600">
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
          {/* Choose Meme */}
          <div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-2xl hover:bg-gray-50">
            <h3 className="font-medium text-gray-700">Choose Template</h3>
            <Image size={18} className='text-black'/>
            </button>
          </div>

          {/* Add Text */}
          <div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-2xl hover:bg-gray-50">
              <span className="font-medium text-gray-700">Add Text</span>
              <Type size={16} className="text-gray-600" />
            </button>
            <div>
              <label className="text-xs text-gray-500">Font</label>
              <select className="w-full px-2  text-sm border border-gray-300 rounded">
                <option>Inter</option>
                <option>Poppins</option>
                <option>Times New Roman</option>
                <option>Sans Serif</option>
              </select>
            </div>
          </div>

          {/* Crop */}
          <div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-2xl hover:bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Crop</span>
              <Crop size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Draw */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-2xl hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-700">Draw</span>
                <Edit3 size={16} className="text-gray-600" />
              </button>
            
              <input 
                type="color" 
                defaultValue="#000000"
                className="w-8 h-8 bg-white rounded-md cursor-pointer"
                title="Select color"
              />
            </div>
            <label className="text-xs text-gray-500">Weight</label>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div className="w-1/3 h-2 bg-black rounded"></div>
            </div>
          </div>

          {/* Adjustments */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Brightness</label>
              <div className="w-full h-4 bg-gray-200 rounded-xl">
                <div className="w-1/2 h-4 bg-black rounded-xl"></div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Contrast</label>
              <div className="w-full h-4 bg-gray-200 rounded-xl">
                <div className="w-1/2 h-4 bg-black rounded-xl"></div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Warmth</label>
              <div className="w-full h-4 bg-gray-200 rounded-xl">
                <div className="w-1/2 h-4 bg-black rounded-xl"></div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Hue</label>
              <div className="w-full h-4 bg-gray-200 rounded-xl">
                <div className="w-1/2 h-4 bg-black rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden w-full h-96">
             
            </div>


            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select categories</h3>
              <div className="flex flex-wrap gap-2">
                {['Doreamon', 'Bleach', 'Fight Club', 'Peter Thiel', 'Amy Schumer', 'Rani'].map((tag) => (
                  <span key={tag} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <button className="text-sm text-gray-500 mt-2">Add or search</button>
              <input 
                type="text" 
                placeholder="typing will open a dropdown of similar titles"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Caption */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add a caption</h3>
              <input 
                type="text" 
                placeholder="style when I hit snooze....."
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
              {files.map((file, index) => {
                const isSelected = selectedFiles.includes(file);

                return (
                  <div
                    key={file}
                    className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors duration-200 ${
                      isSelected ? 'bg-gray-300' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="flex items-center gap-2">
                      <Circle size={8} className='bg-black rounded-lg'/>
                      <span className="text-xs text-black">{file}</span>
                    </div>
                    <div
                      className={`w-4 h-4 flex items-center justify-center rounded border-2 transition-colors duration-200 ${
                        isSelected
                          ? 'bg-black border-black'
                          : 'bg-white border-gray-400'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3 h-3"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Select All Button */}
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedFiles.length === files.length ? 'Deselect all' : 'Select all'}
            </button>
            
            
            {/* Aspect Ratio and Tagging */}

            <div className="space-y-2 mt-8 text-gray-700 font-medium text-sm">Aspect Ratio
              <div className="text-xs text-gray-500 mt-2">1:1</div>
              <div className="text-xs text-gray-500">4:3</div>
              <div className="text-xs text-gray-500">4:5</div>
              <div className="text-xs text-gray-500">9:16</div>
              <div className="text-xs text-gray-500">16:9</div>
              <div className="text-xs text-gray-500">Custom</div>
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tag your mates</h4>
              <input 
                type="text" 
                placeholder="Search..."
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
      <div className="p-4 border-t border-gray-200 flex justify-end">
        <button className="px-6 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800">
          Post meme
        </button>
      </div>
    </div>
  );
}