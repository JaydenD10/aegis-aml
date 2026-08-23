# AegisAML Dataset Directory

This directory stores raw and processed AML datasets. Large binary and CSV files (>50MB) are excluded from version control via `.gitignore` to comply with Git/GitHub repository size limits.

To populate this directory with synthetic or benchmark data:
1. Run `python preprocess.py` to generate synthetic transactions and baseline features.
2. Or upload CSV datasets directly through the AegisAML Web Dashboard at `/upload`.
