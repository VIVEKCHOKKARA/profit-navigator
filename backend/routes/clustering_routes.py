"""
Clustering routes — fetches products from MySQL, runs K-Means via Python, updates clusters.
"""
import json
import os
import subprocess
from flask import Blueprint, jsonify
from db import query, execute

clustering_bp = Blueprint("clustering", __name__)


def run_python(script, payload):
    python_path = os.environ.get("PYTHON_PATH", "python")
    script_path = os.path.join(os.path.dirname(__file__), "..", "python", script)
    proc = subprocess.run(
        [python_path, script_path],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        timeout=60,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Python error: {proc.stderr}")
    return json.loads(proc.stdout)


@clustering_bp.route("/", methods=["POST"])
def run_clustering():
    """POST /api/clustering — cluster products using K-Means."""
    try:
        rows = query(
            "SELECT id, name, price, units_sold, revenue, trend, cluster FROM products"
        )

        if not rows:
            return jsonify({"clusters": [], "model_used": "none"})

        # Convert Decimals for JSON serialization
        products = []
        for r in rows:
            products.append({
                "id": r["id"],
                "name": r["name"],
                "price": float(r["price"]),
                "units_sold": int(r["units_sold"]),
                "revenue": float(r["revenue"]),
                "trend": r["trend"],
                "cluster": r["cluster"],
            })

        result = run_python("clustering.py", {"products": products})

        # Update cluster labels in MySQL
        for item in result.get("clusters", []):
            execute(
                "UPDATE products SET cluster = %s WHERE id = %s",
                (item["cluster"], item["id"]),
            )

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
