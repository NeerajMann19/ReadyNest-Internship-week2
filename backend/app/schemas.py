"""
CustomerIQ - Validation Schemas
Pydantic validation and serialization models for API data exchange.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User schemas
class UserCreate(BaseModel):
    email: str
    password: str
    role: Optional[str] = "user"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: str
    created_at: datetime

# Dataset schemas
class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    file_path: str
    row_count: Optional[int] = None
    uploaded_by: int
    created_at: datetime

# Customer schemas
class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id_ref: str
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    dataset_id: int

# Product schemas
class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id_ref: str
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    dataset_id: int

# Order schemas
class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id_ref: str
    customer_id: int
    product_id: int
    quantity: int
    total_amount: Optional[float] = None
    purchase_date: Optional[datetime] = None
    dataset_id: int
