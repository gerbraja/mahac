#!/bin/bash

echo "========================================"
echo "Git Commit: Unilevel System Complete"
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
git commit -m "✨ Implement complete Unilevel system with 7 levels

- Created UnilevelView.jsx with professional dashboard interface
- Added /api/unilevel/status and /api/unilevel/stats endpoints
- Implemented detailed statistics by level (1-7)
- Configured 27% total distribution across 7 levels
- Added navigation button in DashboardLayout
- Registered user 1 in Unilevel network
- Created comprehensive documentation (UNILEVEL_COMPLETO.md)
- System ready for production with full visualization and stats"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Git operations completed!"
echo "========================================"
