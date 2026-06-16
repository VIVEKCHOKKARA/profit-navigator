"""
Transactions CRUD routes.
"""
import uuid
from flask import Blueprint, request, jsonify
from db import query, execute
from realtime import emit_change

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/", methods=["GET"])
def list_transactions():
    """GET /api/transactions — list all, newest first."""
    rows = query(
        "SELECT id, date, description, category, amount, type, created_at "
        "FROM transactions ORDER BY date DESC"
    )
    # Convert Decimal / date to JSON-safe types
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "date": str(r["date"]),
            "description": r["description"],
            "category": r["category"],
            "amount": float(r["amount"]),
            "type": r["type"],
            "created_at": str(r["created_at"]),
        })
    return jsonify(result)


@transactions_bp.route("/", methods=["POST"])
def create_transaction():
    """POST /api/transactions — create a new transaction."""
    body = request.get_json(force=True)
    tid = str(uuid.uuid4())
    execute(
        "INSERT INTO transactions (id, date, description, category, amount, type) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (tid, body["date"], body["description"], body["category"],
         body["amount"], body["type"]),
    )
    emit_change("transactions", "create", {"id": tid})
    return jsonify({"id": tid}), 201


@transactions_bp.route("/<tid>", methods=["PUT"])
def update_transaction(tid):
    """PUT /api/transactions/<id> — update a transaction."""
    body = request.get_json(force=True)
    fields, values = [], []
    for col in ("date", "description", "category", "amount", "type"):
        if col in body:
            fields.append(f"{col} = %s")
            values.append(body[col])
    if not fields:
        return jsonify({"error": "No fields to update"}), 400
    values.append(tid)
    execute(f"UPDATE transactions SET {', '.join(fields)} WHERE id = %s", values)
    emit_change("transactions", "update", {"id": tid})
    return jsonify({"success": True})


@transactions_bp.route("/<tid>", methods=["DELETE"])
def delete_transaction(tid):
    """DELETE /api/transactions/<id>."""
    execute("DELETE FROM transactions WHERE id = %s", (tid,))
    emit_change("transactions", "delete", {"id": tid})
    return jsonify({"success": True})
