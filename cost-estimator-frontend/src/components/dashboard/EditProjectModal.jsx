import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import api from '../../services/api';

const EditProjectModal = ({ isOpen, onClose, onProjectUpdated, projectData }) => {
  const [formData, setFormData] = useState({
    project_name: '',
    company_name: '',
    project_address: '',
    architect_info: '',
    project_date: '',
    revision: ''
  });
  
  const [logoFile, setLogoFile] = useState(null); // New file object
  const [logoPreview, setLogoPreview] = useState(null); // URL (string) for preview
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Initial Data when modal opens
  useEffect(() => {
    if (isOpen && projectData) {
      setFormData({
        project_name: projectData.project_name || '',
        company_name: projectData.company_name || '',
        project_address: projectData.project_address || '',
        architect_info: projectData.architect_info || '',
        project_date: projectData.project_date || '',
        revision: projectData.revision || '' // User can now manually edit revision text like "Rev 2"
      });

      // Handle existing logo
      if (projectData.logo_url) {
        setLogoPreview(`${import.meta.env.VITE_API_URL}/${projectData.logo_url}`);
      } else {
        setLogoPreview(null);
      }
      setLogoFile(null);
    }
  }, [isOpen, projectData]);

  // --- Dropzone Logic ---
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxFiles: 1,
    multiple: false
  });

  const removeLogo = (e) => {
    e.stopPropagation();
    setLogoFile(null);
    setLogoPreview(null);
    // Note: We don't explicitly delete from server here, we just won't send a new one.
    // Real-world apps might need a specific "delete logo" endpoint flag.
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Update Text Details
      await api.put(`/projects/${projectData.id}`, formData);

      // 2. Upload New Logo (Only if changed)
      if (logoFile) {
        const uploadData = new FormData();
        uploadData.append('file', logoFile);
        await api.post(`/projects/${projectData.id}/logo`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success("Project updated successfully!");
      onProjectUpdated(); 
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl flex flex-col max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-primary">Edit Project Details</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="editProjectForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  required
                  className="input-field"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  required
                  className="input-field"
                  value={formData.project_name}
                  onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  className="input-field"
                  value={formData.project_address}
                  onChange={(e) => setFormData({...formData, project_address: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Architect</label>
                <input
                  className="input-field"
                  value={formData.architect_info}
                  onChange={(e) => setFormData({...formData, architect_info: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
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
                  className="input-field"
                  value={formData.revision}
                  onChange={(e) => setFormData({...formData, revision: e.target.value})}
                />
              </div>
            </div>

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
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload size={32} className="text-gray-400" />
                    <p className="text-sm">Drag & drop logo to replace</p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center group">
                  <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={removeLogo} className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
          <button type="submit" form="editProjectForm" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;