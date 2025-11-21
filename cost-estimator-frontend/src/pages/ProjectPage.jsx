import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FileText, FileSpreadsheet, Edit } from 'lucide-react'; 
import api from '../services/api';

import Header from '../components/common/Header';
import ProjectLayout from '../components/project/ProjectLayout';
import ConfigBar from '../components/project/ConfigBar';
import CategoryManager from '../components/project/CategoryManager';
import LivePreview from '../components/project/LivePreview';
import EditProjectModal from '../components/dashboard/EditProjectModal'; 
import { calculateItemTotals } from '../utils/calculations';

const ProjectPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 

  // Global Inputs
  const [globalSettings, setGlobalSettings] = useState({
    tax_percent: 6.60,
    waste_percent: 10.00,
    attic_percent: 2.00,
    markup_material_percent: 10.00,
    markup_addons_percent: 25.00,
    applyToNew: true
  });

  const [theme, setTheme] = useState({
    header_bg: '#f0f0f0',
    header_text: '#000000',
    item_text: '#333333',
    category_bg: '#d9ead3',
    category_text: '#000000',
    subcategory_bg: '#e0e0e0',
    subcategory_text: '#000000'
  });

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}/`);
      setProjectData(response.data);
    } catch (error) {
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  // --- Export Logic (Updated with Loading Toast) ---
  const handleExport = async (type) => {
    if (isExporting) return;
    setIsExporting(true);
    
    const label = type === 'pdf' ? 'PDF' : 'Excel';
    
    // 1. Start Loading Toast
    const toastId = toast.loading(`Generating ${label}... Please wait.`);

    try {
      const endpoint = `/projects/${id}/export/${type}/`;
      const payload = { colors: theme, custom_filename: '' };
      const response = await api.post(endpoint, payload, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Estimate.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      if (contentDisposition) {
        const matches = /filename\*=utf-8''(.+)/.exec(contentDisposition);
        if (matches && matches[1]) filename = decodeURIComponent(matches[1]);
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // 2. Update Toast to Success
      toast.update(toastId, { 
        render: `${label} Saved Successfully!`, 
        type: "success", 
        isLoading: false,
        autoClose: 3000 
      });

    } catch (error) {
      console.error(error);
      // 3. Update Toast to Error
      toast.update(toastId, { 
        render: `Failed to generate ${label}`, 
        type: "error", 
        isLoading: false,
        autoClose: 3000 
      });
    } finally {
      setIsExporting(false);
    }
  };

  // --- Preview Calc Logic ---
  const calculatedProjectData = useMemo(() => {
    if (!projectData) return null;
    let globalItemCounter = 1;
    const processedCategories = [];
    const grandTotals = {
      total_material_cost: 0, tax_amount: 0, total_plus_tax: 0,
      markup_material: 0, markup_addon: 0, total_client_cost: 0
    };
    const addToTotals = (calcItem) => {
      grandTotals.total_material_cost += calcItem.total_material_cost;
      grandTotals.tax_amount += calcItem.tax_amount;
      grandTotals.total_plus_tax += calcItem.urban_total_plus_tax;
      grandTotals.markup_material += calcItem.markup_material;
      grandTotals.markup_addon += calcItem.markup_addon;
      grandTotals.total_client_cost += calcItem.total_client_cost;
    };

    projectData.categories.forEach(cat => {
      const newCat = { ...cat, items: [], subcategories: [] };
      cat.items.forEach(item => {
        const calc = calculateItemTotals(item);
        calc.item_no = globalItemCounter++;
        addToTotals(calc);
        newCat.items.push(calc);
      });
      cat.subcategories.forEach(sub => {
        const newSub = { ...sub, items: [] };
        sub.items.forEach(item => {
           const calc = calculateItemTotals(item);
           calc.item_no = globalItemCounter++;
           addToTotals(calc);
           newSub.items.push(calc);
        });
        newCat.subcategories.push(newSub);
      });
      processedCategories.push(newCat);
    });
    return { project: projectData, categories: processedCategories, totals: grandTotals };
  }, [projectData]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!projectData) return <div className="p-10 text-center">Project Not Found</div>;

  // --- Left Panel ---
  const LeftPanelContent = (
    <div className="min-h-full pb-20 bg-white">
      {/* HEADER SECTION */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start gap-4">
          
          {/* Project Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary truncate" title={projectData.project_name}>
                {projectData.project_name}
              </h1>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-gray-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
                title="Edit Project Details"
              >
                <Edit size={18} />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 truncate" title={projectData.project_address}>
              {projectData.project_address || "No Address Set"}
            </p>
            
            <div className="flex gap-2 mt-1">
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                Rev: {projectData.revision}
              </span>
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                {projectData.project_date}
              </span>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
             <button 
               onClick={() => handleExport('pdf')}
               disabled={isExporting}
               className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded border transition-colors w-[110px] ${isExporting ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'}`} 
             >
               <FileText size={14} /> {isExporting ? 'Saving...' : 'Save PDF'}
             </button>
             <button 
               onClick={() => handleExport('excel')}
               disabled={isExporting}
               className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded border transition-colors w-[110px] ${isExporting ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'}`} 
             >
               <FileSpreadsheet size={14} /> {isExporting ? 'Saving...' : 'Save Excel'}
             </button>
          </div>

        </div>
      </div>

      <ConfigBar 
        settings={globalSettings} 
        onSettingsChange={setGlobalSettings}
        theme={theme}
        onThemeChange={setTheme}
      />

      <CategoryManager 
        projectData={projectData} 
        calculatedData={calculatedProjectData}
        setProjectData={setProjectData}
        globalSettings={globalSettings}
        projectId={id}
      />
    </div>
  );

  const RightPanelContent = (
    <div className="w-full h-full bg-gray-200 overflow-auto flex items-start p-4 sm:p-8">
      <div 
        className="origin-top transition-transform duration-300 ease-out shadow-2xl mx-auto bg-white" 
        style={{
          transform: `scale(1.0)`
        }}
      >
        <LivePreview projectData={calculatedProjectData} theme={theme} />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      <Header />
      <ProjectLayout leftPanel={LeftPanelContent} rightPanel={RightPanelContent} />
      
      <EditProjectModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        projectData={projectData}
        onProjectUpdated={fetchProject}
      />
    </div>
  );
};

export default ProjectPage;