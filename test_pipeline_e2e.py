import requests
import json
import time
import io

BASE_URL = "http://127.0.0.1:8000"

def test_full_pipeline_and_auth():
    print("=== 1. Testing Health Check ===")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("Health response:", r.json())

    print("\n=== 2. Testing Signup for User A ===")
    ts = int(time.time())
    user_a_email = f"analyst_a_{ts}@corp.com"
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "name": "Analyst Alice",
        "email": user_a_email,
        "password": "password123",
        "confirm_password": "password123"
    })
    assert r.status_code == 200, f"Signup failed: {r.text}"
    user_a_data = r.json()
    token_a = user_a_data["access_token"]
    user_a_id = user_a_data["user"]["id"]
    print(f"User A created: ID={user_a_id}, Email={user_a_email}")

    print("\n=== 3. Testing Get Me for User A ===")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers_a)
    assert r.status_code == 200, f"Get me failed: {r.text}"
    print("Get Me User A:", r.json())

    print("\n=== 4. Testing Empty Workspace for User A ===")
    r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers_a)
    assert r.status_code == 200
    stats_a = r.json()
    print("User A initial stats:", stats_a)
    assert stats_a["total_transactions"] == 0, "Expected 0 transactions for new user workspace"

    print("\n=== 5. Testing CSV Pipeline Upload for User A ===")
    # Create test transaction CSV
    now = int(time.time())
    csv_data = (
        "tx_id,sender_account_id,receiver_account_id,tx_type,tx_amount,timestamp,is_fraud\n"
        f"101,501,502,TRANSFER,15000.00,{now},false\n"
        f"102,501,503,TRANSFER,85000.00,{now + 3600},true\n"
        f"103,502,504,PAYMENT,420.50,{now + 7200},false\n"
        f"104,503,505,TRANSFER,120000.00,{now + 10800},true\n"
        f"105,501,504,TRANSFER,5500.00,{now + 14400},false\n"
    )
    files = {"file": ("test_surveillance.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    data = {"dataset_type": "transactions"}

    r = requests.post(f"{BASE_URL}/api/upload/pipeline", headers=headers_a, files=files, data=data)
    assert r.status_code == 200, f"Pipeline upload failed: {r.text}"
    upload_res = r.json()
    print("Pipeline Execution Result:", json.dumps(upload_res, indent=2))
    assert upload_res["transactions_imported"] > 0, "No transactions imported"

    print("\n=== 6. Testing Dashboard Stats for User A After Upload ===")
    r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers_a)
    assert r.status_code == 200
    stats_a_after = r.json()
    print("User A stats after upload:", stats_a_after)
    assert stats_a_after["total_transactions"] == 5, f"Expected 5 txs, got {stats_a_after['total_transactions']}"

    print("\n=== 7. Testing Transactions, Explainability, Drift, Network for User A ===")
    r = requests.get(f"{BASE_URL}/api/transactions", headers=headers_a)
    txs_a = r.json()
    items = txs_a.get("items", [])
    print(f"User A retrieved {len(items)} transactions")
    assert len(items) == 5

    first_tx_id = items[0]["tx_id"]
    sender_acc_id = items[0]["sender_account_id"]

    # Test explainability
    r = requests.get(f"{BASE_URL}/api/explainability/{first_tx_id}", headers=headers_a)
    assert r.status_code == 200, f"Explainability lookup failed: {r.text}"
    expl_data = r.json()
    print(f"SHAP Attribution for TX {first_tx_id}:", list(expl_data.get("explanation", {}).keys()))

    # Test drift for sender account
    r = requests.get(f"{BASE_URL}/api/drift/{sender_acc_id}", headers=headers_a)
    assert r.status_code == 200, f"Drift lookup failed: {r.text}"
    drift_data = r.json()
    print(f"Drift Score for ACC-{sender_acc_id}:", drift_data.get("current_drift"))

    # Test network for sender account
    r = requests.get(f"{BASE_URL}/api/network/{sender_acc_id}", headers=headers_a)
    assert r.status_code == 200, f"Network lookup failed: {r.text}"
    network_data = r.json()
    print(f"Network for ACC-{sender_acc_id}: {len(network_data.get('nodes', []))} nodes, {len(network_data.get('edges', []))} edges")

    # Test creating investigation case
    r = requests.post(f"{BASE_URL}/api/investigations", headers=headers_a, json={
        "target_id": str(first_tx_id),
        "target_type": "transaction"
    })
    print("Investigation create response:", r.status_code, r.text)
    assert r.status_code == 200
    case = r.json()
    case_id = case.get("id") or case.get("case_id")
    print(f"Created investigation case: {case}")

    print("\n=== 8. Testing User B Workspace Isolation ===")
    user_b_email = f"analyst_b_{ts}@corp.com"
    r = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "name": "Analyst Bob",
        "email": user_b_email,
        "password": "password123",
        "confirm_password": "password123"
    })
    assert r.status_code == 200
    token_b = r.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Verify User B has 0 transactions and does NOT see User A's transactions
    r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers_b)
    stats_b = r.json()
    print("User B stats (should be 0):", stats_b)
    assert stats_b["total_transactions"] == 0, "User B saw transactions from User A!"

    r = requests.get(f"{BASE_URL}/api/transactions", headers=headers_b)
    txs_b = r.json()
    assert len(txs_b["items"]) == 0, "User B was able to see User A's transactions!"
    print("Isolation verified: User B cannot see User A's data!")

    print("\n=== 9. Testing Demo Analyst Global Workspace ===")
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "analyst@aegisaml.corp",
        "password": "password123"
    })
    assert r.status_code == 200
    token_demo = r.json()["access_token"]
    headers_demo = {"Authorization": f"Bearer {token_demo}"}

    r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers_demo)
    stats_demo = r.json()
    print(f"Demo Analyst stats: {stats_demo['total_accounts']} accounts, {stats_demo['total_transactions']} transactions")
    assert stats_demo["total_accounts"] >= 0

    print("\n>>> ALL 9 TESTS PASSED FLAWLESSLY! <<<")

if __name__ == "__main__":
    test_full_pipeline_and_auth()
