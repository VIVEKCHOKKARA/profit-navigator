"""
Products CRUD routes.
"""
import uuid
from flask import Blueprint, request, jsonify
from db import query, execute
from realtime import emit_change

products_bp = Blueprint("products", __name__)


@products_bp.route("/", methods=["GET"])
def list_products():
    """GET /api/products — list all, ordered by revenue DESC."""
    rows = query(
        "SELECT id, name, category, price, units_sold, revenue, trend, cluster, created_at "
        "FROM products ORDER BY revenue DESC"
    )
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "name": r["name"],
            "category": r["category"],
            "price": float(r["price"]),
            "units_sold": int(r["units_sold"]),
            "revenue": float(r["revenue"]),
            "trend": r["trend"],
            "cluster": r["cluster"],
            "created_at": str(r["created_at"]),
        })
    return jsonify(result)


@products_bp.route("/", methods=["POST"])
def create_product():
    """POST /api/products — create a new product."""
    body = request.get_json(force=True)
    pid = str(uuid.uuid4())
    price = float(body["price"])
    units_sold = int(body.get("units_sold", 0))
    revenue = body.get("revenue", price * units_sold)
    execute(
        "INSERT INTO products (id, name, category, price, units_sold, revenue, trend, cluster) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        (pid, body["name"], body["category"], price, units_sold,
         revenue, body.get("trend", "stable"), body.get("cluster", "question-mark")),
    )
    emit_change("products", "create", {"id": pid})
    return jsonify({"id": pid}), 201


@products_bp.route("/<pid>", methods=["PUT"])
def update_product(pid):
    """PUT /api/products/<id> — update a product."""
    body = request.get_json(force=True)
    fields, values = [], []
    for col in ("name", "category", "price", "units_sold", "revenue", "trend", "cluster"):
        if col in body:
            fields.append(f"{col} = %s")
            values.append(body[col])
    if not fields:
        return jsonify({"error": "No fields to update"}), 400
    values.append(pid)
    execute(f"UPDATE products SET {', '.join(fields)} WHERE id = %s", values)
    emit_change("products", "update", {"id": pid})
    return jsonify({"success": True})


@products_bp.route("/<pid>", methods=["DELETE"])
def delete_product(pid):
    """DELETE /api/products/<id>."""
    execute("DELETE FROM products WHERE id = %s", (pid,))
    emit_change("products", "delete", {"id": pid})
    return jsonify({"success": True})
