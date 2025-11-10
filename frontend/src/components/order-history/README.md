# Order History components

This folder is for uploading frontend components related to order history.

Suggested structure (you can upload your files with these names or similar):

- `OrderHistory.jsx` or `OrderHistory.tsx` — main component that displays the list of orders.
- `OrderItem.jsx` or `OrderItem.tsx` — component for a single order (status, total, date, details).
- `OrderFilters.jsx` — filters by date/status/search.
- `OrderDetailsModal.jsx` — shows order details (lines, address, tracking).
- `order-history.css` or `order-history.module.css` — styles.
- `__tests__/` — unit tests (react-testing-library) for `OrderHistory` and `OrderItem`.

Notes:
- If you use React hooks, include a small `useOrders.js` hook if you have one.
- If the component depends on backend calls, also upload an example `api/orders.js` showing the routes you use.
- Indicate any external dependencies (libraries) required by the components.

Please upload your component files here and tell me when they're ready; I can integrate them into the frontend and add tests if you want.

# backend/database/models/product.py
from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from backend.database.connection import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price_usd = Column(Float, nullable=False, default=0.0)
    price_cop = Column(Float, nullable=False, default=0.0)
    pv = Column(Float, nullable=False, default=0.0)  # Puntos Valor
    sku = Column(String(100), unique=True, nullable=True)
    category_id = Column(Integer, nullable=True)
    subcategory_id = Column(Integer, nullable=True)
    stock = Column(Integer, default=0)  # inventario
    active = Column(Boolean, default=True)

    [12:35 p.m., 31/10/2025] Tú Empresa Internacional: # backend/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database.connection import get_db
from backend.database.models.product import Product
from backend.database.models.order import Order
from backend.database.models.order_item import OrderItem
from backend.schemas.order import OrderCreate, OrderOut
from backend.utils.auth import get_current_user  # dependencia existente que devuelve User

router = APIRouter(prefix="/api/orders", tags=["Orders"])

USD_TO_COP = 4500.0

@router.post("/", response_model=OrderOut)
def create_order(payload: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # calcular totales y verificar stock
    total_usd = 0.0
    total_cop = 0.0
    total_pv = 0.0
    order_items = []

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")

        subtotal_usd = item.quantity * product.price_usd
        subtotal_cop = item.quantity * product.price_cop
        subtotal_pv = item.quantity * product.pv

        total_usd += subtotal_usd
        total_cop += subtotal_cop
        total_pv += subtotal_pv

        order_items.append({
            "product": product,
            "quantity": item.quantity,
            "subtotal_usd": subtotal_usd,
            "subtotal_cop": subtotal_cop,
            "subtotal_pv": subtotal_pv
        })

    order = Order(
        user_id=current_user.id,
        total_usd=round(total_usd,2),
        total_cop=round(total_cop,2),
        total_pv=round(total_pv,2),
        shipping_address=payload.shipping_address,
        status="pending"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # guardar items y decrementar stock
    for it in order_items:
        oi = OrderItem(
            order_id=order.id,
            product_id=it["product"].id,
            product_name=it["product"].name,
            quantity=it["quantity"],
            subtotal_usd=it["subtotal_usd"],
            subtotal_cop=it["subtotal_cop"],
            subtotal_pv=it["subtotal_pv"]
        )
        db.add(oi)
        # decrementar stock
        it["product"].stock -= it["quantity"]
        db.add(it["product"])

    db.commit()
    db.refresh(order)
    return order


@router.get("/my", response_model=List[OrderOut])
def my_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders


# Admin: listar todos los pedidos (puedes proteger con roles)
@router.get("/", response_model=List[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return orders


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    # Si no es admin, validar que el owner sea current_user
    # (aquí asumimos get_current_user retorna user con attribute is_admin)
    if order.user_id != current_user.id and not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="No autorizado")
    return order


@router.put("/{order_id}/status")
def update_order_status(order_id: int, statu…
[12:36 p.m., 31/10/2025] Tú Empresa Internacional: # backend/routers/inventory.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models.product import Product

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("/stock/{product_id}")
def get_stock(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"product_id": p.id, "stock": p.stock}

@router.post("/adjust/{product_id}")
def adjust_stock(product_id: int, quantity: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id…
[12:40 p.m., 31/10/2025] Tú Empresa Internacional: // ProductFilters.jsx
import React, { useState } from "react";

export default function ProductFilters({ onFilter }) {
  const [q, setQ] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);

  const apply = () => {
    onFilter({
      q: q || undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      in_stock: inStock ? true : undefined
    });
  };

  const clear = () => {
    setQ(""); setMinPrice(""); setMaxPrice(""); setInStock(false);
    onFilter({});
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Filtros</h3>
  …
[12:41 p.m., 31/10/2025] Tú Empresa Internacional: // ProductsWithFilters.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductFilters from "./ProductFilters";

const BASE = "http://localhost:8000";

export default function ProductsWithFilters() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(()=> {
    fetchProducts(filters);
  }, [filters]);

  const fetchProducts = async (f) => {
    const params = {};
    if (f.q) params.q = f.q;
    if (f.min_price) params.min_price = f.min_price;
    if (f.max_price) params.max_price = f.max_price;
    if (f.in_stock !== undefined) params.in_stock = f.in_stock;
    try {
      const res = await axios.get(${BASE}/api/products, { params });
      setProducts(res.data)…
[12:41 p.m., 31/10/2025] Tú Empresa Internacional: // OrderHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE = "http://localhost:8000";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  useEffect(()=> {
    const token = localStorage.getItem("token");
    axios.get(${BASE}/api/orders/my, { headers: { Authorization: Bearer ${token} } })
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Historial de Pedidos</h3>
      {orders.length === 0 ? <p>No hay pedidos aún.</p> : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="border…
[12:41 p.m., 31/10/2025] Tú Empresa Internacional: // OrderDetails.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const BASE = "http://localhost:8000";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(()=> {
    const token = localStorage.getItem("token");
    axios.get(${BASE}/api/orders/${id}, { headers: { Authorization: Bearer ${token} } })
      .then(res => setOrder(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!order) return <p>Cargando...</p>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Pedido #{order.id}</h3>
      <p>Estado: <strong>{order.status}</strong></…
[12:42 p.m., 31/10/2025] Tú Empresa Internacional: // InventoryAdmin.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE = "http://localhost:8000";

export default function InventoryAdmin() {
  const [products, setProducts] = useState([]);
  const [adjust, setAdjust] = useState({ product_id: null, qty: 0 });

  useEffect(()=> {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get(${BASE}/api/products);
    setProducts(res.data);
  };

  const handleAdjust = async () => {
    if (!adjust.product_id) return alert("Selecciona un producto");
    try {
      await axios.post(${BASE}/api/inventory/adjust/${adjust.product_id}, null, { params: { quantity: adjust.qty }});
      setAdjust({ product_id: null, qty: 0});
      fet…
[12:42 p.m., 31/10/2025] Tú Empresa Internacional: from backend.routers import products, orders, inventory
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(inventory.router)
[3:48 p.m., 31/10/2025] Tú Empresa Internacional: # backend/database/models/product.py
from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from backend.database.connection import Base

class Product(Base):
    _tablename_ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price_usd = Column(Float, nullable=False, default=0.0)
    price_cop = Column(Float, nullable=False, default=0.0)
    pv = Column(Float, nullable=False, default=0.0)  # Puntos Valor
    sku = Column(String(100), unique=True, nullable=True)
    category_id = Column(Integer, nullable=True)
    subcategory_id = Column(Integer, nullable=True)
    stock = Column(Integer, default=0)  # inventario
    active = Column(Boolean, default=True)
  
