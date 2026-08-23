import urllib.request
import json
import sys

def test_endpoint(url, desc, expected_status=200):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            if status == expected_status:
                print(f"[PASS] {desc} -> Status {status} (Length: {len(body)} bytes)")
                return body
            else:
                print(f"[FAIL] {desc} -> Expected {expected_status}, got {status}")
                return None
    except urllib.error.HTTPError as e:
        if e.code == expected_status:
            print(f"[PASS] {desc} -> Expected Status {e.code}")
            return e.read().decode('utf-8')
        else:
            print(f"[FAIL] {desc} -> HTTP Error: {e.code}")
            return None
    except Exception as e:
        print(f"[FAIL] {desc} -> Error: {e}")
        return None

print("="*60)
print("1. TESTING BACKEND API ENDPOINTS")
print("="*60)
health = test_endpoint("http://127.0.0.1:8000/api/health", "GET /api/health")
stats = test_endpoint("http://127.0.0.1:8000/api/dashboard/stats", "GET /api/dashboard/stats")
txs = test_endpoint("http://127.0.0.1:8000/api/transactions?skip=0&limit=5", "GET /api/transactions")
tx_detail = test_endpoint("http://127.0.0.1:8000/api/transactions/1301482", "GET /api/transactions/1301482")
accs = test_endpoint("http://127.0.0.1:8000/api/accounts?skip=0&limit=5", "GET /api/accounts")
acc_detail = test_endpoint("http://127.0.0.1:8000/api/accounts/5295", "GET /api/accounts/5295")
alerts = test_endpoint("http://127.0.0.1:8000/api/alerts?skip=0&limit=5", "GET /api/alerts")
watchlist = test_endpoint("http://127.0.0.1:8000/api/watchlist", "GET /api/watchlist")
invs = test_endpoint("http://127.0.0.1:8000/api/investigations", "GET /api/investigations")
network = test_endpoint("http://127.0.0.1:8000/api/network/5295", "GET /api/network/5295")
drift = test_endpoint("http://127.0.0.1:8000/api/drift/5295", "GET /api/drift/5295")
expl = test_endpoint("http://127.0.0.1:8000/api/explainability", "GET /api/explainability")
expl_detail = test_endpoint("http://127.0.0.1:8000/api/explainability/1126548", "GET /api/explainability/1126548")
audit = test_endpoint("http://127.0.0.1:8000/api/audit", "GET /api/audit")
search = test_endpoint("http://127.0.0.1:8000/api/search?q=5295", "GET /api/search?q=5295")

print("\n" + "="*60)
print("2. TESTING ALL FRONTEND ROUTES")
print("="*60)
routes = [
    ("http://localhost:3000/login", "Route: /login", ["AEGISAML", "Dynamic AML Risk Intelligence", "Sign In", "Demo Analyst"]),
    ("http://localhost:3000/dashboard", "Route: /dashboard", ["Command Center", "Total Accounts", "Total Transactions", "Risk Distribution"]),
    ("http://localhost:3000/accounts", "Route: /accounts", ["Accounts Database", "Account ID", "Initial Balance"]),
    ("http://localhost:3000/accounts/5295", "Route: /accounts/5295", ["Account Intelligence Profile", "5295"]),
    ("http://localhost:3000/transactions", "Route: /transactions", ["Transactions", "TX ID", "ML Score", "Drift"]),
    ("http://localhost:3000/transactions/1301482", "Route: /transactions/1301482", ["Transaction Investigation", "1301482", "Machine Learning Output"]),
    ("http://localhost:3000/alerts", "Route: /alerts", ["Active Alerts", "Alert ID"]),
    ("http://localhost:3000/watchlist", "Route: /watchlist", ["Watchlist", "High-risk entities"]),
    ("http://localhost:3000/investigations", "Route: /investigations", ["Case Management"]),
    ("http://localhost:3000/network/5295", "Route: /network/5295", ["Bounded Neighborhood Analysis", "5295"]),
    ("http://localhost:3000/drift/5295", "Route: /drift/5295", ["Behavioral Drift Analysis", "5295"]),
    ("http://localhost:3000/explainability", "Route: /explainability", ["Model Explainability (SHAP)", "Direct Transaction Inspection"]),
    ("http://localhost:3000/explainability/1126548", "Route: /explainability/1126548", ["SHAP Feature Attribution Workspace", "1126548", "Feature Attribution Breakdown"]),
    ("http://localhost:3000/reports", "Route: /reports", ["Regulatory & Compliance Reports", "Print / Save as PDF"]),
    ("http://localhost:3000/audit-log", "Route: /audit-log", ["System Audit Log"]),
    ("http://localhost:3000/settings", "Route: /settings", ["System Settings & Profile", "Analyst Profile", "Backend API Telemetry"]),
    ("http://localhost:3000/admin", "Route: /admin", ["System Administration", "Global Thresholds"]),
]

failures = 0
for url, desc, required_strings in routes:
    html = test_endpoint(url, desc)
    if html is None:
        failures += 1
        continue
    for req in required_strings:
        if req not in html:
            print(f"  [WARN] Missing expected content string '{req}' in {url}")
            failures += 1

print("\n" + "="*60)
print(f"TEST SUMMARY: {'ALL PASSED' if failures == 0 else f'{failures} FAILURES DETECTED'}")
print("="*60)
