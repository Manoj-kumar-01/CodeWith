const Docker = require('dockerode');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { CompilationLog } = require('../config/mongodb');

const dockerOptions = process.platform === 'win32' ? { socketPath: '//./pipe/docker_engine' } : { socketPath: '/var/run/docker.sock' };
const docker = new Docker(dockerOptions);
const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute';
const TEMP_DIR = process.platform === 'win32' ? 'C:/tmp/compiler' : '/tmp/compiler';

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Language configurations - all working like normal online compilers
const languageConfigs = {
  c: {
    image: 'gcc:latest',
    extension: '.c',
    compiled: true,
    buildAndRun: (file, inputFile) => {
      const base = `/code/${file}`;
      const run = inputFile ? `/code/a.out < /code/${inputFile}` : '/code/a.out';
      return `gcc ${base} -o /code/a.out -lm 2>&1 && ${run}`;
    },
    memory: '256m',
    cpu: '0.5',
    timeout: 15
  },
  cpp: {
    image: 'gcc:latest',
    extension: '.cpp',
    compiled: true,
    buildAndRun: (file, inputFile) => {
      const base = `/code/${file}`;
      const run = inputFile ? `/code/a.out < /code/${inputFile}` : '/code/a.out';
      return `g++ ${base} -o /code/a.out -std=c++17 -lm 2>&1 && ${run}`;
    },
    memory: '256m',
    cpu: '0.5',
    timeout: 15
  },
  java: {
    image: 'eclipse-temurin:17-jdk-jammy',
    extension: '.java',
    compiled: true,
    buildAndRun: (file, inputFile) => {
      // Java requires class name to match filename, so we use Main.java approach
      const run = inputFile ? `java -cp /code Main < /code/${inputFile}` : 'java -cp /code Main';
      return `cp /code/${file} /code/Main.java && javac /code/Main.java 2>&1 && ${run}`;
    },
    memory: '512m',
    cpu: '1.0',
    timeout: 30
  },
  python: {
    image: 'python:3.11-slim',
    extension: '.py',
    compiled: false,
    buildAndRun: (file, inputFile) =>
      inputFile ? `python3 /code/${file} < /code/${inputFile}` : `python3 /code/${file}`,
    memory: '256m',
    cpu: '0.5',
    timeout: 15
  },
  javascript: {
    image: 'node:18-slim',
    extension: '.js',
    compiled: false,
    buildAndRun: (file, inputFile) =>
      inputFile ? `node /code/${file} < /code/${inputFile}` : `node /code/${file}`,
    memory: '256m',
    cpu: '0.5',
    timeout: 15
  },
  typescript: {
    image: 'node:18-slim',
    extension: '.ts',
    compiled: false,
    buildAndRun: (file, inputFile) => {
      const jsFile = file.replace('.ts', '.js');
      const run = inputFile
        ? `node /code/${jsFile} < /code/${inputFile}`
        : `node /code/${jsFile}`;
      // Strip common TypeScript-only syntax (type annotations) using sed
      // This handles: const x: string, (arg: type), function(): type, as Type, <Type>
      return `sed -E 's/: (string|number|boolean|any|void|never|unknown|object|Array<[^>]*>|[A-Z][a-zA-Z0-9]*)(\\[\\])?//g; s/ as [A-Za-z<>\\[\\]]+//g' /code/${file} > /code/${jsFile} && ${run}`;
    },
    memory: '512m',
    cpu: '0.5',
    timeout: 15
  },
  go: {
    image: 'golang:alpine',
    extension: '.go',
    compiled: true,
    buildAndRun: (file, inputFile) => {
      const run = inputFile ? `/code/a.out < /code/${inputFile}` : '/code/a.out';
      return `go build -o /code/a.out /code/${file} 2>&1 && ${run}`;
    },
    memory: '512m',
    cpu: '1.0',
    timeout: 30
  },
  rust: {
    image: 'rust:1.73-slim',
    extension: '.rs',
    compiled: true,
    buildAndRun: (file, inputFile) => {
      const run = inputFile ? `/code/a.out < /code/${inputFile}` : '/code/a.out';
      return `rustc /code/${file} -o /code/a.out 2>&1 && ${run}`;
    },
    memory: '512m',
    cpu: '0.5',
    timeout: 30
  },
  ruby: {
    image: 'ruby:3.2-slim',
    extension: '.rb',
    compiled: false,
    buildAndRun: (file, inputFile) =>
      inputFile ? `ruby /code/${file} < /code/${inputFile}` : `ruby /code/${file}`,
    memory: '256m',
    cpu: '0.5',
    timeout: 15
  },
  php: {
    image: 'php:8.2-cli',
    extension: '.php',
    compiled: false,
    buildAndRun: (file, inputFile) =>
      inputFile ? `php /code/${file} < /code/${inputFile}` : `php /code/${file}`,
    memory: '256m',
    cpu: '0.5',
    timeout: 15
  },
  perl: {
    image: 'perl:5.38',
    extension: '.pl',
    compiled: false,
    buildAndRun: (file, inputFile) =>
      inputFile ? `perl /code/${file} < /code/${inputFile}` : `perl /code/${file}`,
    memory: '256m',
    cpu: '0.5',
    timeout: 15
  },
  r: {
    image: 'r-base:latest',
    extension: '.r',
    compiled: false,
    buildAndRun: (file, inputFile) =>
      inputFile ? `Rscript /code/${file} < /code/${inputFile}` : `Rscript /code/${file}`,
    memory: '256m',
    cpu: '0.5',
    timeout: 20
  },
  swift: {
    image: 'swift:5.9-jammy',
    extension: '.swift',
    compiled: true,
    buildAndRun: (file, inputFile) => {
      const run = inputFile ? `/code/a.out < /code/${inputFile}` : '/code/a.out';
      return `swiftc /code/${file} -o /code/a.out 2>&1 && ${run}`;
    },
    memory: '1g',
    cpu: '1.0',
    timeout: 30
  },
  scala: {
    image: 'sbtscala/scala-sbt:eclipse-temurin-17.0.4_1.7.1_3.2.0',
    extension: '.scala',
    compiled: false,
    buildAndRun: (file, inputFile) =>
      inputFile ? `scala /code/${file} < /code/${inputFile} 2>&1` : `scala /code/${file} 2>&1`,
    memory: '1g',
    cpu: '1.0',
    timeout: 60
  }
};

// Piston language mappings
const pistonMappings = {
  c: { language: 'c', version: '10.2.1' },
  cpp: { language: 'cpp', version: '10.2.1' },
  java: { language: 'java', version: '15.0.2' },
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  go: { language: 'go', version: '1.16.2' },
  rust: { language: 'rust', version: '1.68.2' },
  ruby: { language: 'ruby', version: '3.0.1' },
  php: { language: 'php', version: '8.2.3' },
  perl: { language: 'perl', version: '5.32.1' },
  r: { language: 'r', version: '4.1.1' },
  swift: { language: 'swift', version: '5.3.3' },
  scala: { language: 'scala', version: '3.2.2' }
};

class Compiler {
  static dockerAvailable = null;

  // Check if Docker is available
  static async checkDocker() {
    if (this.dockerAvailable !== null) return this.dockerAvailable;
    try {
      await docker.ping();
      this.dockerAvailable = true;
      console.log('✅ Docker daemon reachable. Local mode available.');
    } catch (err) {
      this.dockerAvailable = false;
      console.warn('⚠️  Docker daemon unreachable. Using Remote Mode (Piston) by default.');
    }
    return this.dockerAvailable;
  }

  // Main entry point - Defaults to Remote if Docker fails or if USE_REMOTE_COMPILER=true
  static async compile(code, language, input = '', userId = null) {
    // If USE_REMOTE_COMPILER is explicitly false, force local mode
    if (process.env.USE_REMOTE_COMPILER === 'false') {
      return this.localCompile(code, language, input, userId);
    }
    
    // Default to Remote mode for "freely" use, unless user confirms they want auto-fallback
    const useRemote = process.env.USE_REMOTE_COMPILER === 'true' || 
                     process.env.USE_REMOTE_COMPILER === undefined || // Default to true if not set
                     (process.env.USE_REMOTE_COMPILER === 'auto' && !(await this.checkDocker()));

    if (useRemote) {
      return this.remoteCompile(code, language, input, userId);
    }
    return this.localCompile(code, language, input, userId);
  }

  // Remote compilation using Piston API
  static async remoteCompile(code, language, input = '', userId = null) {
    const startTime = Date.now();
    const mapping = pistonMappings[language];
    
    if (!mapping) throw new Error(`Language ${language} is not supported in remote mode`);

    try {
      console.log(`[Compiler] Using Remote Mode (Piston) for ${language}`);
      const response = await axios.post(PISTON_API_URL, {
        language: mapping.language,
        version: mapping.version,
        files: [{ content: code }],
        stdin: input
      });

      const { run } = response.data;
      const executionTime = Date.now() - startTime;
      const status = run.code === 0 ? 'success' : 'error';

      // Log to MongoDB
      if (userId) {
        await CompilationLog.create({
          userId,
          language,
          status,
          executionTime,
          codeLength: code.length,
          timestamp: new Date(),
          metadata: { exitCode: run.code, mode: 'remote' }
        }).catch(err => console.error('[Compiler] Log error:', err.message));
      }

      return {
        output: run.stdout,
        error: run.stderr || (run.code !== 0 ? run.output : ''),
        exitCode: run.code,
        executionTime
      };
    } catch (err) {
      console.error('[Compiler] Remote Compilation failed:', err.message);
      throw new Error(`Remote execution failed: ${err.message}`);
    }
  }

  // Local compilation logic
  static async localCompile(code, language, input = '', userId = null) {
    const startTime = Date.now();
    const sessionId = uuidv4();
    const config = languageConfigs[language];
    const fileName = `${sessionId}${config.extension}`;
    const inputFileName = input ? `${sessionId}_input.txt` : null;

    let container = null;

    try {
      // Write code to temp file
      await fs.writeFile(path.join(TEMP_DIR, fileName), code);
      console.log(`[Compiler] Written code file: ${fileName} (${code.length} bytes)`);

      // Write input if provided
      if (input) {
        await fs.writeFile(path.join(TEMP_DIR, inputFileName), input);
        console.log(`[Compiler] Written input file: ${inputFileName}`);
      }

      // Build the full command
      const fullCmd = config.buildAndRun(fileName, inputFileName);
      console.log(`[Compiler] Language: ${language}, Command: ${fullCmd}`);

      // Check if image exists locally, pull if not
      try {
        await docker.getImage(config.image).inspect();
        console.log(`[Compiler] Image ${config.image} found locally`);
      } catch (imgErr) {
        console.log(`[Compiler] Pulling image ${config.image}... (first time, may take a minute)`);
        await new Promise((resolve, reject) => {
          docker.pull(config.image, (err, stream) => {
            if (err) return reject(err);
            docker.modem.followProgress(stream, (err, output) => {
              if (err) return reject(err);
              console.log(`[Compiler] Image ${config.image} pulled successfully`);
              resolve(output);
            });
          });
        });
      }

      // Get the volume name — the temp dir is bound to compiler_compiler-temp
      // We need to find the actual volume name used by docker compose
      const volumeName = process.platform === 'win32' && !process.env.IN_DOCKER ? TEMP_DIR : await this.findVolumeName();
      const bindPath = volumeName.includes('/') || volumeName.includes('\\') ? volumeName.replace(/\\/g, '/') : volumeName;
      console.log(`[Compiler] Using volume bind: ${bindPath}`);

      // Create container
      container = await docker.createContainer({
        Image: config.image,
        Cmd: ['/bin/sh', '-c', fullCmd],
        WorkingDir: '/code',
        HostConfig: {
          Binds: [`${bindPath}:/code`],
          Memory: this.parseMemory(config.memory),
          MemorySwap: this.parseMemory(config.memory),
          CpuPeriod: 100000,
          CpuQuota: parseInt(parseFloat(config.cpu) * 100000),
          NetworkMode: 'none',
          SecurityOpt: ['no-new-privileges:true']
        },
        StopTimeout: config.timeout || 15
      });

      console.log(`[Compiler] Container created: ${container.id.slice(0, 12)}`);

      // Start container
      await container.start();
      console.log(`[Compiler] Container started`);

      // Wait for container to finish with timeout
      const waitPromise = container.wait({ condition: 'next-exit' });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout exceeded')), (config.timeout || 15) * 1000)
      );

      let waitResult;
      try {
        waitResult = await Promise.race([waitPromise, timeoutPromise]);
      } catch (timeoutErr) {
        // Kill the container on timeout
        try { await container.kill(); } catch (_) { }
        throw new Error(`Execution timed out after ${config.timeout || 15} seconds`);
      }

      console.log(`[Compiler] Container exited with code: ${waitResult.StatusCode}`);

      // Get logs
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 1000
      });

      // Parse logs
      const output = this.parseLogs(logs);
      const executionTime = Date.now() - startTime;

      console.log(`[Compiler] Output (stdout ${output.stdout.length} chars, stderr ${output.stderr.length} chars) in ${executionTime}ms`);
      if (output.stdout) console.log(`[Compiler] STDOUT: ${output.stdout.slice(0, 200)}`);
      if (output.stderr) console.log(`[Compiler] STDERR: ${output.stderr.slice(0, 200)}`);

      // Remove container
      try { await container.remove({ force: true }); } catch (_) { }
      container = null;

      // Log to MongoDB
      if (userId) {
        try {
          await CompilationLog.create({
            userId,
            language,
            status: waitResult.StatusCode === 0 ? 'success' : 'error',
            executionTime,
            codeLength: code.length,
            timestamp: new Date(),
            metadata: {
              exitCode: waitResult.StatusCode,
              sessionId
            }
          });
        } catch (logErr) {
          console.error('[Compiler] Failed to log compilation:', logErr.message);
        }
      }

      return {
        output: output.stdout,
        error: output.stderr,
        exitCode: waitResult.StatusCode,
        executionTime
      };

    } catch (err) {
      console.error('[Compiler] Compilation error:', err.message);

      // Clean up container if it exists
      if (container) {
        try { await container.remove({ force: true }); } catch (_) { }
      }

      // Log error to MongoDB
      if (userId) {
        try {
          await CompilationLog.create({
            userId,
            language,
            status: 'error',
            errorMessage: err.message,
            timestamp: new Date()
          });
        } catch (logErr) {
          console.error('[Compiler] Failed to log error:', logErr.message);
        }
      }

      throw err;
    } finally {
      // Cleanup files
      await this.cleanup(fileName, inputFileName);
    }
  }

  // Find the Docker volume name for compiler temp
  static async findVolumeName() {
    try {
      const volumes = await docker.listVolumes();
      const compilerVol = volumes.Volumes.find(v =>
        v.Name.includes('compiler-temp') || v.Name.includes('compiler_compiler-temp')
      );
      if (compilerVol) {
        return compilerVol.Name;
      }
    } catch (err) {
      console.error('[Compiler] Error finding volume:', err.message);
    }
    // Fallback to the expected name
    return 'compiler_compiler-temp';
  }

  // Parse memory string to bytes
  static parseMemory(memoryStr) {
    const units = {
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024
    };
    const match = memoryStr.match(/^(\d+)([mg])$/);
    if (match) {
      return parseInt(match[1]) * units[match[2]];
    }
    return 256 * 1024 * 1024; // Default 256MB
  }

  // Parse Docker logs
  static parseLogs(logs) {
    let stdout = '';
    let stderr = '';

    if (!logs || logs.length === 0) {
      return { stdout, stderr };
    }

    // Docker logs return Buffer with 8-byte header per chunk
    let offset = 0;
    try {
      while (offset < logs.length) {
        if (offset + 8 > logs.length) break;

        const header = logs.slice(offset, offset + 8);
        const streamType = header[0]; // 1 = stdout, 2 = stderr
        const size = header.readUInt32BE(4);

        offset += 8;
        if (offset + size > logs.length) {
          // Read whatever is available
          const chunk = logs.slice(offset).toString('utf8');
          if (streamType === 1) stdout += chunk;
          else if (streamType === 2) stderr += chunk;
          break;
        }

        const chunk = logs.slice(offset, offset + size).toString('utf8');

        if (streamType === 1) {
          stdout += chunk;
        } else if (streamType === 2) {
          stderr += chunk;
        }

        offset += size;
      }
    } catch (parseErr) {
      console.error('[Compiler] Log parse error:', parseErr.message);
      // Fallback: treat entire buffer as stdout
      stdout = logs.toString('utf8');
    }

    return { stdout, stderr };
  }

  // Cleanup files
  static async cleanup(...files) {
    for (const file of files) {
      if (file) {
        try {
          await fs.unlink(path.join(TEMP_DIR, file));
        } catch (err) {
          // Ignore if file doesn't exist
        }
      }
    }
  }

  // Get language info
  static getLanguageInfo(language) {
    return languageConfigs[language] || null;
  }

  // Check if language is supported
  static isSupported(language) {
    return !!languageConfigs[language];
  }

  // Get all supported languages
  static getSupportedLanguages() {
    return Object.keys(languageConfigs);
  }

  // Get statistics from MongoDB
  static async getStats(language, days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return await CompilationLog.aggregate([
      {
        $match: {
          language,
          timestamp: { $gte: cutoff }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgTime: { $avg: '$executionTime' },
          maxTime: { $max: '$executionTime' }
        }
      }
    ]);
  }
}

module.exports = Compiler;