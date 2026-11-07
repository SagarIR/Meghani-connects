"""
Product Import Service - Import products from Excel/CSV
"""
import openpyxl
import csv
from io import TextIOWrapper, BytesIO
from django.db import transaction
from .models import Product


class ProductImportService:
    """
    Service to import products from Excel or CSV files.
    """
    
    REQUIRED_COLUMNS = ['name', 'selling_price']
    OPTIONAL_COLUMNS = ['barcode', 'brand', 'category', 'cost_price', 'stock', 'description', 'warranty_months']
    
    def __init__(self):
        self.errors = []
        self.imported = 0
        self.updated = 0
        self.skipped = 0
    
    def import_from_excel(self, file, update_existing=False):
        """
        Import products from Excel file.
        
        Args:
            file: Uploaded file object
            update_existing: If True, update products with matching barcode
            
        Returns:
            dict with import results
        """
        try:
            wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
            sheet = wb.active
            
            # Get headers from first row
            headers = []
            for cell in sheet[1]:
                if cell.value:
                    headers.append(str(cell.value).lower().strip().replace(' ', '_'))
            
            # Validate required columns
            missing = [col for col in self.REQUIRED_COLUMNS if col not in headers]
            if missing:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing)}',
                    'expected_columns': self.REQUIRED_COLUMNS + self.OPTIONAL_COLUMNS
                }
            
            # Process rows
            rows = list(sheet.iter_rows(min_row=2, values_only=True))
            return self._process_rows(headers, rows, update_existing)
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def import_from_csv(self, file, update_existing=False):
        """
        Import products from CSV file.
        
        Args:
            file: Uploaded file object
            update_existing: If True, update products with matching barcode
            
        Returns:
            dict with import results
        """
        try:
            # Handle both file-like objects and InMemoryUploadedFile
            if hasattr(file, 'read'):
                content = file.read()
                if isinstance(content, bytes):
                    content = content.decode('utf-8-sig')  # Handle BOM
                file = TextIOWrapper(BytesIO(content.encode('utf-8')))
            
            reader = csv.reader(file)
            
            # Get headers from first row
            headers = [h.lower().strip().replace(' ', '_') for h in next(reader)]
            
            # Validate required columns
            missing = [col for col in self.REQUIRED_COLUMNS if col not in headers]
            if missing:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing)}',
                    'expected_columns': self.REQUIRED_COLUMNS + self.OPTIONAL_COLUMNS
                }
            
            # Process rows
            rows = list(reader)
            return self._process_rows(headers, rows, update_existing)
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _process_rows(self, headers, rows, update_existing):
        """
        Process rows and create/update products.
        """
        self.errors = []
        self.imported = 0
        self.updated = 0
        self.skipped = 0
        
        with transaction.atomic():
            for row_num, row in enumerate(rows, start=2):  # Start from 2 (header is row 1)
                try:
                    # Create dict from row
                    data = {}
                    for i, header in enumerate(headers):
                        if i < len(row) and row[i] is not None:
                            data[header] = row[i]
                    
                    # Skip empty rows
                    if not data.get('name'):
                        continue
                    
                    # Validate and clean data
                    product_data = self._clean_product_data(data, row_num)
                    if product_data is None:
                        continue
                    
                    # Check for existing product by barcode
                    existing = None
                    if product_data.get('barcode'):
                        existing = Product.objects.filter(barcode=product_data['barcode']).first()
                    
                    if existing:
                        if update_existing:
                            # Update existing product
                            for key, value in product_data.items():
                                setattr(existing, key, value)
                            existing.save()
                            self.updated += 1
                        else:
                            self.skipped += 1
                            self.errors.append({
                                'row': row_num,
                                'error': f'Product with barcode {product_data["barcode"]} already exists'
                            })
                    else:
                        # Create new product
                        Product.objects.create(**product_data)
                        self.imported += 1
                        
                except Exception as e:
                    self.errors.append({
                        'row': row_num,
                        'error': str(e)
                    })
        
        return {
            'success': True,
            'imported': self.imported,
            'updated': self.updated,
            'skipped': self.skipped,
            'errors': self.errors[:50],  # Limit errors in response
            'total_errors': len(self.errors)
        }
    
    def _clean_product_data(self, data, row_num):
        """
        Clean and validate product data.
        """
        try:
            cleaned = {
                'name': str(data.get('name', '')).strip(),
                'selling_price': self._parse_decimal(data.get('selling_price', 0)),
            }
            
            # Optional fields
            if data.get('barcode'):
                cleaned['barcode'] = str(data['barcode']).strip()
            
            if data.get('brand'):
                cleaned['brand'] = str(data['brand']).strip()
            
            if data.get('category'):
                cleaned['category'] = str(data['category']).strip()
            
            if data.get('cost_price'):
                cleaned['cost_price'] = self._parse_decimal(data['cost_price'])
            
            if data.get('stock'):
                cleaned['stock'] = int(float(data['stock']))
            
            if data.get('description'):
                cleaned['description'] = str(data['description']).strip()
            
            if data.get('warranty_months'):
                cleaned['warranty_months'] = int(float(data['warranty_months']))
            
            # Validate
            if not cleaned['name']:
                self.errors.append({'row': row_num, 'error': 'Product name is required'})
                return None
            
            if cleaned['selling_price'] <= 0:
                self.errors.append({'row': row_num, 'error': 'Selling price must be greater than 0'})
                return None
            
            return cleaned
            
        except Exception as e:
            self.errors.append({'row': row_num, 'error': f'Data validation error: {str(e)}'})
            return None
    
    def _parse_decimal(self, value):
        """Parse decimal value from various formats."""
        if value is None:
            return 0
        if isinstance(value, (int, float)):
            return float(value)
        # Remove currency symbols and commas
        cleaned = str(value).replace('₹', '').replace(',', '').strip()
        try:
            return float(cleaned)
        except ValueError:
            return 0
    
    @staticmethod
    def get_sample_template():
        """
        Generate sample Excel template for import.
        """
        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = 'Products'
        
        # Headers
        headers = ['Name', 'Selling Price', 'Cost Price', 'Barcode', 'Brand', 'Category', 'Stock', 'Description', 'Warranty Months']
        for col, header in enumerate(headers, 1):
            cell = sheet.cell(row=1, column=col, value=header)
            cell.font = openpyxl.styles.Font(bold=True)
        
        # Sample data
        sample_data = [
            ['Titan Octane Watch', 12500, 8000, '8901234567890', 'Titan', 'Analog', 10, 'Classic analog watch', 12],
            ['Casio G-Shock', 8999, 5500, '8901234567891', 'Casio', 'Digital', 15, 'Sports digital watch', 24],
            ['Fossil Grant', 15000, 9500, '8901234567892', 'Fossil', 'Chronograph', 5, 'Luxury chronograph', 24],
        ]
        
        for row_num, row_data in enumerate(sample_data, 2):
            for col, value in enumerate(row_data, 1):
                sheet.cell(row=row_num, column=col, value=value)
        
        # Adjust column widths
        for col in sheet.columns:
            max_length = max(len(str(cell.value or '')) for cell in col)
            sheet.column_dimensions[col[0].column_letter].width = min(max_length + 2, 50)
        
        return wb
