import React from 'react';

// Format Helpers
const formatCurrency = (val) => {
  if (val === undefined || val === null) return '$0.00';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (val) => {
  if (val === undefined || val === null) return '0.00%';
  return `${Number(val).toFixed(2)}%`;
};

const LivePreview = ({ projectData, theme }) => {
  if (!projectData) return null;

  const { project, categories, totals } = projectData;
  const logoUrl = project.logo_url ? `${import.meta.env.VITE_API_URL}/${project.logo_url}` : null;

  // SCALE CONFIGURATION
  // 0.72 allows us to use 7.5pt font while fitting 29 columns
  const SCALE_FACTOR = 0.72; 
  const WRAPPER_WIDTH = `${(100 / SCALE_FACTOR)}%`;

  // Revision fallback
  const revisionValue = project.revision_counter !== undefined ? project.revision_counter : (project.revision || '0');

  return (
    <div 
      id="pdf-preview-root"
      style={{
        width: '29.7cm',      
        minHeight: '21cm',    
        padding: '0.5cm',
        boxSizing: 'border-box',
        backgroundColor: 'white',
        margin: '0 auto',
        cursor: 'default',
        overflow: 'hidden', 
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}
    >
      {/* INJECT BACKEND STYLES */}
      <style>{`
        /* Reset Styles */
        .shrink-wrapper table, .shrink-wrapper th, .shrink-wrapper td {
          /* INCREASED TEXT SIZE */
          font-size: 7.5pt !important; 
          line-height: 1.25 !important;
        }

        /* Table Layout */
        .estimate-table { 
          width: 100%; 
          border-collapse: collapse; 
          table-layout: auto !important; 
        }
        
        .estimate-table th, .estimate-table td { 
          border: 1px solid #ccc; 
          padding: 4px 3px !important; /* Slightly tighter side padding to accommodate bigger text */
          vertical-align: middle; 
        }
        
        /* --- HEADERS --- */
        .estimate-table th { 
          text-align: center; 
          vertical-align: bottom; 
          background-color: ${theme.header_bg}; 
          color: ${theme.header_text}; 
          font-weight: bold;
          font-size: 7pt !important; /* Headers slightly smaller to wrap nicely */
        }

        /* Header Layout Rules */
        .th-force-break {
            white-space: normal !important;
            word-spacing: 1000px; 
            line-height: 1.1 !important;
        }
        .th-nowrap { white-space: nowrap !important; }
        .th-wrap { white-space: normal !important; word-break: normal; }

        /* --- DATA CELLS --- */
        .td-numeric { text-align: center; white-space: nowrap !important; width: 1%; }
        .td-text { text-align: left; white-space: normal !important; word-wrap: break-word; word-break: break-word; }
        .td-uom { text-align: center; white-space: normal !important; word-break: break-word; min-width: 30px; }

        /* --- COLUMN SIZING --- */
        .col-item { width: 35px; min-width: 35px; }
        .col-cost { min-width: 50px; } 
        
        /* NARROWER MARKUP COLUMN */
        /* Reduced from 55px to 40px. Headers will stack vertically. */
        .col-markup { width: 40px; min-width: 40px; }
        
        .col-addon-markup { min-width: 65px; }
        .col-desc { max-width: 110px; }
        .col-prod { max-width: 70px; }

        /* Colors */
        .category-row td { background-color: ${theme.category_bg}; color: ${theme.category_text}; font-weight: bold; font-size: 8.5pt !important; }
        .subcategory-row td { background-color: ${theme.subcategory_bg}; color: ${theme.subcategory_text}; font-weight: bold; padding-left: 15px !important; }
        .totals-row td { background-color: ${theme.header_bg}; font-weight: bold; font-size: 8.5pt !important; border-top: 2px solid #000; }
        .totals-label { text-align: right; font-weight: bold; }
      `}</style>
      
      {/* SCALE WRAPPER */}
      <div className="shrink-wrapper" style={{ 
        transform: `scale(${SCALE_FACTOR})`, 
        transformOrigin: 'top left', 
        width: WRAPPER_WIDTH 
      }}>
        
        {/* HEADER SECTION */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '150px 1fr 150px',
          alignItems: 'center', 
          borderBottom: '2px solid #000', 
          paddingBottom: '10px', 
          marginBottom: '15px', 
          minHeight: '80px' 
        }}>
          
          {/* LEFT: LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Logo" 
                style={{ 
                  maxWidth: '100%',     
                  maxHeight: '100px',   
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={(e) => e.target.style.display = 'none'} 
              />
            )}
          </div>

          {/* CENTER: PROJECT TEXT */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase' }}>{project.company_name}</h1>
            <p style={{ margin: '2px 0', fontSize: '9pt' }}><strong>Project:</strong> {project.project_name}</p>
            <p style={{ margin: '2px 0', fontSize: '9pt' }}><strong>Address:</strong> {project.project_address}</p>
            
            <p style={{ margin: '2px 0', fontSize: '9pt' }}><strong>Architect:</strong> {project.architect_info}</p>
            <p style={{ margin: '2px 0', fontSize: '9pt' }}><strong>Date:</strong> {project.project_date}</p>
            <p style={{ margin: '2px 0', fontSize: '9pt' }}><strong>Revision:</strong> {revisionValue}</p>
          </div>

          {/* RIGHT: SPACER */}
          <div></div>

        </div>

        {/* TABLE */}
        <table className="estimate-table">
          <thead>
            <tr>
              <th className="th-wrap col-item">Item No</th>
              <th className="th-wrap">Tag/ Spec</th>
              <th className="th-wrap col-desc">Description</th>
              <th className="th-nowrap">Location</th>
              <th className="th-wrap col-prod">Product Info</th>
              <th className="th-wrap">Manufacturer</th>
              <th className="th-nowrap">UoM</th>
              <th className="th-wrap">Material Qty</th>
              <th className="th-wrap">Waste %</th>
              <th className="th-wrap">Waste Qty</th>
              <th className="th-wrap">Attic %</th>
              <th className="th-force-break">Attic Qty</th>
              <th className="th-force-break">Total Qty</th>
              <th className="th-nowrap col-cost">Material</th>
              <th className="th-nowrap col-cost">Adhesive</th>
              <th className="th-nowrap col-cost">Freight</th>
              <th className="th-nowrap col-cost">Receiving</th>
              <th className="th-nowrap col-cost">Delivery</th>
              <th className="th-nowrap col-cost">Labor</th>
              <th className="th-wrap">Total AddOn</th>
              <th className="th-wrap">Total Material Cost</th>
              <th className="th-wrap">Tax %</th>
              <th className="th-nowrap">Tax</th>
              <th className="th-wrap">URBAN Total + Tax</th>
              
              {/* MARKUP COLUMN (Narrower) */}
              <th className="th-wrap col-markup">Mark up Material %</th>
              
              <th className="th-wrap">Material Markup</th>
              <th className="th-wrap">Mark up Add On %</th>
              <th className="th-wrap col-addon-markup">AddOn Markup</th>
              <th className="th-wrap">Total Cost to Client</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map(cat => (
              <React.Fragment key={cat.name}>
                <tr className="category-row">
                  <td colSpan="29">{cat.name}</td>
                </tr>
                {cat.items?.map(item => <ItemRow key={item.item_no} item={item} />)}
                {cat.subcategories?.map(sub => (
                  <React.Fragment key={sub.name}>
                    <tr className="subcategory-row">
                      <td colSpan="29">{sub.name}</td>
                    </tr>
                    {sub.items?.map(item => <ItemRow key={item.item_no} item={item} />)}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}

            {totals && (
              <tr className="totals-row">
                <td colSpan="20" className="totals-label">GRAND TOTALS:</td>
                <td className="td-numeric">{formatCurrency(totals.total_material_cost)}</td>
                <td></td>
                <td className="td-numeric">{formatCurrency(totals.tax_amount)}</td>
                <td className="td-numeric">{formatCurrency(totals.total_plus_tax)}</td>
                <td></td>
                <td className="td-numeric">{formatCurrency(totals.markup_material)}</td>
                <td></td>
                <td className="td-numeric">{formatCurrency(totals.markup_addon)}</td>
                <td className="td-numeric">{formatCurrency(totals.total_client_cost)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ItemRow = ({ item }) => (
  <tr>
    <td className="td-numeric">{item.item_no}</td>
    <td className="td-text">{item.tag_spec}</td>
    <td className="td-text">{item.description}</td>
    <td className="td-text">{item.location}</td>
    <td className="td-text">{item.product_info}</td>
    <td className="td-text">{item.manufacturer}</td>
    <td className="td-uom">{item.unit_of_measure}</td>
    <td className="td-numeric">{Number(item.material_qty).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</td>
    <td className="td-numeric">{formatPercent(item.waste_factor_percent)}</td>
    <td className="td-numeric">{Number(item.waste_qty).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</td>
    <td className="td-numeric">{formatPercent(item.attic_stock_percent)}</td>
    <td className="td-numeric">{Number(item.attic_qty).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</td>
    <td className="td-numeric">{Number(item.total_qty).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</td>
    <td className="td-numeric">{formatCurrency(item.unit_cost_material)}</td>
    <td className="td-numeric">{formatCurrency(item.unit_cost_adhesive)}</td>
    <td className="td-numeric">{formatCurrency(item.unit_cost_freight)}</td>
    <td className="td-numeric">{formatCurrency(item.unit_cost_receiving)}</td>
    <td className="td-numeric">{formatCurrency(item.unit_cost_delivery)}</td>
    <td className="td-numeric">{formatCurrency(item.unit_cost_labor)}</td>
    <td className="td-numeric">{formatCurrency(item.total_addon)}</td>
    <td className="td-numeric">{formatCurrency(item.total_material_cost)}</td>
    <td className="td-numeric">{formatPercent(item.tax_percent)}</td>
    <td className="td-numeric">{formatCurrency(item.tax_amount)}</td>
    <td className="td-numeric">{formatCurrency(item.urban_total_plus_tax)}</td>
    <td className="td-numeric">{formatPercent(item.markup_material_percent)}</td>
    <td className="td-numeric">{formatCurrency(item.markup_material)}</td>
    <td className="td-numeric">{formatPercent(item.markup_addons_percent)}</td>
    <td className="td-numeric">{formatCurrency(item.markup_addon)}</td>
    <td className="td-numeric">{formatCurrency(item.total_client_cost)}</td>
  </tr>
);

export default LivePreview;