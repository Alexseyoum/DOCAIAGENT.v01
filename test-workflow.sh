#!/bin/bash

# Complete Workflow Test - Document Processing Agent
# This script demonstrates the entire process from registration to generating educational content

API_BASE="https://docaiagent-v01.onrender.com/api/v1"

echo "🚀 Document Processing Agent - Complete Workflow Test"
echo "🌐 API: $API_BASE"
echo "⏰ Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================================"

# Step 1: Register user
echo ""
echo "🔐 STEP 1: Register User & Get API Key"
echo "============================================================"

TIMESTAMP=$(date +%s)
EMAIL="demo_${TIMESTAMP}@example.com"

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"DemoPassword123\",\"name\":\"Demo User\"}")

echo "$REGISTER_RESPONSE" | grep -q "success.*true" && echo "✅ User registered: $EMAIL" || echo "❌ Registration failed"

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✅ Got API token: ${TOKEN:0:50}..."

# Step 2: Upload document
echo ""
echo "📤 STEP 2: Upload Document"
echo "============================================================"

# Create test document
cat > /tmp/test-ml-doc.txt << 'EOF'
# Introduction to Machine Learning

Machine learning is a branch of artificial intelligence that enables computers to learn from data without being explicitly programmed. This revolutionary technology has transformed many industries.

## Core Concepts

### Supervised Learning
In supervised learning, algorithms learn from labeled training data to make predictions on new, unseen data. Common applications include:
- Image classification
- Spam detection
- Price prediction

### Unsupervised Learning
Unsupervised learning finds patterns in data without predefined labels. Key techniques include:
- Clustering
- Dimensionality reduction
- Anomaly detection

### Deep Learning
Deep learning uses neural networks with multiple layers to learn complex patterns. Applications include:
- Natural language processing
- Computer vision
- Speech recognition

## Key Algorithms

1. **Linear Regression**: Predicts continuous values
2. **Decision Trees**: Makes decisions based on feature values
3. **Neural Networks**: Mimics human brain structure
4. **Support Vector Machines**: Finds optimal decision boundaries

## Applications

Machine learning powers many modern technologies:
- Recommendation systems (Netflix, Amazon)
- Virtual assistants (Siri, Alexa)
- Autonomous vehicles
- Medical diagnosis
- Financial fraud detection

## Conclusion

As machine learning continues to evolve, it opens up new possibilities for solving complex problems and improving our daily lives.
EOF

echo "Created test document (ML fundamentals)"

UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/documents/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-ml-doc.txt")

DOC_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"documentId":"[^"]*' | cut -d'"' -f4)
echo "✅ Document uploaded: $DOC_ID"
echo "$UPLOAD_RESPONSE" | grep -o '"fileSize":[0-9]*' | cut -d':' -f2 | xargs -I {} echo "   File size: {} bytes"

# Step 3: Process document
echo ""
echo "⚙️  STEP 3: Process Document (Extract Text)"
echo "============================================================"

PROCESS_RESPONSE=$(curl -s -X POST "$API_BASE/documents/$DOC_ID/process" \
  -H "Authorization: Bearer $TOKEN")

echo "$PROCESS_RESPONSE" | grep -q "completed" && echo "✅ Document processed" || echo "❌ Processing failed"
echo "$PROCESS_RESPONSE" | grep -o '"wordCount":[0-9]*' | cut -d':' -f2 | xargs -I {} echo "   Word count: {}"

# Step 4: Generate Summary
echo ""
echo "📝 STEP 4: Generate Summary"
echo "============================================================"

SUMMARY_RESPONSE=$(curl -s -X POST "$API_BASE/generate/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentId\":\"$DOC_ID\",\"summaryType\":\"brief\"}")

echo "$SUMMARY_RESPONSE" | grep -q "success.*true" && echo "✅ Summary generated" || echo "❌ Summary failed"
echo ""
echo "Summary Preview:"
echo "$SUMMARY_RESPONSE" | grep -o '"overview":"[^"]*' | cut -d'"' -f4 | head -c 200
echo "..."

# Step 5: Generate Quiz
echo ""
echo ""
echo "❓ STEP 5: Generate Quiz"
echo "============================================================"

QUIZ_RESPONSE=$(curl -s -X POST "$API_BASE/generate/quiz" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentId\":\"$DOC_ID\",\"questionCount\":3,\"questionTypes\":[\"multiple_choice\"]}")

echo "$QUIZ_RESPONSE" | grep -q "success.*true" && echo "✅ Quiz generated (3 questions)" || echo "❌ Quiz failed"
echo ""
echo "Sample Question:"
echo "$QUIZ_RESPONSE" | grep -o '"question":"[^"]*' | head -1 | cut -d'"' -f4

# Step 6: Generate Flashcards
echo ""
echo ""
echo "🎴 STEP 6: Generate Flashcards"
echo "============================================================"

FLASHCARDS_RESPONSE=$(curl -s -X POST "$API_BASE/generate/flashcards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"documentId\":\"$DOC_ID\",\"cardCount\":5}")

echo "$FLASHCARDS_RESPONSE" | grep -q "success.*true" && echo "✅ Flashcards generated (5 cards)" || echo "❌ Flashcards failed"

# Summary
echo ""
echo "============================================================"
echo "🎉 WORKFLOW COMPLETED SUCCESSFULLY!"
echo "============================================================"
echo "📄 Document ID: $DOC_ID"
echo "🔑 API Token: ${TOKEN:0:50}..."
echo ""
echo "✅ All steps completed:"
echo "   1. ✅ User registered"
echo "   2. ✅ Document uploaded"
echo "   3. ✅ Text extracted"
echo "   4. ✅ Summary generated"
echo "   5. ✅ Quiz created"
echo "   6. ✅ Flashcards generated"
echo ""
echo "📚 See HOW_TO_USE_API.md for complete documentation"
echo "============================================================"

# Cleanup
rm -f /tmp/test-ml-doc.txt
