import sys
import os
import dulwich.porcelain as dp
from dulwich.repo import Repo

REPO_PATH = r"c:\Users\JAYDEN\Desktop\aml"

def push_to_github(remote_url=None):
    repo = Repo(REPO_PATH)
    
    if not remote_url and len(sys.argv) > 1:
        remote_url = sys.argv[1]

    if not remote_url:
        print("Usage: python push_to_github.py <GITHUB_REMOTE_URL>")
        print("Example: python push_to_github.py https://github.com/your-username/aegis-aml.git")
        print("With Token: python push_to_github.py https://ghp_YourToken@github.com/your-username/aegis-aml.git")
        return

    print(f"Setting remote origin -> {remote_url}")
    try:
        dp.remote_add(REPO_PATH, b'origin', remote_url.encode('utf-8'))
    except Exception:
        # If origin already exists, update url
        config = repo.get_config()
        config.set((b'remote', b'origin'), b'url', remote_url.encode('utf-8'))
        config.write_to_path()

    print("Pushing 'master' branch to GitHub origin...")
    try:
        dp.push(REPO_PATH, remote_location=b'origin', refspecs=[b'refs/heads/master:refs/heads/main'])
        print("[SUCCESS] Successfully pushed AegisAML project to GitHub main branch!")
    except Exception as e:
        print(f"[PUSH ERROR]: {e}")
        print("\nIf authentication failed, use your GitHub Personal Access Token in the URL:")
        print("python push_to_github.py https://<GITHUB_TOKEN>@github.com/<USERNAME>/<REPO_NAME>.git")

if __name__ == "__main__":
    push_to_github()
