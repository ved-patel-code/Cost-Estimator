from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any

# Helper to ensure 2 decimal places standard
TWOPLACES = Decimal("0.01")

def to_decimal(value: Any) -> Decimal:
    """Safely converts input to Decimal, defaulting to 0.00 if None."""
    if value is None:
        return Decimal("0.00")
    return Decimal(str(value))

def calculate_item_totals(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes a dictionary of Item Inputs.
    Returns a dictionary of Item Inputs + Calculated Results.
    """
    
    # ---------------------------------------------------------
    # 1. Extract & Normalize Inputs
    # ---------------------------------------------------------
    # Quantities
    material_qty = to_decimal(item.get('material_qty'))
    
    # Percentages (Input as 10.00 meaning 10%, so we divide by 100)
    waste_pct_input = to_decimal(item.get('waste_factor_percent'))
    attic_pct_input = to_decimal(item.get('attic_stock_percent'))
    tax_pct_input = to_decimal(item.get('tax_percent'))
    markup_mat_pct_input = to_decimal(item.get('markup_material_percent'))
    markup_add_pct_input = to_decimal(item.get('markup_addons_percent'))

    waste_factor = waste_pct_input / 100
    attic_factor = attic_pct_input / 100
    tax_factor = tax_pct_input / 100
    markup_mat_factor = markup_mat_pct_input / 100
    markup_add_factor = markup_add_pct_input / 100

    # Unit Costs
    c_mat = to_decimal(item.get('unit_cost_material'))
    c_adh = to_decimal(item.get('unit_cost_adhesive'))
    c_fre = to_decimal(item.get('unit_cost_freight'))
    c_rec = to_decimal(item.get('unit_cost_receiving'))
    c_del = to_decimal(item.get('unit_cost_delivery'))
    c_lab = to_decimal(item.get('unit_cost_labor'))

    # ---------------------------------------------------------
    # 2. The Math Logic (Exact Formulas)
    # ---------------------------------------------------------

    # --- Quantity Calculations ---
    # Formula: material_qty * percentage
    waste_qty = material_qty * waste_factor
    attic_qty = material_qty * attic_factor
    
    # Formula: waste_qty + attic_qty + material_qty
    total_qty = material_qty + waste_qty + attic_qty

    # --- Cost Calculations ---

    # Total AddOn (Rate)
    # Formula: Sum of ALL unit costs (Including Material)
    total_addon_rate = c_mat + c_adh + c_fre + c_rec + c_del + c_lab

    # Total Material Cost (Amount)
    # Formula: total_qty * unit_cost_material
    total_material_cost = total_qty * c_mat

    # Tax Amount
    # Formula: (total_qty * unit_cost_material) * tax%
    # Equivalent to: total_material_cost * tax%
    tax_amount = total_material_cost * tax_factor

    # URBAN Total + Tax (The "Cost Before Markup")
    # Formula: [total_qty * total_addon] + tax_amount
    # Note: total_addon_rate includes material cost, so this covers everything.
    urban_total_plus_tax = (total_qty * total_addon_rate) + tax_amount

    # --- Markup Calculations ---

    # Material Markup (Amount)
    # Formula: total_material_cost * markup_material_pct
    markup_material_amount = total_material_cost * markup_mat_factor

    # AddOn Markup (Amount)
    # Formula: { ( total_addon - material_cost ) * total_qty } * markup_addon_pct
    # This isolates the non-material costs, scales them by quantity, and applies markup.
    addon_costs_only = total_addon_rate - c_mat
    markup_addon_amount = (addon_costs_only * total_qty) * markup_add_factor

    # --- Final Total ---
    
    # Total Cost to Client
    # Formula: urban_total_plus_tax + markup_material + markup_addon
    total_client_cost = urban_total_plus_tax + markup_material_amount + markup_addon_amount

    # ---------------------------------------------------------
    # 3. Return Dictionary with Rounded Values
    # ---------------------------------------------------------
    # We use .quantize(TWOPLACES, rounding=ROUND_HALF_UP) for standard currency rounding
    
    return {
        # Pass through originals (converted to float/str for JSON serialization if needed)
        **item,
        
        # Calculated Fields (Rounded to 2 decimals for display)
        "waste_qty": waste_qty.quantize(TWOPLACES, ROUND_HALF_UP),
        "attic_qty": attic_qty.quantize(TWOPLACES, ROUND_HALF_UP),
        "total_qty": total_qty.quantize(TWOPLACES, ROUND_HALF_UP),
        
        "total_addon": total_addon_rate.quantize(TWOPLACES, ROUND_HALF_UP),
        "total_material_cost": total_material_cost.quantize(TWOPLACES, ROUND_HALF_UP),
        
        "tax_amount": tax_amount.quantize(TWOPLACES, ROUND_HALF_UP),
        "urban_total_plus_tax": urban_total_plus_tax.quantize(TWOPLACES, ROUND_HALF_UP),
        
        "markup_material": markup_material_amount.quantize(TWOPLACES, ROUND_HALF_UP),
        "markup_addon": markup_addon_amount.quantize(TWOPLACES, ROUND_HALF_UP),
        "total_client_cost": total_client_cost.quantize(TWOPLACES, ROUND_HALF_UP)
    }

def calculate_grand_totals(items_data: list) -> dict:
    """
    Aggregates the calculated totals from a list of processed items.
    """
    totals = {
        "total_material_cost": Decimal("0.00"),
        "tax_amount": Decimal("0.00"),
        "total_plus_tax": Decimal("0.00"), # This is Urban Total + Tax
        "markup_material": Decimal("0.00"),
        "markup_addon": Decimal("0.00"),
        "total_client_cost": Decimal("0.00")
    }

    for item in items_data:
        totals["total_material_cost"] += item["total_material_cost"]
        totals["tax_amount"] += item["tax_amount"]
        totals["total_plus_tax"] += item["urban_total_plus_tax"]
        totals["markup_material"] += item["markup_material"]
        totals["markup_addon"] += item["markup_addon"]
        totals["total_client_cost"] += item["total_client_cost"]

    return totals