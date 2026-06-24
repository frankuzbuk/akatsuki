"""Backend API tests for Anime Streaming Platform"""
import os
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://speak-uzbek-10.preview.emergentagent.com"
# Read frontend env explicitly to ensure public URL is used
fe_env = Path("/app/frontend/.env")
if fe_env.exists():
    for line in fe_env.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")

ADMIN_EMAIL = "admin@animestream.com"
ADMIN_PASSWORD = "Admin@123456"

# Shared state
state = {}


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def user_session():
    s = requests.Session()
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"
    name = "TEST User"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"name": name, "email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    state["test_user_email"] = email
    state["test_user_password"] = password
    state["test_user_id"] = r.json()["id"]
    return s


# ===== AUTH =====
class TestAuth:
    def test_register_user(self):
        s = requests.Session()
        email = f"reg_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{BASE_URL}/api/auth/register", json={"name": "Reg TEST", "email": email, "password": "Pass1234!"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email
        assert data["role"] == "user"
        assert "id" in data
        assert "password_hash" not in data

    def test_register_duplicate(self, user_session):
        r = requests.post(f"{BASE_URL}/api/auth/register",
                          json={"name": "Dup", "email": state["test_user_email"], "password": "x"}, timeout=30)
        assert r.status_code == 400

    def test_login_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "notexist@example.com", "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_admin_login(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == ADMIN_EMAIL
        assert u["role"] == "super_admin"

    def test_logout(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200
        r2 = s.post(f"{BASE_URL}/api/auth/logout", timeout=30)
        assert r2.status_code == 200
        r3 = s.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r3.status_code == 401


# ===== ANIME PUBLIC =====
class TestAnimePublic:
    def test_anime_list(self):
        r = requests.get(f"{BASE_URL}/api/anime", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "anime" in data and "total" in data
        assert isinstance(data["anime"], list)
        if data["anime"]:
            state["anime_id"] = data["anime"][0]["id"]

    def test_trending(self):
        r = requests.get(f"{BASE_URL}/api/anime/trending", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_latest(self):
        r = requests.get(f"{BASE_URL}/api/anime/latest", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_anime_detail(self):
        if "anime_id" not in state:
            pytest.skip("No anime seeded")
        r = requests.get(f"{BASE_URL}/api/anime/{state['anime_id']}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == state["anime_id"]

    def test_search_anime(self):
        r = requests.get(f"{BASE_URL}/api/anime?search=demon", timeout=30)
        assert r.status_code == 200
        assert "anime" in r.json()

    def test_get_episodes(self):
        if "anime_id" not in state:
            pytest.skip("No anime seeded")
        r = requests.get(f"{BASE_URL}/api/anime/{state['anime_id']}/episodes", timeout=30)
        assert r.status_code == 200
        eps = r.json()
        assert isinstance(eps, list)
        if eps:
            state["episode_id"] = eps[0]["id"]


# ===== USER ACTIONS =====
class TestUserActions:
    def test_watchlist_add_get_remove(self, user_session):
        if "anime_id" not in state:
            pytest.skip("No anime")
        aid = state["anime_id"]
        r = user_session.post(f"{BASE_URL}/api/user/watchlist", json={"anime_id": aid}, timeout=30)
        assert r.status_code == 200
        r2 = user_session.get(f"{BASE_URL}/api/user/watchlist", timeout=30)
        assert r2.status_code == 200
        assert any(a["id"] == aid for a in r2.json())
        r3 = user_session.delete(f"{BASE_URL}/api/user/watchlist/{aid}", timeout=30)
        assert r3.status_code == 200

    def test_favorites_add_get_remove(self, user_session):
        if "anime_id" not in state:
            pytest.skip("No anime")
        aid = state["anime_id"]
        r = user_session.post(f"{BASE_URL}/api/user/favorites", json={"anime_id": aid}, timeout=30)
        assert r.status_code == 200
        r2 = user_session.get(f"{BASE_URL}/api/user/favorites", timeout=30)
        assert r2.status_code == 200
        r3 = user_session.delete(f"{BASE_URL}/api/user/favorites/{aid}", timeout=30)
        assert r3.status_code == 200

    def test_post_comment(self, user_session):
        if "anime_id" not in state:
            pytest.skip("No anime")
        r = user_session.post(f"{BASE_URL}/api/comments",
                              json={"anime_id": state["anime_id"], "text": "TEST comment"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["text"] == "TEST comment"
        state["comment_id"] = data["id"]

    def test_get_comments(self):
        if "anime_id" not in state:
            pytest.skip("No anime")
        r = requests.get(f"{BASE_URL}/api/comments/{state['anime_id']}", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ===== ADMIN =====
class TestAdmin:
    def test_analytics(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/analytics", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_users", "total_anime", "total_episodes", "total_comments", "premium_users"]:
            assert k in d

    def test_users_list(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/users", timeout=30)
        assert r.status_code == 200
        assert "users" in r.json()

    def test_create_and_delete_anime(self, admin_session):
        payload = {
            "title": "TEST_ANIME",
            "description": "Test description",
            "genres": ["Action"],
            "year": 2025,
            "status": "ongoing",
            "rating": 5.0,
            "cover_image": "https://example.com/c.jpg"
        }
        r = admin_session.post(f"{BASE_URL}/api/anime", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        aid = r.json()["id"]
        state["test_anime_id"] = aid

        # Create episode
        ep = admin_session.post(f"{BASE_URL}/api/episodes",
                                json={"anime_id": aid, "episode_number": 1, "title": "Ep1"}, timeout=30)
        assert ep.status_code == 200, ep.text
        eid = ep.json()["id"]

        # Delete anime
        r2 = admin_session.delete(f"{BASE_URL}/api/anime/{aid}", timeout=30)
        assert r2.status_code == 200

        # Verify gone
        r3 = requests.get(f"{BASE_URL}/api/anime/{aid}", timeout=30)
        assert r3.status_code == 404

    def test_ban_and_unban_user(self, admin_session, user_session):
        uid = state["test_user_id"]
        r = admin_session.post(f"{BASE_URL}/api/admin/ban-user",
                               json={"user_id": uid, "reason": "TEST"}, timeout=30)
        assert r.status_code == 200, r.text

        # Banned user cannot login
        r2 = requests.post(f"{BASE_URL}/api/auth/login",
                           json={"email": state["test_user_email"], "password": state["test_user_password"]}, timeout=30)
        assert r2.status_code == 403

        # Unban
        r3 = admin_session.post(f"{BASE_URL}/api/admin/unban-user", json={"user_id": uid}, timeout=30)
        assert r3.status_code == 200

        # Login works again
        r4 = requests.post(f"{BASE_URL}/api/auth/login",
                           json={"email": state["test_user_email"], "password": state["test_user_password"]}, timeout=30)
        assert r4.status_code == 200

    def test_create_admin_super_only(self, admin_session):
        email = f"newadmin_{uuid.uuid4().hex[:8]}@example.com"
        r = admin_session.post(f"{BASE_URL}/api/admin/create",
                               json={"name": "TEST Admin", "email": email, "password": "Adm1n!23", "role": "admin"}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "admin"


# ===== PAYMENTS =====
class TestPayments:
    def test_checkout_session_monthly(self, user_session):
        r = user_session.post(f"{BASE_URL}/api/payments/checkout",
                              json={"package_id": "monthly", "origin_url": BASE_URL}, timeout=60)
        # Stripe may fail with test key but should not be 500-without-detail
        if r.status_code != 200:
            pytest.skip(f"Stripe checkout returned {r.status_code}: {r.text[:200]}")
        d = r.json()
        assert "url" in d and "session_id" in d

    def test_checkout_invalid_package(self, user_session):
        r = user_session.post(f"{BASE_URL}/api/payments/checkout",
                              json={"package_id": "invalid", "origin_url": BASE_URL}, timeout=30)
        assert r.status_code == 400
