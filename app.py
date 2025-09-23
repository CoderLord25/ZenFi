from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3, datetime

DB_FILE = "database.db"

app = Flask(__name__)
app.secret_key = "secret123"

# --- Database setup ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zenid TEXT UNIQUE,
            username TEXT,
            -- ZTC
            balance_ztc REAL DEFAULT 0,
            last_mint_time_ztc TEXT,
            -- zBTC
            balance_zbtc REAL DEFAULT 0,
            last_mint_time_zbtc TEXT,
            -- zETH
            balance_zeth REAL DEFAULT 0,
            last_mint_time_zeth TEXT,
            -- ZFI
            balance_zfi REAL DEFAULT 0,
            last_mint_time_zfi TEXT,
            -- USDT
            balance_usdt REAL DEFAULT 0,
            last_mint_time_usdt TEXT,
            -- USDC
            balance_usdc REAL DEFAULT 0,
            last_mint_time_usdc TEXT
        )
    """)
    conn.commit()
    conn.close()
    
# --- Helper ---
def get_user(zenid):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        SELECT id, username,
               balance_ztc, last_mint_time_ztc,
               balance_zbtc, last_mint_time_zbtc,
               balance_zeth, last_mint_time_zeth,
               balance_zfi, last_mint_time_zfi,
               balance_usdt, last_mint_time_usdt,
               balance_usdc, last_mint_time_usdc
        FROM users
        WHERE zenid=?
    """, (zenid,))
    row = c.fetchone()
    conn.close()
    return row

# --- Routes ---

# Default: vào trang login
@app.route("/")
def index():
    return redirect(url_for("login_page"))

# Trang login hiển thị giao diện
@app.route("/login_page")
def login_page():
    return render_template("login.html")

# Mint page
@app.route("/mint_page")
def mint_page():
    if "zenid" not in session:
        return redirect(url_for("login_page"))

    zenid = session["zenid"]
    row = get_user(zenid)
    if not row:
        return redirect(url_for("login_page"))

    (user_id, username,
     balance_ztc, last_mint_time_ztc,
     balance_zbtc, last_mint_time_zbtc,
     balance_zeth, last_mint_time_zeth,
     balance_zfi, last_mint_time_zfi,
     balance_usdt, last_mint_time_usdt,
     balance_usdc, last_mint_time_usdc) = row

    now = datetime.datetime.utcnow()

    def check_time(last_time):
        if last_time:
            last_time = datetime.datetime.fromisoformat(last_time)
            return (now - last_time).total_seconds() >= 24 * 3600
        return True

    return render_template("mint.html",
                           username=username,
                           balance_ztc=balance_ztc,
                           can_mint=check_time(last_mint_time_ztc),
                           can_mint_zbtc=check_time(last_mint_time_zbtc),
                           can_mint_zeth=check_time(last_mint_time_zeth),
                           can_mint_zfi=check_time(last_mint_time_zfi),
                           can_mint_usdt=check_time(last_mint_time_usdt),
                           can_mint_usdc=check_time(last_mint_time_usdc),
                           active_page="mint")


# Mint token
@app.route("/mint", methods=["POST"])
def mint():
    if "zenid" not in session:
        return redirect(url_for("login_page"))

    zenid = session["zenid"]
    token = request.form.get("token")

    # mapping token -> (balance_col, time_col, amount, token_name)
    token_map = {
        "ZTC":  ("balance_ztc", "last_mint_time_ztc", 100, "$ZTC"),
        "zBTC": ("balance_zbtc", "last_mint_time_zbtc", 0.01, "$zBTC"),
        "zETH": ("balance_zeth", "last_mint_time_zeth", 0.05, "$zETH"),
        "ZFI":  ("balance_zfi", "last_mint_time_zfi", 50, "$ZFI"),
        "USDT": ("balance_usdt", "last_mint_time_usdt", 100, "$USDT"),
        "USDC": ("balance_usdc", "last_mint_time_usdc", 100, "$USDC"),
    }

    if token not in token_map:
        flash("Invalid token type.", "danger")
        return redirect(url_for("mint_page"))

    balance_col, time_col, amount, token_name = token_map[token]

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    # Lấy balance + last_mint_time riêng cho token
    c.execute(f"SELECT {balance_col}, {time_col} FROM users WHERE zenid=?", (zenid,))
    row = c.fetchone()

    if not row:
        conn.close()
        return redirect(url_for("login_page"))

    balance, last_mint_time = row
    now = datetime.datetime.utcnow()

    # Check cooldown riêng từng token
    if last_mint_time:
        last_mint_time = datetime.datetime.fromisoformat(last_mint_time)
        if (now - last_mint_time).total_seconds() < 24 * 3600:
            flash(f"You can only mint {token_name} once every 24 hours.", "danger")
            conn.close()
            return redirect(url_for("mint_page"))

    # Update balance + thời gian
    new_balance = balance + amount
    c.execute(f"UPDATE users SET {balance_col}=?, {time_col}=? WHERE zenid=?",
              (new_balance, now.isoformat(), zenid))
    conn.commit()
    conn.close()

    flash(f"Successfully minted {amount} {token_name}!", "success")
    return redirect(url_for("mint_page"))

# Register ZenID
@app.route("/register_zenid", methods=["POST"])
def register_zenid():
    data = request.get_json()
    zenid = data.get("zenid")

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE zenid=?", (zenid,))
    row = c.fetchone()
    if not row:
        c.execute("INSERT INTO users (zenid, username, balance_ztc) VALUES (?, ?, ?)",
                  (zenid, f"User_{zenid[:6]}", 0))
        conn.commit()
    conn.close()

    return {"success": True}

# Login với ZenID (form POST)
@app.route("/login", methods=["POST"])
def login():
    zenid = request.form.get("zenid")
    if not zenid:
        flash("ZenID required", "danger")
        return redirect(url_for("login_page"))

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE zenid=?", (zenid,))
    row = c.fetchone()
    conn.close()

    if not row:
        flash("ZenID not found. Please mint one first.", "danger")
        return redirect(url_for("login_page"))

    session["zenid"] = zenid
    return redirect(url_for("mint_page"))

# Wallet login
@app.route("/wallet_login", methods=["POST"])
def wallet_login():
    data = request.get_json()
    wallet = data.get("wallet")

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE zenid=?", (wallet,))
    row = c.fetchone()
    if not row:
        c.execute("INSERT INTO users (zenid, username, balance_ztc) VALUES (?, ?, ?)",
                  (wallet, f"Wallet_{wallet[:6]}", 0))
        conn.commit()
    conn.close()

    session["zenid"] = wallet
    return {"success": True}

@app.route("/wallet")
def wallet():
    if "zenid" not in session:
        return redirect(url_for("login_page"))

    zenid = session["zenid"]

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        SELECT username,
               balance_ztc,
               balance_zbtc,
               balance_zeth,
               balance_zfi,
               balance_usdt,
               balance_usdc
        FROM users WHERE zenid=?
    """, (zenid,))
    row = c.fetchone()
    conn.close()

    if not row:
        return redirect(url_for("login_page"))

    (username,
     balance_ztc,
     balance_zbtc,
     balance_zeth,
     balance_zfi,
     balance_usdt,
     balance_usdc) = row

    return render_template("wallet.html",
                           username=username,
                           balance_ztc=balance_ztc,
                           balance_zbtc=balance_zbtc,
                           balance_zeth=balance_zeth,
                           balance_zfi=balance_zfi,
                           balance_usdt=balance_usdt,
                           balance_usdc=balance_usdc,
                           active_page="wallet")

# Logout
@app.route("/logout")
def logout():
    session.pop("zenid", None)
    return redirect(url_for("login_page"))

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
