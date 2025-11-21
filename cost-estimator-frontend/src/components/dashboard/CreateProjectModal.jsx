import React, { useState, useCallback } from 'react';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    project_name: '',
    company_name: '',
    project_address: '',
    architect_info: '',
    project_date: new Date().toISOString().split('T')[0], // Default to today
    revision: '1'
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Dropzone Logic ---
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      // Create a local preview URL
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxFiles: 1,
    multiple: false
  });

  const removeLogo = (e) => {
    e.stopPropagation();
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview); // Clean up memory
      setLogoPreview(null);
    }
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Step 1: Create the Project
      const projectResponse = await api.post('/projects/', formData);
      const projectId = projectResponse.data.id;

      // Step 2: Upload Logo (if exists)
      if (logoFile) {
        const uploadData = new FormData();
        uploadData.append('file', logoFile);
        
        await api.post(`/projects/${projectId}/logo/`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success("Project created successfully!");
      onProjectCreated(); // Refresh dashboard list
      onClose(); // Close modal
      
      // Reset form
      setFormData({
        project_name: '',
        company_name: '',
        project_address: '',
        architect_info: '',
        project_date: new Date().toISOString().split('T')[0],
        revision: '1'
      });
      setLogoFile(null);
      setLogoPreview(null);

    } catch (error) {
      console.error(error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl flex flex-col max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-primary">Create New Project</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6">
          <form id="createProjectForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. ACME Corp"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. 107 Morgan St"
                  value={formData.project_name}
                  onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                />
              </div>
            </div>

            {/* Row 2: Address & Architect */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Address</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="City, State"
                  value={formData.project_address}
                  onChange={(e) => setFormData({...formData, project_address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Architect Info</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Architect Firm Name"
                  value={formData.architect_info}
                  onChange={(e) => setFormData({...formData, architect_info: e.target.value})}
                />
              </div>
            </div>

            {/* Row 3: Date & Revision */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.project_date}
                  onChange={(e) => setFormData({...formData, project_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                <input
                  type="text"
                  className="input-field bg-gray-50 text-gray-500"
                  value={formData.revision}
                  readOnly // Initial creation is always Revision 1
                />
              </div>
            </div>

            {/* Logo Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              
              {!logoPreview ? (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Upload size={32} className="text-gray-400" />
                    <p className="text-sm font-medium">
                      {isDragActive ? "Drop the logo here" : "Drag & drop logo, or click to select"}
                    </p>
                    <p className="text-xs text-gray-400">Supports JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden group">
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="max-h-full max-w-full object-contain" 
                  />
                  {/* Overlay with Delete Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Remove Logo"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="createProjectForm"
            className="btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateProjectModal;