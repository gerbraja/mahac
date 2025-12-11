#!/bin/bash

echo "========================================"
echo "Git Commit: Forced Matrix System"
echo "========================================"

# Change to project directory
cd /c/Users/mahac/multinivel/tiendavirtual/miweb/CentroComercialTEI

# Check status
echo ""
echo "📋 Checking git status..."
git status

# Add all changes
echo ""
echo "➕ Adding all changes..."
git add .

# Commit
echo ""
echo "💾 Committing changes..."
git commit -m "✨ Implement complete Forced Matrix system (9 levels)

- Created ForcedMatrixMember and ForcedMatrixCycle models
- Implemented 4 API endpoints: /status, /stats, /join, /cycle
- Added MATRIX_CONFIG for all 9 matrices (CONSUMIDOR to DIAMANTE AZUL)
- Updated MatrixView.jsx to fetch real data from backend
- Created database tables and registered user 1 in CONSUMIDOR
- Added complete documentation in FORCED_MATRIX_COMPLETO.md
- System ready for production testing"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Git operations completed!"
echo "========================================"
