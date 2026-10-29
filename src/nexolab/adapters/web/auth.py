"""SQLite-backed local accounts and opaque browser sessions."""
from __future__ import annotations

import hashlib
import hmac
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path


class AuthNotConfigured(ValueError):
    """Raised when the server has no administrator account yet."""


class AuthStore:
    SESSION_COOKIE = "nexolab_session"
    SESSION_HOURS = 12
    REMEMBER_DAYS = 30
    _SCRYPT_N = 1 << 14
    _SCRYPT_R = 8
    _SCRYPT_P = 1

    def __init__(self, database: str | Path):
        self.database = Path(database).resolve()
        self.database.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()
        self._dummy_hash = self._hash_password(secrets.token_urlsafe(32))

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(self.database, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def _initialize(self):
        with self._connect() as db:
            db.execute("PRAGMA journal_mode = WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    username TEXT NOT NULL,
                    username_key TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
                    created_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at INTEGER NOT NULL,
                    expires_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
                CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
                CREATE TABLE IF NOT EXISTS user_avatars (
                    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    image BLOB NOT NULL
                );
            """)

    @classmethod
    def _hash_password(cls, password: str) -> str:
        salt = secrets.token_bytes(16)
        digest = hashlib.scrypt(
            password.encode("utf-8"), salt=salt, n=cls._SCRYPT_N,
            r=cls._SCRYPT_R, p=cls._SCRYPT_P, dklen=32,
            maxmem=64 * 1024 * 1024,
        )
        return "scrypt${}${}${}${}${}".format(
            cls._SCRYPT_N, cls._SCRYPT_R, cls._SCRYPT_P,
            salt.hex(), digest.hex(),
        )

    @classmethod
    def _verify_password(cls, password: str, encoded: str) -> bool:
        try:
            scheme, n, r, p, salt_hex, digest_hex = encoded.split("$")
            if scheme != "scrypt":
                return False
            calculated = hashlib.scrypt(
                password.encode("utf-8"), salt=bytes.fromhex(salt_hex),
                n=int(n), r=int(r), p=int(p), dklen=len(bytes.fromhex(digest_hex)),
                maxmem=64 * 1024 * 1024,
            )
            return hmac.compare_digest(calculated.hex(), digest_hex)
        except (ValueError, TypeError, MemoryError):
            return False

    @staticmethod
    def _username_key(username: str) -> str:
        return username.strip().casefold()

    def has_admin(self) -> bool:
        with self._connect() as db:
            return db.execute("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1").fetchone() is not None

    def require_admin(self) -> None:
        if not self.has_admin():
            raise AuthNotConfigured(
                "No administrator account is configured. Run `nexolab --create-admin` first."
            )

    def create_admin(self, username: str, password: str) -> None:
        username = username.strip()
        if not username or len(username) > 120:
            raise ValueError("نام کاربری باید بین ۱ تا ۱۲۰ نویسه باشد.")
        self._validate_admin_password(username, password)
        encoded = self._hash_password(password)
        now = int(time.time())
        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE")
            if db.execute("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1").fetchone():
                raise ValueError("حساب مدیر از قبل ساخته شده است.")
            db.execute(
                "INSERT INTO users(username, username_key, password_hash, role, created_at) "
                "VALUES (?, ?, ?, 'admin', ?)",
                (username, self._username_key(username), encoded, now),
            )

    @staticmethod
    def _validate_admin_password(username: str, password: str) -> None:
        if len(password) < 12 or len(password) > 1024:
            raise ValueError("رمز عبور مدیر باید دست‌کم ۱۲ نویسه داشته باشد.")
        if password.isspace() or password.casefold() == username.casefold():
            raise ValueError("رمز عبور باید با نام کاربری متفاوت باشد.")

    def reset_admin_password(self, password: str) -> None:
        now = int(time.time())
        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE")
            admins = db.execute(
                "SELECT id, username FROM users WHERE role = 'admin'"
            ).fetchall()
            if len(admins) != 1:
                raise ValueError("باید دقیقاً یک حساب مدیر برای بازنشانی وجود داشته باشد.")
            admin = admins[0]
            self._validate_admin_password(admin["username"], password)
            db.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (self._hash_password(password), admin["id"]),
            )
            db.execute("DELETE FROM sessions WHERE user_id = ?", (admin["id"],))

    def authenticate(self, username: str, password: str):
        key = self._username_key(username)
        with self._connect() as db:
            user = db.execute(
                "SELECT id, username, username_key, password_hash, role FROM users WHERE username_key = ?",
                (key,),
            ).fetchone()
        encoded = user["password_hash"] if user else self._dummy_hash
        valid = self._verify_password(password, encoded)
        if not user or not valid:
            return None
        return {"id": user["id"], "username": user["username"], "role": user["role"]}

    def create_session(self, user_id: int, remember: bool):
        token = secrets.token_urlsafe(32)
        now = int(time.time())
        ttl = self.REMEMBER_DAYS * 24 * 60 * 60 if remember else self.SESSION_HOURS * 60 * 60
        with self._connect() as db:
            db.execute("DELETE FROM sessions WHERE expires_at <= ?", (now,))
            db.execute(
                "INSERT INTO sessions(token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                (hashlib.sha256(token.encode()).hexdigest(), user_id, now, now + ttl),
            )
        return token, ttl

    def get_session_user(self, token: str | None):
        if not token or len(token) > 128:
            return None
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        now = int(time.time())
        with self._connect() as db:
            row = db.execute(
                "SELECT users.id, users.username, users.role, sessions.expires_at "
                "FROM sessions JOIN users ON users.id = sessions.user_id "
                "WHERE sessions.token_hash = ?",
                (token_hash,),
            ).fetchone()
            if row and row["expires_at"] <= now:
                db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))
                return None
        if not row:
            return None
        return {"id": row["id"], "username": row["username"], "role": row["role"]}

    def revoke_session(self, token: str | None):
        if not token or len(token) > 128:
            return
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with self._connect() as db:
            db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))

    def get_avatar(self, user_id: int) -> bytes | None:
        with self._connect() as db:
            row = db.execute("SELECT image FROM user_avatars WHERE user_id = ?", (user_id,)).fetchone()
        return bytes(row["image"]) if row else None

    def set_avatar(self, user_id: int, image: bytes | None) -> None:
        with self._connect() as db:
            if image is None:
                db.execute("DELETE FROM user_avatars WHERE user_id = ?", (user_id,))
            else:
                db.execute("INSERT INTO user_avatars(user_id, image) VALUES (?, ?) "
                           "ON CONFLICT(user_id) DO UPDATE SET image = excluded.image", (user_id, image))
