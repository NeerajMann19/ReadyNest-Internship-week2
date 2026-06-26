"""
CustomerIQ - Schema Detection Service
Scans DataFrame headers to dynamically map user columns to standardized system fields.
"""

import re
from typing import Dict, List, Tuple

# Clean and standardize column names for comparison (lowercase, remove non-alphanumeric)
def _clean_column_name(col: str) -> str:
    return re.sub(r'[^a-z0-9]', '', col.lower())

# Define synonym mappings to match standard internal keys
SYNONYMS: Dict[str, List[str]] = {
    "customer_id": ["customerid", "custid", "clientid", "buyerid", "userid", "userref", "customerref"],
    "customer_name": ["customername", "custname", "clientname", "buyername", "name", "fullname", "buyer", "client"],
    "email": ["email", "emailaddress", "mail", "contactemail"],
    "age": ["age", "customerage", "custage", "buyerage"],
    "gender": ["gender", "sex", "customergender", "buyergender"],
    "country": ["country", "nation", "customercountry", "buyercountry"],
    "region": ["region", "state", "province", "customerregion", "buyerregion"],
    "city": ["city", "town", "customercity", "buyercity"],
    "product_id": ["productid", "prodid", "itemid", "sku", "productref", "itemref"],
    "product_name": ["productname", "prodname", "itemname", "title", "producttitle", "product", "item"],
    "category": ["category", "productcategory", "prodcategory", "itemcategory", "dept", "department", "type", "producttype"],
    "price": ["price", "unitprice", "rate", "cost", "itemprice", "unitcost"],
    "quantity": ["quantity", "qty", "units", "items", "itemscount", "amountsold", "numberofitems"],
    "revenue": ["revenue", "sales", "salesamount", "income", "amount", "spend", "total", "totalamount", "totalprice", "pricetotal"],
    "order_id": ["orderid", "transid", "transactionid", "invoiceid", "invoice", "receiptid", "receipt"],
    "purchase_date": ["date", "timestamp", "purchasedate", "orderdate", "time", "orderedat", "createdat", "datetime"]
}

class SchemaDetector:
    @staticmethod
    def detect_schema(columns: List[str]) -> Tuple[Dict[str, str], List[str]]:
        """
        Scans columns and maps them to standard system fields.
        Returns a tuple containing:
          1. Dict: {standardized_field: original_column_name}
          2. List[str]: Warnings about missing critical columns
        """
        detected: Dict[str, str] = {}
        warnings: List[str] = []

        # Find best match for each system field using cleaned name comparison
        for system_field, synonyms in SYNONYMS.items():
            for col in columns:
                cleaned = _clean_column_name(col)
                if cleaned == system_field or cleaned in synonyms:
                    detected[system_field] = col
                    break

        # Fallback substring heuristic for remaining fields
        for system_field, synonyms in SYNONYMS.items():
            if system_field in detected:
                continue
            for col in columns:
                cleaned = _clean_column_name(col)
                for syn in synonyms:
                    if syn in cleaned or cleaned in syn:
                        if col not in detected.values():
                            detected[system_field] = col
                            break
                if system_field in detected:
                    break

        # Assess missing fields and generate warning flags
        critical_groups = [
            ("customer_id", "customer_name"),
            ("product_id", "product_name"),
            ("order_id",),
        ]
        
        for group in critical_groups:
            found = any(field in detected for field in group)
            if not found:
                field_names = " or ".join(group)
                warnings.append(f"Could not automatically detect a column for: {field_names}")

        if "purchase_date" not in detected:
            warnings.append("Could not detect transaction date/time column. Defaulting to import timestamp.")
            
        if "revenue" not in detected and ("price" not in detected or "quantity" not in detected):
            warnings.append("Missing pricing fields (Revenue or Price & Quantity). Sales metrics cannot be calculated.")

        return detected, warnings
