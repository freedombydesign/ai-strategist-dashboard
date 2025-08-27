#!/usr/bin/env node

const { createServer } = require('net');
const { spawn } = require('child_process');

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.listen(port, '127.0.0.1');
  });
}

// Function to find the next available port starting from a given port
async function findAvailablePort(startPort = 3000) {
  let port = startPort;
  
  while (port < startPort + 100) { // Check up to 100 ports
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  
  throw new Error(`No available port found in range ${startPort}-${startPort + 99}`);
}

async function startDev() {
  try {
    console.log('🔍 Finding available port...');
    const availablePort = await findAvailablePort(3000);
    
    console.log(`🚀 Starting development server on port ${availablePort}`);
    console.log(`📍 URL: http://localhost:${availablePort}`);
    console.log('');
    
    // Set the port and start Next.js dev server
    const env = { ...process.env, PORT: availablePort.toString() };
    const nextDev = spawn('npx', ['next', 'dev', '--port', availablePort.toString()], {
      stdio: 'inherit',
      env: env,
      shell: true
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      nextDev.kill('SIGINT');
      process.exit(0);
    });
    
    nextDev.on('close', (code) => {
      if (code !== 0) {
        console.log(`Development server exited with code ${code}`);
      }
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Error starting development server:', error.message);
    process.exit(1);
  }
}

// Run the function
startDev();