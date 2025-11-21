import React, { useState } from 'react';
import { Settings, Palette, ChevronDown, Check } from 'lucide-react';

const ConfigBar = ({ settings, onSettingsChange, theme, onThemeChange }) => {
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Helper to update a specific numeric setting
  const handleSettingChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: parseFloat(value) || 0 });
  };

  // Helper to toggle the "Apply to New" switch
  const toggleApplyToNew = () => {
    onSettingsChange({ ...settings, applyToNew: !settings.applyToNew });
  };

  // Helper to update a specific color
  const handleColorChange = (key, value) => {
    onThemeChange({ ...theme, [key]: value });
  };

  const colorOptions = [
    { label: 'Header Background', key: 'header_bg' },
    { label: 'Header Text', key: 'header_text' },
    { label: 'Category Background', key: 'category_bg' },
    { label: 'Category Text', key: 'category_text' },
    { label: 'Subcategory Background', key: 'subcategory_bg' },
    { label: 'Subcategory Text', key: 'subcategory_text' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm space-y-4 sticky top-0 z-20">
      
      {/* Top Row: Title & Theme Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Settings size={16} />
          Global Settings
        </h3>
        
        {/* Theme Selector Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light transition-colors"
          >
            <Palette size={16} />
            <span>Theme Colors</span>
            <ChevronDown size={14} />
          </button>

          {/* Dropdown Content */}
          {showThemePicker && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Customize Report Colors</h4>
              <div className="space-y-3">
                {colorOptions.map((opt) => (
                  <div key={opt.key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{opt.label}</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={theme[opt.key] || '#000000'} 
                        onChange={(e) => handleColorChange(opt.key, e.target.value)}
                        className="h-6 w-8 cursor-pointer border border-gray-300 rounded overflow-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Overlay to close when clicking outside (simple version) */}
              <div 
                className="fixed inset-0 -z-10" 
                onClick={() => setShowThemePicker(false)}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Tax %</label>
          <input 
            type="number" 
            step="0.01"
            className="input-field py-1 text-sm" 
            value={settings.tax_percent}
            onChange={(e) => handleSettingChange('tax_percent', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Waste %</label>
          <input 
            type="number" 
            step="0.01"
            className="input-field py-1 text-sm" 
            value={settings.waste_percent}
            onChange={(e) => handleSettingChange('waste_percent', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Mat. Markup %</label>
          <input 
            type="number" 
            step="0.01"
            className="input-field py-1 text-sm" 
            value={settings.markup_material_percent}
            onChange={(e) => handleSettingChange('markup_material_percent', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">AddOn Markup %</label>
          <input 
            type="number" 
            step="0.01"
            className="input-field py-1 text-sm" 
            value={settings.markup_addons_percent}
            onChange={(e) => handleSettingChange('markup_addons_percent', e.target.value)}
          />
        </div>
      </div>

      {/* Toggle Switch */}
      <div className="flex items-center gap-2 pt-1">
        <button 
          onClick={toggleApplyToNew}
          className={`
            relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
            ${settings.applyToNew ? 'bg-primary' : 'bg-gray-300'}
          `}
        >
          <span 
            className={`
              inline-block h-3 w-3 transform rounded-full bg-white transition-transform
              ${settings.applyToNew ? 'translate-x-5' : 'translate-x-1'}
            `} 
          />
        </button>
        <span className="text-xs text-gray-600">Apply global settings to new items automatically</span>
      </div>

    </div>
  );
};

export default ConfigBar;