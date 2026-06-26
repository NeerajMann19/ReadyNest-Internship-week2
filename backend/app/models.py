"""
CustomerIQ - Database Models
Defines the SQLAlchemy schemas for User, Dataset, Customer, Product, and Order tables.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="user", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    datasets: Mapped[List["Dataset"]] = relationship("Dataset", back_populates="uploader", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    row_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    dataset_type: Mapped[Optional[str]] = mapped_column(String, nullable=True) # e.g. "csv" or "xlsx"
    columns_detected: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # JSON list of detected columns
    upload_status: Mapped[str] = mapped_column(String, default="pending", nullable=False) # e.g. "pending", "completed", "failed"
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    schema_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # stores original columns, mappings, warnings
    uploaded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    uploader: Mapped["User"] = relationship("User", back_populates="datasets")
    customers: Mapped[List["Customer"]] = relationship("Customer", back_populates="dataset", cascade="all, delete-orphan")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="dataset", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="dataset", cascade="all, delete-orphan")

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id_ref: Mapped[str] = mapped_column(String, index=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    dataset_id: Mapped[int] = mapped_column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="customers")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="customer", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id_ref: Mapped[str] = mapped_column(String, index=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dataset_id: Mapped[int] = mapped_column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="products")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="product", cascade="all, delete-orphan")

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id_ref: Mapped[str] = mapped_column(String, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    purchase_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    dataset_id: Mapped[int] = mapped_column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="orders")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="orders")
    product: Mapped["Product"] = relationship("Product", back_populates="orders")
