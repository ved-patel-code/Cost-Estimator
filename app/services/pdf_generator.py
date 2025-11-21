import os
import base64
import jinja2
from playwright.async_api import async_playwright

# Helper Functions for Formatting
def format_currency(value):
    """Formats decimal to $1,234.56"""
    try:
        return f"${float(value):,.2f}"
    except (ValueError, TypeError):
        return "$0.00"

def format_percent(value):
    """Formats decimal to 10.00%"""
    try:
        return f"{float(value):.2f}%"
    except (ValueError, TypeError):
        return "0.00%"

def smart_break_filter(value):
    """
    Injects <wbr> tag after common separators (., -, ,) to allow natural breaking
    in tight columns without forcing a break in the middle of a word unless necessary.
    """
    if not value:
        return ""
    s = str(value)
    # Replace common separators with separator + zero-width break opportunity
    # We return this, and must use | safe in the template
    return s.replace('.', '.<wbr>').replace(',', ',<wbr>').replace('-', '-<wbr>')

def get_image_as_base64(file_path):
    """Reads local image and converts to Base64 for embedding in HTML"""
    if not file_path or not os.path.exists(file_path):
        return ""
    try:
        with open(file_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        # Simple extension detection
        file_ext = os.path.splitext(file_path)[1].lower().replace('.', '')
        if file_ext == 'jpg': file_ext = 'jpeg'
        return f"data:image/{file_ext};base64,{encoded_string}"
    except Exception as e:
        print(f"Error loading logo: {e}")
        return ""

async def generate_pdf_in_memory(data: dict, config: dict) -> bytes:
    """
    Generates a PDF from the provided data dictionary.
    Returns the PDF content as bytes (in-memory).
    """
    
    # 1. Setup Jinja2 Environment
    template_loader = jinja2.FileSystemLoader(searchpath="./app/templates")
    template_env = jinja2.Environment(loader=template_loader)
    
    # Register Filters
    template_env.filters['currency'] = format_currency
    template_env.filters['percent'] = format_percent
    # REGISTER THE NEW SMART BREAK FILTER
    template_env.filters['smart_break'] = smart_break_filter
    
    template = template_env.get_template("estimate_theme.html")

    # 2. Prepare Data for Injection
    
    # Handle Logo
    project_logo_path = data['project'].get('logo_url')
    logo_data_uri = get_image_as_base64(project_logo_path)
    
    # Handle Colors (Merge defaults if config missing keys)
    default_colors = {
        "header_bg": "#f0f0f0",
        "header_text": "#000000",
        "item_text": "#333333",
        "category_bg": "#d9ead3",
        "category_text": "#000000",
        "subcategory_bg": "#e0e0e0",
        "subcategory_text": "#000000"
    }
    user_colors = config.get('colors') or {}
    final_colors = {**default_colors, **user_colors}

    # 3. Render HTML
    html_content = template.render(
        project=data['project'],
        categories=data['categories'],
        totals=data['totals'],
        colors=final_colors,
        logo_data_uri=logo_data_uri
    )

    # 4. Generate PDF with Playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        page = await browser.new_page()
        
        # Load HTML
        await page.set_content(html_content)
        
        # Print to PDF (Bytes)
        pdf_bytes = await page.pdf(
            format='A4',
            landscape=True,
            print_background=True,
            # Matches the 0.5cm padding from React
            margin={'top': '0.5cm', 'bottom': '0.5cm', 'left': '0.5cm', 'right': '0.5cm'}
        )
        
        await browser.close()
        
    return pdf_bytes