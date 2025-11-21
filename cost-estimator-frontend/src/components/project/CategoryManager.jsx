import React, { useState } from 'react';
import { Plus, FolderPlus, Edit2, ChevronRight, Trash2, MoreHorizontal } from 'lucide-react';
import ItemForm from './ItemForm';
import api from '../../services/api';
import { toast } from 'react-toastify';
import SimpleInputModal from '../common/SimpleInputModal';
import ConfirmModal from '../common/ConfirmModal';

// 1. Accept calculatedData prop
const CategoryManager = ({ projectData, calculatedData, setProjectData, globalSettings, projectId }) => {
  
  const [editingItem, setEditingItem] = useState(null); 
  const [newItemLocation, setNewItemLocation] = useState(null); 

  // --- MODAL STATES ---
  const [inputModal, setInputModal] = useState({ 
    isOpen: false, 
    type: '', // 'create_cat', 'create_sub', 'rename_cat', 'rename_sub'
    parentId: null, 
    targetId: null, 
    initialValue: '',
    title: '' 
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '', // 'item', 'category', 'subcategory'
    id: null,
    title: '',
    message: ''
  });

  // --- API REFRESH HELPER ---
  const refreshProject = async () => {
    const refresh = await api.get(`/projects/${projectId}`);
    setProjectData(refresh.data);
  };

  // --- HANDLERS FOR INPUT MODAL ---
  const openCreateCategory = () => {
    setInputModal({ isOpen: true, type: 'create_cat', title: 'New Category', placeholder: 'e.g. FLOORING' });
  };

  const openCreateSubcategory = (catId) => {
    setInputModal({ isOpen: true, type: 'create_sub', parentId: catId, title: 'New Subcategory', placeholder: 'e.g. Kitchen' });
  };

  const openRenameCategory = (cat) => {
    setInputModal({ isOpen: true, type: 'rename_cat', targetId: cat.id, initialValue: cat.name, title: 'Rename Category' });
  };

  const openRenameSubcategory = (sub) => {
    setInputModal({ isOpen: true, type: 'rename_sub', targetId: sub.id, initialValue: sub.name, title: 'Rename Subcategory' });
  };

  const handleInputSubmit = async (value) => {
    try {
      if (inputModal.type === 'create_cat') {
        await api.post(`/projects/${projectId}/categories`, { name: value });
      } else if (inputModal.type === 'create_sub') {
        await api.post(`/categories/${inputModal.parentId}/subcategories`, { name: value });
      } else if (inputModal.type === 'rename_cat') {
        await api.put(`/categories/${inputModal.targetId}`, { name: value });
      } else if (inputModal.type === 'rename_sub') {
        await api.put(`/subcategories/${inputModal.targetId}`, { name: value });
      }
      refreshProject();
    } catch (e) {
      toast.error("Operation failed");
    }
  };

  // --- HANDLERS FOR DELETE MODAL ---
  const confirmDeleteItem = (id) => {
    setDeleteModal({ isOpen: true, type: 'item', id, title: 'Delete Item?', message: 'This action cannot be undone.' });
  };

  const confirmDeleteCategory = (id) => {
    setDeleteModal({ isOpen: true, type: 'category', id, title: 'Delete Category?', message: 'This will delete the category and ALL items inside it.' });
  };

  const confirmDeleteSubcategory = (id) => {
    setDeleteModal({ isOpen: true, type: 'subcategory', id, title: 'Delete Subcategory?', message: 'This will delete the subcategory and ALL its items.' });
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteModal.type === 'item') await api.delete(`/items/${deleteModal.id}`);
      if (deleteModal.type === 'category') await api.delete(`/categories/${deleteModal.id}`);
      if (deleteModal.type === 'subcategory') await api.delete(`/subcategories/${deleteModal.id}`);
      
      toast.success("Deleted successfully");
      refreshProject();
      
      // If we deleted an item being edited, close edit mode
      if (deleteModal.type === 'item' && editingItem?.item.id === deleteModal.id) {
        setEditingItem(null);
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  // --- ITEM HANDLERS ---
  const handleAddItem = async (itemData, location) => {
    try {
      const payload = {
        ...itemData,
        category_id: location.type === 'category' ? location.id : location.categoryId,
        subcategory_id: location.type === 'subcategory' ? location.id : null,
      };
      await api.post(`/projects/${projectId}/items`, payload);
      refreshProject();
      setNewItemLocation(null);
      toast.success("Item added");
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      await api.put(`/items/${itemData.id}`, itemData);
      refreshProject();
      setEditingItem(null);
      toast.success("Item updated");
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  // --- ITEM ROW RENDERER ---
  const ItemRow = ({ item, parentContext }) => (
    <div 
      className="group bg-white hover:bg-blue-50 border-b border-gray-100 cursor-pointer transition-colors"
      onClick={() => setEditingItem({ item, parentContext })}
    >
      <div className="grid grid-cols-[30px_60px_1fr_140px_30px] gap-2 px-3 py-3 items-center">
        <div className="text-gray-500 font-mono text-xs font-bold text-center">{item.item_no}</div>
        <div className="text-xs font-medium text-gray-500 truncate" title={item.tag_spec}>{item.tag_spec || '—'}</div>
        <div className="text-sm text-gray-800 font-medium truncate" title={item.description}>{item.description || 'No Description'}</div>
        <div className="text-sm font-bold text-primary text-right whitespace-nowrap overflow-hidden text-ellipsis" title={`$${item.total_client_cost}`}>
          ${item.total_client_cost?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
        <div className="flex justify-end">
          <Edit2 size={16} className="text-gray-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
        </div>
      </div>
    </div>
  );

  const dataToRender = calculatedData || projectData;

  return (
    <div className="space-y-6 p-6">
      
      {/* Categories Loop */}
      {dataToRender.categories?.map(cat => (
        <div key={cat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* CATEGORY HEADER */}
          <div className="bg-green-50/50 p-3 flex items-center justify-between border-b border-green-100 group h-12">
            
            {/* Left Side: Name & Edit Actions */}
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
              {/* Name Truncated */}
              <h3 className="font-bold text-primary uppercase tracking-wide text-sm truncate" title={cat.name}>
                {cat.name}
              </h3>
              
              {/* Edit/Delete Buttons - Fixed Width container so layout doesn't jump */}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity border-l border-gray-300 pl-2 gap-1 flex-shrink-0">
                <button onClick={(e) => {e.stopPropagation(); openRenameCategory(cat)}} className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50" title="Rename Category">
                  <Edit2 size={16} /> {/* Bigger Icon */}
                </button>
                <button onClick={(e) => {e.stopPropagation(); confirmDeleteCategory(cat.id)}} className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-red-50" title="Delete Category">
                  <Trash2 size={16} /> {/* Bigger Icon */}
                </button>
              </div>
            </div>

            {/* Right Side: Add Buttons (Always Visible) */}
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={(e) => {e.stopPropagation(); openCreateSubcategory(cat.id)}} className="flex items-center gap-1 px-2 py-1 hover:bg-white rounded text-xs text-gray-600 border border-transparent hover:border-gray-200 transition-all whitespace-nowrap" title="Add Subcategory">
                <FolderPlus size={14} /> <span className="hidden sm:inline">Subcat</span>
              </button>
              <button onClick={(e) => {e.stopPropagation(); setNewItemLocation({ type: 'category', id: cat.id })}} className="flex items-center gap-1 px-2 py-1 hover:bg-white rounded text-xs text-gray-600 border border-transparent hover:border-gray-200 transition-all whitespace-nowrap" title="Add Item">
                <Plus size={14} /> <span className="hidden sm:inline">Item</span>
              </button>
            </div>
          </div>

          {/* Direct Items */}
          <div className="divide-y divide-gray-50">
            {cat.items.map(item => 
              editingItem?.item.id === item.id ? (
                <div className="p-2 bg-gray-50" key={item.id}>
                  <ItemForm 
                    initialData={item} 
                    globalSettings={globalSettings}
                    onSave={handleUpdateItem} 
                    onCancel={() => setEditingItem(null)}
                    onDelete={() => confirmDeleteItem(item.id)}
                  />
                </div>
              ) : (
                <ItemRow key={item.id} item={item} parentContext={{ type: 'category', id: cat.id }} />
              )
            )}
            
            {/* New Item Form (Direct) */}
            {newItemLocation?.type === 'category' && newItemLocation.id === cat.id && (
              <div className="p-3 bg-blue-50/30">
                <div className="mb-2 text-xs font-bold text-primary uppercase">Adding New Item to {cat.name}</div>
                <ItemForm 
                  isNew={true}
                  initialData={{}} 
                  globalSettings={globalSettings}
                  onSave={(data) => handleAddItem(data, newItemLocation)}
                  onCancel={() => setNewItemLocation(null)}
                />
              </div>
            )}
          </div>

          {/* Subcategories Loop */}
          {cat.subcategories?.map(sub => (
            <div key={sub.id} className="ml-4 border-l-2 border-gray-100 my-2">
              
              {/* SUBCATEGORY HEADER */}
              <div className="bg-gray-50 p-2 flex items-center justify-between rounded-r pr-3 group h-10">
                
                {/* Left Side */}
                <div className="flex items-center gap-2 pl-2 flex-1 min-w-0 pr-2">
                   <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                   
                   {/* Name Truncated */}
                   <span className="font-bold text-sm text-gray-600 truncate" title={sub.name}>
                     {sub.name}
                   </span>
                   
                   {/* Edit/Delete Buttons */}
                   <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 gap-1 flex-shrink-0 border-l border-gray-300 pl-2">
                      <button onClick={(e) => {e.stopPropagation(); openRenameSubcategory(sub)}} className="p-1 text-gray-400 hover:text-blue-600" title="Rename Subcategory">
                        <Edit2 size={14} /> {/* Bigger Icon */}
                      </button>
                      <button onClick={(e) => {e.stopPropagation(); confirmDeleteSubcategory(sub.id)}} className="p-1 text-gray-400 hover:text-red-600" title="Delete Subcategory">
                        <Trash2 size={14} /> {/* Bigger Icon */}
                      </button>
                   </div>
                </div>

                {/* Right Side */}
                <button onClick={() => setNewItemLocation({ type: 'subcategory', id: sub.id, categoryId: cat.id })} className="p-1 hover:bg-white rounded text-gray-500 hover:text-primary flex-shrink-0">
                  <Plus size={14} />
                </button>
              </div>

              {/* Subcategory Items */}
              <div className="divide-y divide-gray-50">
                {sub.items.map(item => 
                   editingItem?.item.id === item.id ? (
                    <div className="p-2 bg-gray-50" key={item.id}>
                      <ItemForm 
                        initialData={item} 
                        globalSettings={globalSettings}
                        onSave={handleUpdateItem} 
                        onCancel={() => setEditingItem(null)}
                        onDelete={() => confirmDeleteItem(item.id)}
                      />
                    </div>
                   ) : (
                    <ItemRow key={item.id} item={item} parentContext={{ type: 'subcategory', id: sub.id }} />
                   )
                )}

                {/* New Item Form (Subcategory) */}
                {newItemLocation?.type === 'subcategory' && newItemLocation.id === sub.id && (
                  <div className="p-3 bg-blue-50/30 ml-2">
                     <div className="mb-2 text-xs font-bold text-primary uppercase">Adding New Item to {sub.name}</div>
                     <ItemForm 
                      isNew={true}
                      initialData={{}} 
                      globalSettings={globalSettings}
                      onSave={(data) => handleAddItem(data, newItemLocation)}
                      onCancel={() => setNewItemLocation(null)}
                    />
                  </div>
                )}
              </div>

            </div>
          ))}

        </div>
      ))}

      {/* Add Category Button */}
      <button 
        onClick={openCreateCategory}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 font-bold hover:border-primary hover:text-primary hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Add New Category
      </button>

      {/* --- MODALS --- */}
      <SimpleInputModal 
        isOpen={inputModal.isOpen}
        onClose={() => setInputModal(prev => ({ ...prev, isOpen: false }))}
        title={inputModal.title}
        placeholder={inputModal.placeholder}
        initialValue={inputModal.initialValue}
        onSubmit={handleInputSubmit}
      />

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        title={deleteModal.title}
        message={deleteModal.message}
        onConfirm={handleDeleteConfirm}
      />

    </div>
  );
};

export default CategoryManager;