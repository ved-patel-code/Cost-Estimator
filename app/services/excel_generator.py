import io
import os
import xlsxwriter
from PIL import Image

def generate_excel_in_memory(data: dict, config: dict) -> io.BytesIO:
    """
    Generates an Excel file in memory using XlsxWriter.
    Returns the io.BytesIO buffer containing the file.
    """
    output = io.BytesIO()
    
    # 1. Initialize Workbook in Memory
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet("Estimate")
    
    # 2. Setup Colors (Merge defaults)
    default_colors = {
        "header_bg": "#f0f0f0",
        "header_text": "#000000",
        "category_bg": "#d9ead3",
        "category_text": "#000000",
        "subcategory_bg": "#e0e0e0",
        "subcategory_text": "#000000"
    }
    user_colors = config.get('colors') or {}
    colors = {**default_colors, **user_colors}


    # 3. Define Formats
    header_fmt = workbook.add_format({
        'bold': True, 'bg_color': colors['header_bg'], 'font_color': colors['header_text'], 
        'border': 1, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True
    })
    cat_fmt = workbook.add_format({
        'bold': True, 'bg_color': colors['category_bg'], 'font_color': colors['category_text'], 
        'border': 1
    })
    subcat_fmt = workbook.add_format({
        'bold': True, 'bg_color': colors['subcategory_bg'], 'font_color': colors['subcategory_text'], 
        'border': 1, 'indent': 1
    })
    
    text_fmt = workbook.add_format({'border': 1, 'valign': 'top', 'text_wrap': True})
    num_fmt = workbook.add_format({'border': 1, 'valign': 'top', 'align': 'center'})
    currency_fmt = workbook.add_format({'border': 1, 'valign': 'top', 'num_format': '$#,##0.00', 'align': 'center'})
    percent_fmt = workbook.add_format({'border': 1, 'valign': 'top', 'num_format': '0.00"%"', 'align': 'center'})
    
    totals_fmt = workbook.add_format({
        'bold': True, 'bg_color': colors['header_bg'], 'border': 1, 
        'num_format': '$#,##0.00', 'align': 'center'
    })
    totals_label_fmt = workbook.add_format({
        'bold': True, 'bg_color': colors['header_bg'], 'border': 1, 'align': 'right'
    })

    # Project Info Formats
    proj_title_fmt = workbook.add_format({'bold': True, 'font_size': 14, 'align': 'center'})
    proj_info_fmt = workbook.add_format({'align': 'center'})

    # 4. Set Column Widths (Exact values from requirement)
    widths = [
        5,  # 0: Item No
        10, # 1: Tag/Spec
        28, # 2: Description
        15, # 3: Location
        28, # 4: Product Info
        15, # 5: Manufacturer
        5,  # 6: UoM
        14, # 7: Material Qty
        8,  # 8: Waste %
        14, # 9: Waste Qty
        8,  # 10: Attic %
        14, # 11: Attic Qty
        17, # 12: Total Qty
        10, # 13: Material Unit
        10, # 14: Adhesive Unit
        10, # 15: Freight Unit
        10, # 16: Receiving Unit
        10, # 17: Delivery Unit
        10, # 18: Labor Unit
        10, # 19: Total AddOn
        17, # 20: Total Material Cost
        8,  # 21: Tax %
        12, # 22: Tax Amt
        17, # 23: URBAN Total + Tax
        8,  # 24: MU Mat %
        17, # 25: Mat Markup
        8,  # 26: MU AddOn %
        17, # 27: AddOn Markup
        17  # 28: Total Client
    ]
    
    for i, w in enumerate(widths):
        worksheet.set_column(i, i, w)

    # 5. Header Section & Logo
    proj = data['project']
    logo_path = proj.get('logo_url')

    # Logo Logic (UPDATED to Fit Box)
    if logo_path and os.path.exists(logo_path):
        try:
            with Image.open(logo_path) as img:
                img_w, img_h = img.size
            
            # Constraints matching PDF/Frontend
            max_width = 150 
            max_height = 100
            
            # Calculate scale to fit within constraints (Contain)
            width_scale = max_width / img_w
            height_scale = max_height / img_h
            scale = min(width_scale, height_scale)
            
            worksheet.insert_image(0, 0, logo_path, {
                'x_scale': scale, 
                'y_scale': scale,
                'x_offset': 10,
                'y_offset': 7
            })
        except Exception as e:
            # Fail silently on logo error, text still renders
            print(f"Excel Logo Error: {e}")

    # Project Info Text (Centered)
    center_col_start = 3 
    center_col_end = 15
    row = 0
    
    worksheet.merge_range(row, center_col_start, row, center_col_end, proj['company_name'] or "", proj_title_fmt)
    row += 1
    worksheet.merge_range(row, center_col_start, row, center_col_end, f"Project: {proj['project_name']}", proj_info_fmt)
    row += 1
    worksheet.merge_range(row, center_col_start, row, center_col_end, f"Address: {proj['project_address'] or ''}", proj_info_fmt)
    row += 1
    worksheet.merge_range(row, center_col_start, row, center_col_end, f"Architect: {proj['architect_info'] or ''}", proj_info_fmt)
    row += 1
    worksheet.merge_range(row, center_col_start, row, center_col_end, f"Date: {proj['project_date']}", proj_info_fmt)
    row += 1
    worksheet.merge_range(row, center_col_start, row, center_col_end, f"Revision: {proj['revision_counter']}", proj_info_fmt)
    
    # Gap before table
    row += 2 

    # 6. Table Headers
    headers = [
        "Item No", "Tag/ Spec", "Description", "Location", "Product Info", "Manufacturer", "UoM",
        "Material Qty", "Waste %", "Waste Qty", "Attic %", "Attic Qty", "Total Qty",
        "Material", "Adhesive", "Freight", "Receiving", "Delivery", "Labor", "Total AddOn",
        "Total Material Cost", "Tax %", "Tax", "URBAN Total + Tax", 
        "Mark up Material %", "Material Markup", "Mark up Add On %", "AddOn Markup", "Total Cost to Client"
    ]
    for col, h in enumerate(headers):
        worksheet.write(row, col, h, header_fmt)
    row += 1

    # Helper function for writing rows
    def write_excel_item(r, item):
        worksheet.write(r, 0, item['item_no'], num_fmt)
        worksheet.write(r, 1, item['tag_spec'] or "", text_fmt)
        worksheet.write(r, 2, item['description'] or "", text_fmt)
        worksheet.write(r, 3, item['location'] or "", text_fmt)
        worksheet.write(r, 4, item['product_info'] or "", text_fmt)
        worksheet.write(r, 5, item['manufacturer'] or "", text_fmt)
        worksheet.write(r, 6, item['unit_of_measure'] or "", num_fmt)
        
        # Numbers (Using float conversion to ensure Excel compatibility if Decimal)
        worksheet.write(r, 7, float(item['material_qty']), num_fmt)
        worksheet.write(r, 8, float(item['waste_factor_percent'])/100, percent_fmt) # Excel expects 0.10 for 10%
        worksheet.write(r, 9, float(item['waste_qty']), num_fmt)
        worksheet.write(r, 10, float(item['attic_stock_percent'])/100, percent_fmt)
        worksheet.write(r, 11, float(item['attic_qty']), num_fmt)
        worksheet.write(r, 12, float(item['total_qty']), num_fmt)
        
        # Costs
        worksheet.write(r, 13, float(item['unit_cost_material']), currency_fmt)
        worksheet.write(r, 14, float(item['unit_cost_adhesive']), currency_fmt)
        worksheet.write(r, 15, float(item['unit_cost_freight']), currency_fmt)
        worksheet.write(r, 16, float(item['unit_cost_receiving']), currency_fmt)
        worksheet.write(r, 17, float(item['unit_cost_delivery']), currency_fmt)
        worksheet.write(r, 18, float(item['unit_cost_labor']), currency_fmt)
        worksheet.write(r, 19, float(item['total_addon']), currency_fmt)
        worksheet.write(r, 20, float(item['total_material_cost']), currency_fmt)
        
        # Tax
        worksheet.write(r, 21, float(item['tax_percent'])/100, percent_fmt)
        worksheet.write(r, 22, float(item['tax_amount']), currency_fmt)
        worksheet.write(r, 23, float(item['urban_total_plus_tax']), currency_fmt)
        
        # Markups
        worksheet.write(r, 24, float(item['markup_material_percent'])/100, percent_fmt)
        worksheet.write(r, 25, float(item['markup_material']), currency_fmt)
        worksheet.write(r, 26, float(item['markup_addons_percent'])/100, percent_fmt)
        worksheet.write(r, 27, float(item['markup_addon']), currency_fmt)
        worksheet.write(r, 28, float(item['total_client_cost']), currency_fmt)

    # 7. Write Data Rows
    for category in data['categories']:
        # Category Header
        worksheet.merge_range(row, 0, row, 28, category['name'], cat_fmt)
        row += 1
        
        # Direct Items
        for item in category.get('items', []):
            write_excel_item(row, item)
            row += 1
            
        # Subcategories
        for subcat in category.get('subcategories', []):
            worksheet.merge_range(row, 0, row, 28, subcat['name'], subcat_fmt)
            row += 1
            for item in subcat.get('items', []):
                write_excel_item(row, item)
                row += 1

    # 8. Grand Totals Row
    t = data['totals']
    worksheet.merge_range(row, 0, row, 19, "GRAND TOTALS:", totals_label_fmt)
    worksheet.write(row, 20, float(t['total_material_cost']), totals_fmt)
    worksheet.write_blank(row, 21, None, totals_fmt)
    worksheet.write(row, 22, float(t['tax_amount']), totals_fmt)
    worksheet.write(row, 23, float(t['total_plus_tax']), totals_fmt)
    worksheet.write_blank(row, 24, None, totals_fmt)
    worksheet.write(row, 25, float(t['markup_material']), totals_fmt)
    worksheet.write_blank(row, 26, None, totals_fmt)
    worksheet.write(row, 27, float(t['markup_addon']), totals_fmt)
    worksheet.write(row, 28, float(t['total_client_cost']), totals_fmt)

    # 9. Finalize
    workbook.close()
    output.seek(0)
    return output