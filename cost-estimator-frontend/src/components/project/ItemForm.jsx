import React, { useEffect, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { calculateItemTotals } from '../../utils/calculations';

// --- 1. UPDATED FORM INPUT ---
const FormInput = ({ label, name, type = "text", value, onChange, className = "", ...props }) => {
  
  // Prevent invalid characters for number inputs
  const handleKeyDown = (e) => {
    if (type === 'number') {
      // Block e, E, +, -
      if (['e', 'E', '+', '-'].includes(e.key)) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className={className}>
      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 truncate" title={label}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        step="0.01"
        min="0" // Prevent negatives via spinner
        value={value || ''}
        onChange={onChange}
        onKeyDown={handleKeyDown} // Block invalid chars
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white"
        {...props}
      />
    </div>
  );
};

const ItemForm = ({ initialData, globalSettings, onSave, onCancel, onDelete, isNew = false }) => {
  
  const [formData, setFormData] = useState(() => {
    if (isNew && globalSettings.applyToNew) {
      return {
        ...initialData,
        tax_percent: globalSettings.tax_percent,
        waste_factor_percent: globalSettings.waste_percent,
        attic_stock_percent: globalSettings.attic_percent,
        markup_material_percent: globalSettings.markup_material_percent,
        markup_addons_percent: globalSettings.markup_addons_percent,
      };
    }
    return initialData;
  });

  useEffect(() => {
    if (isNew && globalSettings.applyToNew) {
      setFormData(prev => ({
        ...prev,
        tax_percent: globalSettings.tax_percent,
        waste_factor_percent: globalSettings.waste_percent,
        attic_stock_percent: globalSettings.attic_percent,
        markup_material_percent: globalSettings.markup_material_percent,
        markup_addons_percent: globalSettings.markup_addons_percent,
      }));
    }
  }, [globalSettings, isNew]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Extra safety: prevent negative numbers logic if pasted
    if (e.target.type === 'number' && parseFloat(value) < 0) return; 
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const calculated = calculateItemTotals(formData);
    onSave(calculated);
  };

  const currentTotals = calculateItemTotals(formData);

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-primary/10 shadow-lg mb-4 relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Section 1: Basic Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FormInput label="Tag/Spec" name="tag_spec" value={formData.tag_spec} onChange={handleChange} />
          <div className="col-span-2">
            <FormInput label="Description" name="description" value={formData.description} onChange={handleChange} />
          </div>
          <FormInput label="Location" name="location" value={formData.location} onChange={handleChange} />
          <div className="col-span-2">
            <FormInput label="Product Info" name="product_info" value={formData.product_info} onChange={handleChange} />
          </div>
          <FormInput label="Manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
          <FormInput label="UoM" name="unit_of_measure" value={formData.unit_of_measure} onChange={handleChange} />
        </div>

        <div className="h-px bg-gray-100 my-2" />

        {/* Section 2: Quantities & Costs */}
        {/* 
            LAYOUT UPDATE: 
            - Material Qty takes 2 columns (Double Size).
            - Waste/Attic take 1 column.
            - Mat Cost/Labor take 1 column.
        */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-gray-50 p-3 rounded-md">
          
          {/* Row 1: Quantities */}
          <FormInput className="col-span-2" label="Mat. Qty" name="material_qty" type="number" value={formData.material_qty} onChange={handleChange} />
          <FormInput label="Waste %" name="waste_factor_percent" type="number" value={formData.waste_factor_percent} onChange={handleChange} />
          <FormInput label="Attic %" name="attic_stock_percent" type="number" value={formData.attic_stock_percent} onChange={handleChange} />
          
          {/* Major Costs */}
          <FormInput label="Mat. Cost" name="unit_cost_material" type="number" value={formData.unit_cost_material} onChange={handleChange} />
          <FormInput label="Labor" name="unit_cost_labor" type="number" value={formData.unit_cost_labor} onChange={handleChange} />
        </div>

        {/* Minor Costs (Small Inputs Row) */}
        <div className="grid grid-cols-4 gap-2 px-3 pb-3 bg-gray-50 rounded-b-md -mt-2">
          <FormInput label="Adhesive" name="unit_cost_adhesive" type="number" value={formData.unit_cost_adhesive} onChange={handleChange} />
          <FormInput label="Freight" name="unit_cost_freight" type="number" value={formData.unit_cost_freight} onChange={handleChange} />
          <FormInput label="Receiving" name="unit_cost_receiving" type="number" value={formData.unit_cost_receiving} onChange={handleChange} />
          <FormInput label="Delivery" name="unit_cost_delivery" type="number" value={formData.unit_cost_delivery} onChange={handleChange} />
        </div>

        {/* Section 3: Financials */}
        <div className="grid grid-cols-3 gap-3 bg-blue-50 p-3 rounded-md items-end">
          <FormInput label="Tax %" name="tax_percent" type="number" value={formData.tax_percent} onChange={handleChange} />
          <FormInput label="Mat. Markup %" name="markup_material_percent" type="number" value={formData.markup_material_percent} onChange={handleChange} />
          <FormInput label="AddOn Markup %" name="markup_addons_percent" type="number" value={formData.markup_addons_percent} onChange={handleChange} />
        </div>
        
        {/* Final Cost Display */}
        <div className="flex justify-end bg-primary/5 p-3 rounded-md border border-primary/10">
           <div className="text-right">
             <span className="text-xs font-bold text-gray-500 uppercase block">Total Cost to Client</span>
             <span className="text-2xl font-extrabold text-primary">
               ${currentTotals.total_client_cost?.toLocaleString('en-US', {minimumFractionDigits: 2})}
             </span>
           </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          {onDelete && !isNew ? (
            <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors flex items-center gap-2 font-bold text-sm">
              <Trash2 size={18} /> DELETE ITEM
            </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2 text-sm py-2 px-6 font-bold shadow-md">
              <Save size={16} /> Save Item
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;