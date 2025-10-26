/*serves as the original meme/page.tsx file8*/

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface MemeCardProps {
  id: number;
  height: number;
}

const MemeCard: React.FC<MemeCardProps> = ({ id, height }) => {
  return (
    <div 
      className="bg-gray-300 rounded-lg mb-4 break-inside-avoid"
      style={{ height: `${height}px` }}
    >
      {/* Placeholder content - replace with actual meme content */}
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        Meme {id}
      </div>
    </div>
  );
};

const MemeVerse: React.FC = () => {
  const [columns, setColumns] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Generate random heights for cards to simulate different content sizes
  const generateCards = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      height: Math.floor(Math.random() * 200) + 150, // Random height between 150-350px
    }));
  };

  const [cards] = useState(generateCards(50));

  // Handle header visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsHeaderVisible(true);
      } 
      // Hide header when scrolling down (but not immediately)
      else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Update columns based on screen size
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(2); // Mobile: 2 columns
      } else if (width < 1024) {
        setColumns(3); // Tablet: 3 columns
      } else if (width < 1280) {
        setColumns(4); // Desktop: 4 columns
      } else {
        setColumns(5); // Large desktop: 5 columns
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 bg-white z-20 border-b border-gray-200 px-4 py-3 transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center"><Link href="/">
            <h1 className="text-2xl font-bold text-black mr-8 sm:block hidden">MemeVerse</h1>
            <h1 className="text-lg font-bold text-black mr-4 sm:hidden">MV</h1></Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Browse Memes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Explore Categories Button / Grid Icon */}
          <div className="flex items-center">
            {/* Show grid icon on smaller screens, text button on larger screens */}
            <button className="text-gray-600 hover:text-black font-medium lg:block hidden">
              → Explore Categories
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 h-full w-12 sm:w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-6 z-10 transition-all duration-300 ease-in-out ${
        isHeaderVisible ? 'top-20' : 'top-0 pt-8'
      }`}>
        {/* Text Icon */}
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        {/* Chart Icon */}
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        {/* Plus Icon */}
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Bell Icon */}
        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.97 4.97l-8.5 8.5a1.5 1.5 0 000 2.12l4.5 4.5a1.5 1.5 0 002.12 0l8.5-8.5" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">3</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-12 sm:ml-16 px-4 py-6 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Masonry Grid */}
          <div 
            className="w-full"
            style={{ 
              columnCount: columns,
              columnGap: '16px',
              columnFill: 'balance'
            }}
          >
            {cards.map((card, index) => (
              <div key={card.id} className="break-inside-avoid mb-4">
                <MemeCard id={card.id} height={card.height} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeVerse; 