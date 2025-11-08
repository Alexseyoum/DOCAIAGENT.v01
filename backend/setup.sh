#!/bin/bash

echo "🚀 Setting up Document Processing Agent Backend..."

# Check Node.js version
echo "Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 20 ]; then
    echo "❌ Node.js version 20 or higher is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please add your ANTHROPIC_API_KEY to .env file"
else
    echo ""
    echo "✅ .env file already exists"
fi

# Create uploads directory
echo ""
echo "📁 Creating uploads directory..."
mkdir -p uploads
echo "✅ Uploads directory created"

# Create test fixtures directory
echo ""
echo "📁 Creating test fixtures directory..."
mkdir -p src/__tests__/fixtures
echo "✅ Test fixtures directory created"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your ANTHROPIC_API_KEY to .env file"
echo "2. Run 'npm run dev' to start development server"
echo "3. Run 'npm test' to run tests"
echo ""
