import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProjectLayout = ({ leftPanel, rightPanel }) => {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      
      {/* LEFT PANEL (Input) */}
      <div 
        className={`
          bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative
          ${isLeftPanelOpen ? 'w-full md:w-1/2 lg:w-[45%]' : 'w-0 opacity-0 overflow-hidden'}
        `}
      >
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {leftPanel}
        </div>
      </div>

      {/* TOGGLE BUTTON (Floating) */}
      <button
        onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        className={`
          absolute top-1/2 z-30 -translate-y-1/2 flex h-10 w-6 items-center justify-center rounded-r-md bg-white border border-l-0 border-gray-300 shadow-md hover:bg-gray-50 hover:text-primary transition-all
          ${isLeftPanelOpen ? 'left-[100%] md:left-[50%] lg:left-[45%]' : 'left-0 rounded-l-none rounded-r-md'}
        `}
        title={isLeftPanelOpen ? "Maximize Preview" : "Show Inputs"}
      >
        {isLeftPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* RIGHT PANEL (Preview) */}
      <div 
        className={`
          flex-1 bg-gray-200 overflow-hidden flex flex-col transition-all duration-300 relative
          ${isLeftPanelOpen ? 'hidden md:flex' : 'flex w-full'}
        `}
      >
        {/* Just render the panel, let the panel handle its own scrolling/padding */}
        {rightPanel}
      </div>
    

    </div>
  );
};

export default ProjectLayout;