"""
Authentication routes — register / login / current-user for the three roles:
owner (Business Owner), manager (Shop Manager), analyst (Financial Analyst).

Passwords are hashed with Werkzeug (PBKDF2). Sessions use a signed, timed
token (itsdangerous) carrying the user id — stateless, no server-side store.
The frontend sends it back as `Authorization: Bearer <token>`.
"""
import os
import uuid

from flask import Blueprint, request, jsonify
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash

from db import query, execute

auth_bp = Blueprint("auth", __name__)

VALID_ROLES = ("owner", "manager", "analyst")

# Secret for signing tokens. Set AUTH_SECRET in .env for production; the
# fallback keeps local dev working out of the box.
_SECRET = os.environ.get("AUTH_SECRET", "profit-navigator-dev-secret-change-me")
_TOKEN_MAX_AGE = 60 * 60 * 24 * 7  # 7 days
_serializer = URLSafeTimedSerializer(_SECRET, salt="auth-token")


def _make_token(user_id: str) -> str:
    return _serializer.dumps(user_id)


def _read_token(token: str):
    """Return the user id for a valid token, else None."""
    try:
        return _serializer.loads(token, max_age=_TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


def _public_user(row: dict) -> dict:
    """Strip the password hash before sending a user to the client."""
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "avatarUrl": row.get("avatar_url"),
    }


def _current_user_id():
    """Resolve the user id from the request's bearer token, or None."""
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    return _read_token(token) if token else None


def _find_by_email(email: str):
    rows = query("SELECT * FROM users WHERE email = %s", (email,))
    return rows[0] if rows else None


@auth_bp.route("/register", methods=["POST"])
def register():
    """POST /api/auth/register — create an account for a given role.

    Body: { "name", "email", "password", "role": owner|manager|analyst }
    """
    body = request.get_json(force=True) or {}
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    role = body.get("role")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required."}), 400
    if role not in VALID_ROLES:
        return jsonify({"error": "Role must be owner, manager or analyst."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if _find_by_email(email):
        return jsonify({"error": "An account with this email already exists."}), 409

    user_id = str(uuid.uuid4())
    execute(
        "INSERT INTO users (id, name, email, password_hash, role) "
        "VALUES (%s, %s, %s, %s, %s)",
        (user_id, name, email, generate_password_hash(password), role),
    )
    user = {"id": user_id, "name": name, "email": email, "role": role}
    return jsonify({"token": _make_token(user_id), "user": user}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """POST /api/auth/login — authenticate by email + password.

    Body: { "email", "password" }. The account's stored role is returned;
    callers don't choose their role at login time.
    """
    body = request.get_json(force=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    user = _find_by_email(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    return jsonify({"token": _make_token(user["id"]), "user": _public_user(user)})


@auth_bp.route("/me", methods=["GET"])
def me():
    """GET /api/auth/me — resolve the current user from the bearer token."""
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Not authenticated."}), 401

    rows = query("SELECT * FROM users WHERE id = %s", (user_id,))
    if not rows:
        return jsonify({"error": "Not authenticated."}), 401
    return jsonify({"user": _public_user(rows[0])})


@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    """PUT /api/auth/profile — edit the signed-in user's own profile.

    Body (all optional): { "name", "avatarUrl", "currentPassword", "newPassword" }
    Email and role are immutable here. Changing the password requires the
    current password. avatarUrl is a data URL (or null to remove the photo).
    """
    user_id = _current_user_id()
    if not user_id:
        return jsonify({"error": "Not authenticated."}), 401

    rows = query("SELECT * FROM users WHERE id = %s", (user_id,))
    if not rows:
        return jsonify({"error": "Not authenticated."}), 401
    user = rows[0]

    body = request.get_json(force=True) or {}
    fields, params = [], []

    if "name" in body:
        name = (body.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Name cannot be empty."}), 400
        fields.append("name = %s")
        params.append(name)

    if "avatarUrl" in body:
        avatar = body.get("avatarUrl")
        if avatar is not None and not isinstance(avatar, str):
            return jsonify({"error": "avatarUrl must be a string or null."}), 400
        fields.append("avatar_url = %s")
        params.append(avatar)

    new_password = body.get("newPassword")
    if new_password:
        if not check_password_hash(user["password_hash"], body.get("currentPassword") or ""):
            return jsonify({"error": "Current password is incorrect."}), 400
        if len(new_password) < 6:
            return jsonify({"error": "New password must be at least 6 characters."}), 400
        fields.append("password_hash = %s")
        params.append(generate_password_hash(new_password))

    if not fields:
        return jsonify({"error": "Nothing to update."}), 400

    params.append(user_id)
    execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", params)

    updated = query("SELECT * FROM users WHERE id = %s", (user_id,))[0]
    return jsonify({"user": _public_user(updated)})
