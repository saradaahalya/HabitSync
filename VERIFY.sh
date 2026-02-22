#!/bin/bash
# HabitSync - Verification Checklist
# Run this to verify everything is set up correctly

echo "=================================="
echo "   HabitSync Verification Check   "
echo "=================================="
echo ""

# Check folder structure
echo "✓ Checking folder structure..."
if [ -d "frontend" ] && [ -d "backend" ]; then
  echo "  ✅ frontend/ and backend/ folders exist"
else
  echo "  ❌ Missing frontend/ or backend/ folder"
fi

# Check frontend files
echo ""
echo "✓ Checking frontend files..."
FRONTEND_FILES=("index.html" "dashboard.html" "stats.html" "styles.css" "auth.js" "api-client.js" "dashboard.js" "stats.js")
for file in "${FRONTEND_FILES[@]}"; do
  if [ -f "frontend/$file" ]; then
    echo "  ✅ frontend/$file"
  else
    echo "  ❌ Missing frontend/$file"
  fi
done

# Check backend files
echo ""
echo "✓ Checking backend files..."
BACKEND_FILES=("server.js" "package.json" ".env")
for file in "${BACKEND_FILES[@]}"; do
  if [ -f "backend/$file" ]; then
    echo "  ✅ backend/$file"
  else
    echo "  ❌ Missing backend/$file"
  fi
done

# Check node_modules
echo ""
echo "✓ Checking backend dependencies..."
if [ -d "backend/node_modules" ]; then
  echo "  ✅ backend/node_modules/ exists (dependencies installed)"
else
  echo "  ⚠️  backend/node_modules/ missing (run: cd backend && npm install)"
fi

# Check package.json
echo ""
echo "✓ Checking configuration files..."
if [ -f "package.json" ]; then
  echo "  ✅ Root package.json"
else
  echo "  ⚠️  Root package.json missing (not critical)"
fi

if [ -f "README.md" ]; then
  echo "  ✅ README.md"
else
  echo "  ⚠️  README.md missing"
fi

echo ""
echo "=================================="
echo "   Setup Checklist                "
echo "=================================="
echo ""
echo "Before running the application:"
echo ""
echo "1. ✅ Folder structure organized"
echo "2. ✅ Frontend files in place"
echo "3. ✅ Backend files in place"
echo "4. ⏳ Backend dependencies installed (cd backend && npm install)"
echo "5. ⏳ Backend server running (cd backend && npm start)"
echo "6. ⏳ Frontend being served (cd frontend && python -m http.server 5500)"
echo ""
echo "=================================="
echo "   To Start Using HabitSync:      "
echo "=================================="
echo ""
echo "Terminal 1 (Backend):"
echo "  $ cd backend"
echo "  $ npm install    # (if not done)"
echo "  $ npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "  $ cd frontend"
echo "  $ python -m http.server 5500"
echo ""
echo "Browser:"
echo "  Open: http://127.0.0.1:5500"
echo ""
echo "=================================="
