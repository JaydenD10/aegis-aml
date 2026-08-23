import pandas as pd
import numpy as np
import networkx as nx

def load_data(data_dir='data'):
    print("Loading datasets...")
    accounts = pd.read_csv(f'{data_dir}/accounts.csv')
    transactions = pd.read_csv(f'{data_dir}/transactions.csv')
    try:
        alerts = pd.read_csv(f'{data_dir}/alerts.csv')
    except FileNotFoundError:
        alerts = pd.DataFrame()
    return accounts, transactions, alerts

def engineer_basic_features(transactions):
    print("Engineering Basic Features (Group A)...")
    df = transactions.copy()
    df['log_amount'] = np.log1p(df['TX_AMOUNT'])
    df['is_large_txn'] = (df['TX_AMOUNT'] > 10000).astype(int)
    
    if 'TX_TYPE' in df.columns:
        df['payment_format_enc'] = df['TX_TYPE'].astype('category').cat.codes
        
    df['day_index'] = df['TIMESTAMP']
    return df

def engineer_behavioral_features(transactions):
    print("Engineering Behavioral Features (Group B)...")
    # Sender behavioral features
    df = transactions.sort_values(by=['SENDER_ACCOUNT_ID', 'TIMESTAMP']).copy()
    
    # Rolling 20 window
    df['rolling_mean_amt_send'] = df.groupby('SENDER_ACCOUNT_ID')['TX_AMOUNT'].transform(lambda x: x.rolling(20, min_periods=1).mean())
    df['rolling_std_amt_send'] = df.groupby('SENDER_ACCOUNT_ID')['TX_AMOUNT'].transform(lambda x: x.rolling(20, min_periods=1).std().fillna(0))
    df['rolling_txn_count_send'] = df.groupby('SENDER_ACCOUNT_ID')['TX_AMOUNT'].transform(lambda x: x.rolling(20, min_periods=1).count())
    
    # Account level aggregations (cumulative to avoid data leakage)
    df['acct_total_txns_send'] = df.groupby('SENDER_ACCOUNT_ID').cumcount() + 1
    df['acct_avg_amount_send'] = df.groupby('SENDER_ACCOUNT_ID')['TX_AMOUNT'].transform(lambda x: x.expanding().mean())
    df['acct_max_amount_send'] = df.groupby('SENDER_ACCOUNT_ID')['TX_AMOUNT'].transform(lambda x: x.expanding().max())
    
    df['acct_max_mean_ratio_send'] = df['acct_max_amount_send'] / (df['acct_avg_amount_send'] + 1e-5)
    
    # Receiver behavioral features
    df = df.sort_values(by=['RECEIVER_ACCOUNT_ID', 'TIMESTAMP'])
    df['rolling_mean_amt_recv'] = df.groupby('RECEIVER_ACCOUNT_ID')['TX_AMOUNT'].transform(lambda x: x.rolling(20, min_periods=1).mean())
    df['rolling_std_amt_recv'] = df.groupby('RECEIVER_ACCOUNT_ID')['TX_AMOUNT'].transform(lambda x: x.rolling(20, min_periods=1).std().fillna(0))
    df['acct_total_txns_recv'] = df.groupby('RECEIVER_ACCOUNT_ID').cumcount() + 1
    
    # Sort back by TX_ID or TIMESTAMP
    df = df.sort_values(by=['TIMESTAMP', 'TX_ID'])
    return df

def engineer_network_features(transactions):
    print("Engineering Network Features (Group C)...")
    # To avoid look-ahead bias completely in a temporal setting is hard with a single static graph.
    # The research description says: out_degree, in_degree, total_degree, fan_out_ratio, fan_in_ratio, pagerank_score.
    # We will build a static graph of the training period or whole graph (common simplification, but ideally temporal).
    # We'll use a static graph for now as a baseline representation.
    G = nx.from_pandas_edgelist(transactions, 'SENDER_ACCOUNT_ID', 'RECEIVER_ACCOUNT_ID', create_using=nx.DiGraph())
    
    in_degrees = dict(G.in_degree())
    out_degrees = dict(G.out_degree())
    
    # Calculate PageRank
    pagerank = nx.pagerank(G, alpha=0.85, max_iter=50) # Fast settings for large graph
    
    df = transactions.copy()
    
    df['sender_out_degree'] = df['SENDER_ACCOUNT_ID'].map(out_degrees).fillna(0)
    df['sender_in_degree'] = df['SENDER_ACCOUNT_ID'].map(in_degrees).fillna(0)
    df['receiver_in_degree'] = df['RECEIVER_ACCOUNT_ID'].map(in_degrees).fillna(0)
    df['receiver_out_degree'] = df['RECEIVER_ACCOUNT_ID'].map(out_degrees).fillna(0)
    
    df['sender_total_degree'] = df['sender_out_degree'] + df['sender_in_degree']
    df['receiver_total_degree'] = df['receiver_out_degree'] + df['receiver_in_degree']
    
    df['sender_pagerank'] = df['SENDER_ACCOUNT_ID'].map(pagerank).fillna(0)
    df['receiver_pagerank'] = df['RECEIVER_ACCOUNT_ID'].map(pagerank).fillna(0)
    
    return df

def preprocess_pipeline():
    accounts, transactions, alerts = load_data()
    
    tx_features = engineer_basic_features(transactions)
    tx_features = engineer_behavioral_features(tx_features)
    tx_features = engineer_network_features(tx_features)
    
    # Group D (Bank/KYC) is skipped as per plan since data isn't available.
    
    print("Preprocessing complete.")
    print(f"Transactions shape: {tx_features.shape}")
    
    # Save the processed data for the next steps
    tx_features.to_csv('data/processed_transactions.csv', index=False)
    print("Saved processed features to data/processed_transactions.csv")
    return tx_features, accounts

if __name__ == "__main__":
    preprocess_pipeline()
