/**
 * Test script to verify LangSmith integration
 *
 * Usage:
 * 1. Make sure you have LANGCHAIN_TRACING_V2, LANGCHAIN_API_KEY, and LANGCHAIN_PROJECT in your .env
 * 2. Run: ts-node test-langsmith.ts
 * 3. Check LangSmith UI to see the trace
 */

import { createLLM } from './src/utils/llm';
import dotenv from 'dotenv';

dotenv.config();

async function testLangSmith() {
  console.log('🔍 Testing LangSmith integration...\n');

  // Check if environment variables are set
  const tracingEnabled = process.env.LANGCHAIN_TRACING_V2 === 'true';
  const hasApiKey = !!process.env.LANGCHAIN_API_KEY;
  const projectName = process.env.LANGCHAIN_PROJECT;

  console.log('Environment Check:');
  console.log('- LANGCHAIN_TRACING_V2:', tracingEnabled ? '✅ enabled' : '❌ disabled');
  console.log('- LANGCHAIN_API_KEY:', hasApiKey ? '✅ set' : '❌ not set');
  console.log('- LANGCHAIN_PROJECT:', projectName || '❌ not set');
  console.log();

  if (!tracingEnabled || !hasApiKey) {
    console.error('⚠️  LangSmith is not properly configured!');
    console.error('Please set LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY in your .env file');
    console.error('See LANGSMITH_SETUP.md for instructions\n');
    process.exit(1);
  }

  console.log('✅ LangSmith configuration looks good!\n');
  console.log('🚀 Making a test LLM call...\n');

  try {
    const llm = createLLM('gpt-4o-mini', 0.2);
    const response = await llm.invoke('Say "LangSmith integration successful!" in a creative way.');

    console.log('✅ LLM Response:', response.content);
    console.log();
    console.log('🎉 Success! Check your LangSmith dashboard at:');
    console.log(`   https://smith.langchain.com/o/default/projects/p/${projectName}`);
    console.log();
    console.log('You should see a trace for this test call.');
  } catch (error) {
    console.error('❌ Error making LLM call:', error);
    process.exit(1);
  }
}

testLangSmith();
