import pandas as pd
import json
import os
import time
from sqlalchemy import create_engine
from models import Base
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.environ.get('POSTGRES_USER')
DB_PASS = os.environ.get('POSTGRES_PASSWORD')
DB_HOST = os.environ.get('POSTGRES_HOST')
DB_PORT = os.environ.get('POSTGRES_PORT')
DB_NAME = os.environ.get('POSTGRES_DB')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

def init_db():
    print("Initializing database schema...")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    print("Schema created.")

def import_accounts():
    print("Importing accounts...")
    accounts_df = pd.read_csv('../data/accounts.csv')
    accounts_df.columns = [c.lower() for c in accounts_df.columns]
    accounts_df['is_fraud'] = accounts_df['is_fraud'].astype(str).str.lower() == 'true'
    accounts_df.to_sql('accounts', engine, if_exists='append', index=False)
    print("Accounts imported.")

def import_transactions():
    print("Importing transactions in chunks...")
    chunk_size = 100000
    for i, chunk in enumerate(pd.read_csv('../data/transactions.csv', chunksize=chunk_size)):
        chunk.columns = [c.lower() for c in chunk.columns]
        chunk['is_fraud'] = chunk['is_fraud'].astype(str).str.lower() == 'true'
        chunk['alert_id'] = chunk['alert_id'].replace(-1, None)
        chunk.to_sql('transactions', engine, if_exists='append', index=False)
        print(f"Imported transaction chunk {i+1}")

def import_alerts():
    print("Importing alerts...")
    try:
        alerts_df = pd.read_csv('../data/alerts.csv')
        alerts_df.columns = [c.lower() for c in alerts_df.columns]
        alerts_df['is_fraud'] = alerts_df['is_fraud'].astype(str).str.lower() == 'true'
        alerts_df.to_sql('alerts', engine, if_exists='append', index=False)
        print("Alerts imported.")
    except Exception as e:
        print(f"Skipping alerts: {e}")

def import_predictions():
    print("Importing ML predictions in chunks...")
    chunk_size = 100000
    cols_to_keep = ['tx_id', 'log_amount', 'is_large_txn', 'payment_format_enc', 'rolling_mean_amt_send', 
            'rolling_std_amt_send', 'rolling_txn_count_send', 'acct_total_txns_send', 'acct_avg_amount_send', 
            'acct_max_amount_send', 'acct_max_mean_ratio_send', 'rolling_mean_amt_recv', 'rolling_std_amt_recv', 
            'acct_total_txns_recv', 'sender_out_degree', 'sender_in_degree', 'receiver_in_degree', 'receiver_out_degree', 
            'sender_total_degree', 'receiver_total_degree', 'sender_pagerank', 'receiver_pagerank', 'drift_score', 
            'ml_score', 'composite_score', 'risk_band']

    for i, chunk in enumerate(pd.read_csv('../data/test_predictions.csv', chunksize=chunk_size)):
        chunk.columns = [c.lower() for c in chunk.columns]
        # Only import columns that exist in the CSV and in our desired list
        available_cols = [c for c in cols_to_keep if c in chunk.columns]
        preds = chunk[available_cols]
        preds.to_sql('ml_predictions', engine, if_exists='append', index=False)
        print(f"Imported prediction chunk {i+1}")

def import_explanations():
    print("Importing SHAP explanations...")
    try:
        with open('../data/sample_explanation.json', 'r') as f:
            data = json.load(f)
        
        df = pd.DataFrame([{
            'tx_id': data['tx_id'],
            'shap_json': json.dumps(data['features'])
        }])
        df.to_sql('explanations', engine, if_exists='append', index=False)
        print("Explanations imported.")
    except Exception as e:
        print(f"Skipping explanations: {e}")

if __name__ == "__main__":
    start_time = time.time()
    try:
        init_db()
        import_accounts()
        import_transactions()
        import_alerts()
        import_predictions()
        import_explanations()
        
        # Verify counts
        from sqlalchemy import text
        with engine.connect() as conn:
            acc_ct = conn.execute(text("SELECT count(*) FROM accounts")).scalar()
            tx_ct = conn.execute(text("SELECT count(*) FROM transactions")).scalar()
            pred_ct = conn.execute(text("SELECT count(*) FROM ml_predictions")).scalar()
            print(f"Verification: {acc_ct} accounts, {tx_ct} transactions, {pred_ct} predictions.")
    except Exception as e:
        print(f"Database ingestion failed: {e}")
    
    print(f"Ingestion finished in {time.time() - start_time:.2f} seconds.")
