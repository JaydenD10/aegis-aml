import os
import sys
import shutil
import dulwich.porcelain as dp
from dulwich.repo import Repo

REPO_PATH = r"c:\Users\JAYDEN\Desktop\aml"

def check_and_prepare_git(force_clean=False):
    print("==================================================")
    print("1. CHECKING GIT REPOSITORY STATUS")
    print("==================================================")
    
    git_dir = os.path.join(REPO_PATH, ".git")
    if force_clean and os.path.exists(git_dir):
        print(f"[INFO] Removing old .git for fresh clean init...")
        shutil.rmtree(git_dir)

    if os.path.exists(git_dir):
        print(f"[INFO] Existing Git repository found at {REPO_PATH}")
        repo = Repo(REPO_PATH)
    else:
        print(f"[INFO] Initializing new Git repository at {REPO_PATH}...")
        repo = dp.init(REPO_PATH)
        print("[SUCCESS] Git repository initialized.")

    print("\n==================================================")
    print("2. SCANNING FILES & DETECTING SENSITIVE DATA")
    print("==================================================")
    
    # Add all files respecting .gitignore
    print("\nStaging project files...")
    dp.add(REPO_PATH)
    
    # Get status
    status = dp.status(REPO_PATH)
    staged = status.staged
    
    all_staged_files = []
    if staged.get('add'):
        for f in staged['add']:
            fname = f.decode('utf-8') if isinstance(f, bytes) else str(f)
            all_staged_files.append(fname)
    if staged.get('modify'):
        for f in staged['modify']:
            fname = f.decode('utf-8') if isinstance(f, bytes) else str(f)
            all_staged_files.append(fname)

    print(f"Total files staged: {len(all_staged_files)}")

    # Secret and large file verification check
    secret_hits = []
    large_hits = []
    for f in all_staged_files:
        norm_f = f.replace('\\', '/')
        if (norm_f.endswith('.env') or ('/.env.' in norm_f and not norm_f.endswith('.example')) or 
            'node_modules' in norm_f or '__pycache__' in norm_f or norm_f.endswith('.pem') or norm_f.endswith('.key')):
            secret_hits.append(f)
        full_p = os.path.join(REPO_PATH, f)
        if os.path.exists(full_p) and os.path.getsize(full_p) > 30 * 1024 * 1024:
            large_hits.append(f)

    print("\n==================================================")
    print("3. SECURITY & SIZE SCAN RESULT")
    print("==================================================")
    if secret_hits:
        print(f"[ALERT] Potential secret files detected in staging: {secret_hits}")
        sys.exit(1)
    if large_hits:
        print(f"[ALERT] Large files detected in staging: {large_hits}")
        sys.exit(1)

    print("[PASS] 0 secrets and 0 large files detected.")

    # Commit
    print("\n==================================================")
    print("4. CREATING COMMIT")
    print("==================================================")
    try:
        commit_id = dp.commit(
            REPO_PATH,
            message=b"feat: production AegisAML release - multi-user AML forensics, liquid-glass UI & deployment manifests",
            author=b"JaydenD10 <developer@aegisaml.corp>",
            committer=b"JaydenD10 <developer@aegisaml.corp>"
        )
        cid_str = commit_id.decode('utf-8') if isinstance(commit_id, bytes) else str(commit_id)
        print(f"[SUCCESS] Committed successfully: Commit ID {cid_str}")
        return cid_str
    except Exception as e:
        print(f"[INFO] Commit status: {e}")
        return None

if __name__ == "__main__":
    force = "--clean" in sys.argv
    check_and_prepare_git(force_clean=force)
