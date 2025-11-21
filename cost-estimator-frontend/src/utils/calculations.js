// Helper to round to 2 decimals standard
const round2 = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const calculateItemTotals = (item) => {
  // 1. Parse Inputs (Handle strings/nulls safely)
  const materialQty = parseFloat(item.material_qty) || 0;
  
  // Percentages (Input as 10 for 10%, so divide by 100)
  const wasteFactor = (parseFloat(item.waste_factor_percent) || 0) / 100;
  const atticFactor = (parseFloat(item.attic_stock_percent) || 0) / 100;
  const taxFactor = (parseFloat(item.tax_percent) || 0) / 100;
  const markupMatFactor = (parseFloat(item.markup_material_percent) || 0) / 100;
  const markupAddFactor = (parseFloat(item.markup_addons_percent) || 0) / 100;

  // Unit Costs
  const cMat = parseFloat(item.unit_cost_material) || 0;
  const cAdh = parseFloat(item.unit_cost_adhesive) || 0;
  const cFre = parseFloat(item.unit_cost_freight) || 0;
  const cRec = parseFloat(item.unit_cost_receiving) || 0;
  const cDel = parseFloat(item.unit_cost_delivery) || 0;
  const cLab = parseFloat(item.unit_cost_labor) || 0;

  // 2. Math Logic (Exact Replica of Backend)
  
  // Quantities
  const wasteQty = materialQty * wasteFactor;
  const atticQty = materialQty * atticFactor;
  const totalQty = materialQty + wasteQty + atticQty;

  // Costs
  const totalAddonRate = cMat + cAdh + cFre + cRec + cDel + cLab;
  const totalMaterialCost = totalQty * cMat;
  
  const taxAmount = totalMaterialCost * taxFactor;
  const urbanTotalPlusTax = (totalQty * totalAddonRate) + taxAmount;

  // Markups
  const markupMaterialAmount = totalMaterialCost * markupMatFactor;
  const addonCostsOnly = totalAddonRate - cMat;
  const markupAddonAmount = (addonCostsOnly * totalQty) * markupAddFactor;

  const totalClientCost = urbanTotalPlusTax + markupMaterialAmount + markupAddonAmount;

  // 3. Return Object with Calculated Fields
  return {
    ...item,
    waste_qty: round2(wasteQty),
    attic_qty: round2(atticQty),
    total_qty: round2(totalQty),
    
    total_addon: round2(totalAddonRate),
    total_material_cost: round2(totalMaterialCost),
    
    tax_amount: round2(taxAmount),
    urban_total_plus_tax: round2(urbanTotalPlusTax),
    
    markup_material: round2(markupMaterialAmount),
    markup_addon: round2(markupAddonAmount),
    total_client_cost: round2(totalClientCost)
  };
};