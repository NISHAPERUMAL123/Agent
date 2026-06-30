from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    city = Column(String)
    phone = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    sales = relationship("Sale", back_populates="customer")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String)
    stock = Column(Integer, default=100)
    created_at = Column(DateTime, server_default=func.now())
    sales = relationship("Sale", back_populates="product")

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    amount = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    sale_date = Column(DateTime, server_default=func.now())
    customer = relationship("Customer", back_populates="sales")
    product = relationship("Product", back_populates="sales")