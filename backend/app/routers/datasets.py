"""
CustomerIQ - Dataset Routing & Upload Pipeline
Handles dataset file uploads (CSV/Excel), schema auto-detection, parsing, cleanups,
and efficient, chunked bulk PostgreSQL database insertion.
"""

import io
import os
import gc
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import insert, delete, func
from app.database import get_db
from app.models import User, Dataset, Customer, Product, Order
from app.auth import get_current_user
from app.services.schema_detector import SchemaDetector

router = APIRouter(prefix="/datasets", tags=["Datasets"])

UPLOAD_DIR = r"c:\Users\Neeraj\Desktop\customeriq\backend\uploads"

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts CSV or XLSX file uploads, dynamically maps columns,
    and inserts records into PostgreSQL using high-efficiency chunked bulk insertions.
    """
    # 1. Validate file extension
    filename = file.filename or "dataset"
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV and Excel (.xlsx, .xls) files are supported."
        )

    # Read content in memory
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read upload file: {str(e)}"
        )

    # 2. Parse into Pandas DataFrame
    try:
        if file_ext == ".csv":
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse file into data table: {str(e)}"
        )

    # 3. Dynamic Schema Detection
    columns = df.columns.tolist()
    detected_mappings, warnings = SchemaDetector.detect_schema(columns)

    # Calculate missing values count per detected field
    missing_values: Dict[str, int] = {}
    for system_field, orig_col in detected_mappings.items():
        missing_count = int(df[orig_col].isna().sum())
        if missing_count > 0:
            missing_values[system_field] = missing_count

    # Save file on local disk copy for auditing
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_file_name = f"{current_user.id}_{int(datetime.now().timestamp())}_{filename}"
    saved_file_path = os.path.join(UPLOAD_DIR, saved_file_name)
    try:
        with open(saved_file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        warnings.append(f"Could not save copy to disk: {str(e)}")

    # 4. Store Dataset Metadata
    new_dataset = Dataset(
        name=filename,
        file_path=saved_file_path,
        row_count=len(df),
        dataset_type=file_ext.replace(".", ""),
        columns_detected=detected_mappings,
        upload_status="processing",
        uploaded_by=current_user.id,
        schema_metadata={
            "original_columns": columns,
            "warnings": warnings,
            "mappings": detected_mappings
        }
    )
    db.add(new_dataset)
    await db.commit()
    await db.refresh(new_dataset)

    # 5. Extract and Insert Products (Deduplicated)
    prod_id_col = detected_mappings.get("product_id")
    prod_name_col = detected_mappings.get("product_name")
    category_col = detected_mappings.get("category")
    price_col = detected_mappings.get("price")

    if prod_id_col:
        prod_source_df = df.drop_duplicates(subset=[prod_id_col])
    elif prod_name_col:
        prod_source_df = df.drop_duplicates(subset=[prod_name_col])
    else:
        prod_source_df = df.head(1)

    prod_df = pd.DataFrame(index=prod_source_df.index)
    if prod_id_col:
        prod_df["product_id_ref"] = prod_source_df[prod_id_col].astype(str).str.strip()
    elif prod_name_col:
        prod_df["product_id_ref"] = prod_source_df[prod_name_col].astype(str).str.strip().apply(
            lambda x: f"PROD-{hash(x) & 0xffffffff}"
        )
    else:
        prod_df["product_id_ref"] = ["PROD-UNKNOWN"]

    prod_df["name"] = prod_source_df[prod_name_col].astype(str).str.strip() if prod_name_col else prod_df["product_id_ref"]
    prod_df["category"] = prod_source_df[category_col].astype(str).str.strip() if category_col else "Uncategorized"
    prod_df["price"] = pd.to_numeric(prod_source_df[price_col], errors="coerce").fillna(0.0) if price_col else 0.0
    prod_df["dataset_id"] = new_dataset.id

    unique_prods = prod_df.to_dict(orient="records")

    # 6. Extract and Insert Customers (Deduplicated)
    cust_id_col = detected_mappings.get("customer_id")
    cust_name_col = detected_mappings.get("customer_name")
    email_col = detected_mappings.get("email")
    age_col = detected_mappings.get("age")
    gender_col = detected_mappings.get("gender")
    country_col = detected_mappings.get("country")
    region_col = detected_mappings.get("region")

    if cust_id_col:
        cust_source_df = df.drop_duplicates(subset=[cust_id_col])
    elif cust_name_col:
        cust_source_df = df.drop_duplicates(subset=[cust_name_col])
    else:
        cust_source_df = df.head(1)

    cust_df = pd.DataFrame(index=cust_source_df.index)
    if cust_id_col:
        cust_df["customer_id_ref"] = cust_source_df[cust_id_col].astype(str).str.strip()
    elif cust_name_col:
        cust_df["customer_id_ref"] = cust_source_df[cust_name_col].astype(str).str.strip().apply(
            lambda x: f"CUST-{hash(x) & 0xffffffff}"
        )
    else:
        cust_df["customer_id_ref"] = ["CUST-UNKNOWN"]

    cust_df["name"] = cust_source_df[cust_name_col].astype(str).str.strip() if cust_name_col else "Unknown Customer"
    cust_df["email"] = cust_source_df[email_col].astype(str).str.strip() if email_col else None
    
    # Handle Numeric Age
    if age_col:
        cust_df["age"] = pd.to_numeric(cust_source_df[age_col], errors="coerce")
        cust_df["age"] = cust_df["age"].astype(object).where(pd.notnull(cust_df["age"]), None)
    else:
        cust_df["age"] = None
        
    cust_df["gender"] = cust_source_df[gender_col].astype(str).str.strip() if gender_col else None
    cust_df["country"] = cust_source_df[country_col].astype(str).str.strip() if country_col else None
    cust_df["region"] = cust_source_df[region_col].astype(str).str.strip() if region_col else None
    cust_df["dataset_id"] = new_dataset.id

    unique_custs = cust_df.to_dict(orient="records")

    try:
        # Bulk insert products and customers in chunks
        chunk_size = 10000
        for i in range(0, len(unique_prods), chunk_size):
            await db.execute(insert(Product), unique_prods[i : i + chunk_size])

        for i in range(0, len(unique_custs), chunk_size):
            await db.execute(insert(Customer), unique_custs[i : i + chunk_size])
        
        await db.commit()

        # Free product/customer memory
        del unique_prods
        del unique_custs
        del prod_df
        del cust_df
        del prod_source_df
        del cust_source_df
        gc.collect()

        # Build in-memory lookup dictionary for fast database reference mapping
        prod_result = await db.execute(select(Product.id, Product.product_id_ref).where(Product.dataset_id == new_dataset.id))
        prod_map = {ref: db_id for db_id, ref in prod_result.all()}

        cust_result = await db.execute(select(Customer.id, Customer.customer_id_ref).where(Customer.dataset_id == new_dataset.id))
        cust_map = {ref: db_id for db_id, ref in cust_result.all()}

        # 7. Map and Insert Orders (Vectorized using Pandas)
        order_id_col = detected_mappings.get("order_id")
        qty_col = detected_mappings.get("quantity")
        rev_col = detected_mappings.get("revenue")
        date_col = detected_mappings.get("purchase_date")

        # 1. Product mapping series
        if prod_id_col:
            r_prod = df[prod_id_col].astype(str).str.strip()
        elif prod_name_col:
            r_prod = df[prod_name_col].astype(str).str.strip().apply(
                lambda x: f"PROD-{hash(x) & 0xffffffff}"
            )
        else:
            r_prod = pd.Series(["PROD-UNKNOWN"] * len(df))

        # 2. Customer mapping series
        if cust_id_col:
            r_cust = df[cust_id_col].astype(str).str.strip()
        elif cust_name_col:
            r_cust = df[cust_name_col].astype(str).str.strip().apply(
                lambda x: f"CUST-{hash(x) & 0xffffffff}"
            )
        else:
            r_cust = pd.Series(["CUST-UNKNOWN"] * len(df))

        # 3. Lookups using maps
        db_prod_id = r_prod.map(prod_map)
        db_cust_id = r_cust.map(cust_map)

        # 4. Filter valid rows where product and customer exist
        valid_mask = db_prod_id.notna() & db_cust_id.notna()

        # Construct minimal orders_df directly using loc on valid rows
        orders_df = pd.DataFrame(index=df.index[valid_mask])
        orders_df["dataset_id"] = new_dataset.id
        orders_df["product_id"] = db_prod_id.loc[valid_mask].astype(int)
        orders_df["customer_id"] = db_cust_id.loc[valid_mask].astype(int)

        # 5. Extract fields
        if len(orders_df) > 0:
            if order_id_col:
                orders_df["order_id_ref"] = df.loc[valid_mask, order_id_col].astype(str).str.strip()
            else:
                orders_df["order_id_ref"] = "ORD-" + orders_df.index.astype(str)

            if qty_col:
                orders_df["quantity"] = pd.to_numeric(df.loc[valid_mask, qty_col], errors="coerce").fillna(1).astype(int)
            else:
                orders_df["quantity"] = 1

            if rev_col:
                orders_df["total_amount"] = pd.to_numeric(df.loc[valid_mask, rev_col], errors="coerce").fillna(0.0).astype(float)
            elif price_col:
                prices = pd.to_numeric(df.loc[valid_mask, price_col], errors="coerce").fillna(0.0).astype(float)
                orders_df["total_amount"] = prices * orders_df["quantity"]
            else:
                orders_df["total_amount"] = 0.0

            if date_col:
                parsed_dates = pd.to_datetime(df.loc[valid_mask, date_col], errors="coerce").fillna(datetime.now())
                orders_df["purchase_date"] = parsed_dates.dt.to_pydatetime()
            else:
                orders_df["purchase_date"] = datetime.now()

        # Free temporary mapping series and dicts
        del r_prod
        del r_cust
        del db_prod_id
        del db_cust_id
        del prod_map
        del cust_map
        gc.collect()

        # Bulk insert orders in chunks to handle 100,000+ rows efficiently
        for i in range(0, len(orders_df), chunk_size):
            chunk_df = orders_df.iloc[i : i + chunk_size]
            chunk_list = chunk_df.to_dict(orient="records")
            await db.execute(insert(Order), chunk_list)
            del chunk_list
            del chunk_df

        # Free final dataframes
        del orders_df
        del df
        gc.collect()

        # Mark dataset as completed and save timestamp
        new_dataset.upload_status = "completed"
        new_dataset.processed_at = datetime.now()
        await db.commit()

        return {
            "dataset_name": filename,
            "rows_imported": new_dataset.row_count,
            "columns_detected": list(detected_mappings.keys()),
            "missing_values": missing_values,
            "warnings": warnings
        }

    except Exception as e:
        await db.rollback()
        new_dataset.upload_status = "failed"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk-insert dataset rows: {str(e)}"
        )

@router.get("")
async def list_datasets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all uploaded datasets for the current authenticated user.
    """
    query = select(Dataset).where(Dataset.uploaded_by == current_user.id).order_by(Dataset.created_at.desc())
    result = await db.execute(query)
    datasets = result.scalars().all()
    return datasets

@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes an uploaded dataset and cascades to purge related Customers, Products, and Orders.
    """
    query = select(Dataset).where(Dataset.id == dataset_id, Dataset.uploaded_by == current_user.id)
    result = await db.execute(query)
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or you do not have permission to delete it."
        )

    # Remove copy on disk
    if dataset.file_path and os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except Exception:
            pass

    # Delete dataset (cascades automatically due to SQLAlchemy configuration)
    await db.delete(dataset)
    await db.commit()

    return {"message": "Dataset successfully deleted"}
