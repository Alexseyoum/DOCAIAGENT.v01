/**
 * Complete Workflow Test - Document Processing Agent
 *
 * This script demonstrates the entire workflow:
 * 1. Register user
 * 2. Upload document
 * 3. Process (extract text)
 * 4. Generate summary
 * 5. Generate quiz
 * 6. Generate flashcards
 */

const fs = require('fs');

const API_BASE = 'https://docaiagent-v01.onrender.com/api/v1';
let authToken = null;
let documentId = null;

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...options.headers,
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  };

  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}

// Step 1: Register or Login
async function authenticate() {
  console.log('\n🔐 STEP 1: Authentication');
  console.log('='.repeat(60));

  try {
    // Try to register a new user
    const email = `test_${Date.now()}@example.com`;
    const response = await apiCall('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'TestPassword123',
        name: 'Workflow Test User'
      })
    });

    authToken = response.data.token;
    console.log('✅ Registered new user:', email);
    console.log('✅ Got API token:', authToken.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

// Step 2: Upload Document
async function uploadDocument() {
  console.log('\n📤 STEP 2: Upload Document');
  console.log('='.repeat(60));

  try {
    // Create a test document
    const testContent = `
# Machine Learning Fundamentals

Machine learning is a branch of artificial intelligence (AI) that enables computers to learn from data without being explicitly programmed. It has revolutionized many fields including healthcare, finance, and technology.

## Key Concepts

1. **Supervised Learning**: Learning from labeled data
2. **Unsupervised Learning**: Finding patterns in unlabeled data
3. **Neural Networks**: Models inspired by the human brain
4. **Deep Learning**: Multi-layered neural networks

## Applications

- Image Recognition
- Natural Language Processing
- Recommendation Systems
- Autonomous Vehicles

## Conclusion

Machine learning continues to advance rapidly, with new techniques and applications emerging constantly.
    `.trim();

    // Write to temporary file
    const tempFile = 'temp-test-doc.txt';
    fs.writeFileSync(tempFile, testContent);

    // Create FormData and upload
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFile));

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    documentId = data.documentId;
    console.log('✅ Document uploaded successfully');
    console.log(`   Document ID: ${documentId}`);
    console.log(`   Filename: ${data.filename}`);
    console.log(`   File Size: ${data.fileSize} bytes`);
    console.log(`   Status: ${data.status}`);

    // Clean up temp file
    fs.unlinkSync(tempFile);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

// Step 3: Process Document (Extract Text)
async function processDocument() {
  console.log('\n⚙️  STEP 3: Process Document (Extract Text)');
  console.log('='.repeat(60));

  try {
    const response = await apiCall(`/documents/${documentId}/process`, {
      method: 'POST'
    });

    console.log('✅ Document processed successfully');
    console.log(`   Status: ${response.status}`);
    console.log(`   Word Count: ${response.wordCount}`);
    console.log(`   Extracted At: ${response.extractedAt}`);
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    throw error;
  }
}

// Step 4: Generate Summary
async function generateSummary() {
  console.log('\n📝 STEP 4: Generate Summary');
  console.log('='.repeat(60));

  try {
    const response = await apiCall('/generate/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        summaryType: 'brief'
      })
    });

    console.log('✅ Summary generated successfully');
    console.log(`   Title: ${response.summary.title}`);
    console.log(`   Document Type: ${response.summary.documentType}`);
    console.log(`   Word Count: ${response.metadata.wordCount}`);
    console.log(`   Processing Time: ${response.metadata.processingTime}s`);
    console.log(`   LLM Provider: ${response.metadata.llmProvider}`);

    console.log('\n📄 Summary Overview:');
    console.log('   ' + response.summary.overview);

    console.log('\n🔑 Key Points:');
    response.summary.keyPoints.forEach((point, i) => {
      console.log(`   ${i + 1}. ${point}`);
    });

    console.log('\n📚 Main Topics:');
    console.log('   ' + response.summary.mainTopics.join(', '));
  } catch (error) {
    console.error('❌ Summary generation failed:', error.message);
    throw error;
  }
}

// Step 5: Generate Quiz
async function generateQuiz() {
  console.log('\n❓ STEP 5: Generate Quiz');
  console.log('='.repeat(60));

  try {
    const response = await apiCall('/generate/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        questionCount: 3,
        questionTypes: ['multiple_choice']
      })
    });

    console.log('✅ Quiz generated successfully');
    console.log(`   Title: ${response.quiz.title}`);
    console.log(`   Questions: ${response.metadata.questionCount}`);
    console.log(`   Difficulty: ${response.metadata.difficulty}`);
    console.log(`   Processing Time: ${response.metadata.processingTime}s`);

    console.log('\n📋 Sample Questions:');
    response.quiz.questions.slice(0, 2).forEach((q, i) => {
      console.log(`\n   Question ${i + 1}: ${q.question}`);
      q.options.forEach((opt, j) => {
        const marker = opt === q.correctAnswer ? '✓' : ' ';
        console.log(`   ${marker} ${String.fromCharCode(65 + j)}. ${opt}`);
      });
      console.log(`   💡 ${q.explanation.substring(0, 100)}...`);
    });
  } catch (error) {
    console.error('❌ Quiz generation failed:', error.message);
    throw error;
  }
}

// Step 6: Generate Flashcards
async function generateFlashcards() {
  console.log('\n🎴 STEP 6: Generate Flashcards');
  console.log('='.repeat(60));

  try {
    const response = await apiCall('/generate/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId,
        cardCount: 5
      })
    });

    console.log('✅ Flashcards generated successfully');
    console.log(`   Title: ${response.flashcards.title}`);
    console.log(`   Cards: ${response.metadata.cardCount}`);
    console.log(`   Processing Time: ${response.metadata.processingTime}s`);

    console.log('\n📇 Sample Flashcards:');
    response.flashcards.cards.slice(0, 3).forEach((card, i) => {
      console.log(`\n   Card ${i + 1}:`);
      console.log(`   Front: ${card.front}`);
      console.log(`   Back: ${card.back}`);
      console.log(`   Category: ${card.category} | Difficulty: ${card.difficulty}`);
      if (card.hint) {
        console.log(`   💡 Hint: ${card.hint}`);
      }
    });
  } catch (error) {
    console.error('❌ Flashcard generation failed:', error.message);
    throw error;
  }
}

// Run complete workflow
async function runCompleteWorkflow() {
  console.log('🚀 Document Processing Agent - Complete Workflow Test');
  console.log('🌐 API: ' + API_BASE);
  console.log('⏰ Started:', new Date().toISOString());
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    await authenticate();
    await uploadDocument();
    await processDocument();
    await generateSummary();
    await generateQuiz();
    await generateFlashcards();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 WORKFLOW COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Time: ${totalTime} seconds`);
    console.log(`📄 Document ID: ${documentId}`);
    console.log(`🔑 API Token: ${authToken.substring(0, 50)}...`);
    console.log('\n✅ All features working correctly!');
    console.log('\nYou can now:');
    console.log('  1. Upload your own documents');
    console.log('  2. Generate summaries in 3 different levels');
    console.log('  3. Create custom quizzes with multiple question types');
    console.log('  4. Generate flashcards for studying');
    console.log('\n📚 See HOW_TO_USE_API.md for complete documentation');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message);
    console.error('\nPlease check:');
    console.error('  1. API is running (check /health endpoint)');
    console.error('  2. API key is valid');
    console.error('  3. Network connection is stable');
    process.exit(1);
  }
}

// Run it
runCompleteWorkflow().catch(console.error);
