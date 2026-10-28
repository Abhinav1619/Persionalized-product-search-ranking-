from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductListResponse, ProductOut
from app.services.product_serializer import serialize_product
from app.services.search_service import related_terms

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    brand: str | None = None,
    featured: bool = False,
    db: Session = Depends(get_db),
) -> ProductListResponse:
    q = db.query(Product)
    if category:
        q = q.filter(Product.category == category)
    if brand:
        q = q.filter(Product.brand == brand)
    total = q.count()
    rows = q.order_by(Product.popularity.desc()).offset((page - 1) * page_size).limit(page_size).all()
    if featured:
        rows = sorted(rows, key=lambda r: r.popularity, reverse=True)[:8]
        total = len(rows)

    items = [ProductOut(**serialize_product(r)) for r in rows]
    all_rows = db.query(Product).all()
    categories = sorted({r.category for r in all_rows})
    brands = sorted({r.brand for r in all_rows})
    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        categories=categories,
        brands=brands,
    )


@router.get("/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)) -> dict:
    row = db.get(Product, product_id)
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    product = serialize_product(row)
    similar = (
        db.query(Product)
        .filter(Product.category == row.category, Product.id != row.id)
        .order_by(Product.popularity.desc())
        .limit(4)
        .all()
    )
    return {
        "product": product,
        "similar_products": [serialize_product(s) for s in similar],
        "related_search_terms": related_terms(product),
        "why_recommend": (
            f"{product['name']} scores well on rating ({product['rating']}/5) "
            f"and fits the {product['category']} category with attributes "
            f"{', '.join(product.get('tags', [])[:3]) or 'general appeal'}."
        ),
    }