// Test ALL compiler languages
// Run: node test-all-languages.js

const testCases = [
  {
    language: 'javascript',
    name: 'JavaScript (Node.js)',
    code: 'console.log("Hello from JavaScript!");'
  },
  {
    language: 'python',
    name: 'Python 3',
    code: 'print("Hello from Python!")'
  },
  {
    language: 'c',
    name: 'C (GCC)',
    code: `#include <stdio.h>
int main() {
    printf("Hello from C!\\n");
    return 0;
}`
  },
  {
    language: 'cpp',
    name: 'C++ (GCC)',
    code: `#include <iostream>
using namespace std;
int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}`
  },
  {
    language: 'java',
    name: 'Java (OpenJDK 17)',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}`
  },
  {
    language: 'go',
    name: 'Go 1.21',
    code: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")
}`
  },
  {
    language: 'ruby',
    name: 'Ruby 3.2',
    code: 'puts "Hello from Ruby!"'
  },
  {
    language: 'php',
    name: 'PHP 8.2',
    code: `<?php
echo "Hello from PHP!\\n";`
  },
  {
    language: 'perl',
    name: 'Perl 5.38',
    code: 'print "Hello from Perl!\\n";'
  },
  {
    language: 'rust',
    name: 'Rust 1.73',
    code: `fn main() {
    println!("Hello from Rust!");
}`
  },
  {
    language: 'r',
    name: 'R',
    code: 'cat("Hello from R!\\n")'
  },
  {
    language: 'typescript',
    name: 'TypeScript',
    code: 'const msg: string = "Hello from TypeScript!"; console.log(msg);'
  },
  {
    language: 'swift',
    name: 'Swift 5.9',
    code: 'print("Hello from Swift!")'
  }
];

const COMPILER_URL = 'http://localhost:3001/api/compile';

async function testLanguage(tc) {
  const startTime = Date.now();
  try {
    const resp = await fetch(COMPILER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'compiler-internal-key': 'secret'
      },
      body: JSON.stringify({
        code: tc.code,
        language: tc.language,
        input: ''
      })
    });

    const data = await resp.json();
    const elapsed = Date.now() - startTime;

    if (resp.status !== 200) {
      console.log(`  ❌ ${tc.name.padEnd(25)} | HTTP ${resp.status} | ${data.error || 'Unknown error'}`);
      return false;
    }

    const output = (data.output || '').trim();
    const error = (data.error || '').trim();
    const exitOk = data.exitCode === 0 || data.exitCode === undefined; // undefined = cached

    if (exitOk && output) {
      console.log(`  ✅ ${tc.name.padEnd(25)} | Output: "${output}" | ${elapsed}ms${data.cached ? ' (cached)' : ''}`);
      return true;
    } else {
      console.log(`  ❌ ${tc.name.padEnd(25)} | Exit: ${data.exitCode} | Output: "${output}" | Error: "${error.slice(0, 150)}" | ${elapsed}ms`);
      return false;
    }
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.log(`  ❌ ${tc.name.padEnd(25)} | NETWORK ERROR: ${err.message} | ${elapsed}ms`);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  🧪 COMPILER LANGUAGE TESTS');
  console.log('  Testing all languages against http://localhost:3001/api/compile');
  console.log('='.repeat(80) + '\n');

  // First check health
  try {
    const health = await fetch('http://localhost:3001/health');
    const healthData = await health.json();
    console.log(`  📡 Backend: ${healthData.status} | MongoDB: ${healthData.services.mongodb} | Redis: ${healthData.services.redis}\n`);
  } catch (err) {
    console.log(`  ❌ Backend unreachable: ${err.message}`);
    console.log('  ⛔ Make sure docker compose is running in the compiler directory!');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const success = await testLanguage(tc);
    if (success) passed++;
    else failed++;
  }

  console.log('\n' + '='.repeat(80));
  console.log(`  📊 Results: ${passed}/${testCases.length} passed, ${failed} failed`);
  console.log('='.repeat(80) + '\n');
}

main();
