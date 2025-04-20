
import { PrismaClient } from '@prisma/client';
import proxy from 'express-http-proxy';
import express from 'ultimate-express';
import path from 'path';
import { randomUUID } from 'crypto';
import si from 'systeminformation';

const prisma = new PrismaClient();
const app = express({ uwsOptions: {} });

// In-memory log storage (limited size)
const MAX_LOGS = 100;
let serverLogs = [];

function addLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry); // Also log to console
  serverLogs.unshift(logEntry); // Add to the beginning
  if (serverLogs.length > MAX_LOGS) {
    serverLogs.pop(); // Remove the oldest log if limit exceeded
  }
}

// Request logging middleware
app.use((req, res, next) => {
  req.id = randomUUID();
  const start = Date.now();
  const logRequest = () => {
    const duration = Date.now() - start;
    const logMessage = `${req.id} ${req.method} ${req.url} ${res.statusCode} ${duration}ms`;
    // console.log(`[${new Date().toISOString()}] ${logMessage}`); // Replaced by addLog
    addLog(logMessage);
  };
  res.on('finish', logRequest);
  next();
});

// Error logging middleware
app.use((err, req, res, next) => {
  const errorMessage = `${req.id} Error: ${err.message}`;
  console.error(`[${new Date().toISOString()}] ${errorMessage}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  addLog(`ERROR: ${errorMessage}`); // Log error message
  // Removed misplaced lines causing syntax error
  res.status(500).json({ error: 'Internal server error' });
});

// Parse JSON bodies
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to load and apply proxy routes
async function setupProxyRoutes() {
  const routes = await prisma.route.findMany();
  activeRoutes = routes;

  

  // Set up dynamic routes
  routes.forEach(route => {
    const logMessage = `Setting up proxy route: ${route.hostname} -> ${route.targetUrl}`;
    // console.log(`[${new Date().toISOString()}] ${logMessage}`); // Replaced by addLog
    addLog(logMessage);
    app.use((req, res, next) => {
      if (req.hostname === route.hostname) {
        return proxy(route.targetUrl, {
          proxyTimeout: 30000,
          timeout: 30000,
          proxyReqPathResolver: function(req) {
            return req.originalUrl;
          },
          userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            const logMessage = `${userReq.id} Received response from target ${route.targetUrl} for ${route.hostname}: ${proxyRes.statusCode}`;
            // console.log(`[${new Date().toISOString()}] ${logMessage}`, { // Replaced by addLog
            addLog(logMessage);
            console.log(`[DEBUG] Response details:`, { // Keep detailed debug log separate
              route: route.hostname,
              target: route.targetUrl,
              statusCode: proxyRes.statusCode,
              headers: proxyRes.headers
            });
            return proxyResData;
          },
          proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            const logMessage = `${srcReq.id} Proxying request for ${route.hostname} to ${route.targetUrl}: ${srcReq.method} ${srcReq.url}`;
            // console.log(`[${new Date().toISOString()}] ${logMessage}`, { // Replaced by addLog
            addLog(logMessage);
            console.log(`[DEBUG] Proxy options details:`, {
              route: route.hostname,
              target: route.targetUrl,
              method: srcReq.method,
              url: srcReq.url
            });
            return proxyReqOpts;
          },
          proxyErrorHandler: (err, res, next) => {
            const logMessage = `${res.req.id} Proxy error for ${route.hostname} to ${route.targetUrl}: ${err.message}`;
            // console.error(`[${new Date().toISOString()}] ${logMessage}`, { // Replaced by addLog
            addLog(`ERROR: ${logMessage}`);
            console.error(`[DEBUG] Proxy error details:`, {
              route: route.hostname,
              target: route.targetUrl,
              error: err.message
            });
            res.status(504).json({
              error: 'Gateway Timeout',
              message: `Failed to proxy request to ${route.targetUrl}`,
              details: err.message
            });
          }
        })(req, res, next);
      }
      next();
    });
  });
}

// API endpoints for route management
app.post('/api/routes', async (req, res) => {
  try {
    const { hostname, targetUrl } = req.body;
    const route = await prisma.route.create({
      data: { hostname, targetUrl }
    });
    const logMessage = `${req.id} Created new route id ${route.id}: ${route.hostname} -> ${route.targetUrl}`;
    // console.log(`[${new Date().toISOString()}] ${logMessage}`, route); // Replaced by addLog
    addLog(logMessage);
    await setupProxyRoutes(); // Refresh routes
    res.json(route);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${req.id} Error creating route:`, error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/routes', async (req, res) => {
  const routes = await prisma.route.findMany();
  res.json(routes);
});

app.delete('/api/routes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.route.delete({
      where: { id }
    });
    await setupProxyRoutes(); // Refresh routes
    const logMessage = `${req.id} Deleted route with id: ${id}`;
    // console.log(`[${new Date().toISOString()}] ${logMessage}`); // Replaced by addLog
    addLog(logMessage);
    res.sendStatus(200);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ${req.id} Error deleting route:`, error); // Corrected error message context
    res.status(400).json({ error: error.message });
  }
}); // Added missing closing brace

// Edit route endpoint
app.put('/api/routes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { hostname, targetUrl } = req.body;
    const updated = await prisma.route.update({
      where: { id },
      data: { hostname, targetUrl }
    });
    const logMessage = `${req.id} Updated route id ${id}: ${updated.hostname} -> ${updated.targetUrl}`;
    // console.log(`[${new Date().toISOString()}] ${logMessage}`); // Replaced by addLog
    addLog(logMessage);
    await setupProxyRoutes();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Initialize proxy routes
setupProxyRoutes().then(() => {
  app.listen(3000, () => {
    const logMessage = `Reverse proxy server running on port 3000!`;
    // console.log(`[${new Date().toISOString()}] ${logMessage}`); // Replaced by addLog
    addLog(logMessage);
  });
});
// Store active routes in memory
let activeRoutes = [];

// Dynamic proxy middleware
app.use((req, res, next) => {
  const matchedRoute = activeRoutes.find(route => req.hostname === route.hostname);
  if (matchedRoute) {
    return proxy(matchedRoute.targetUrl, {
      proxyTimeout: 30000,
      timeout: 30000,
      proxyReqPathResolver: (req) => req.url,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        const logMessage = `${srcReq.id} Proxying request for ${matchedRoute.hostname} to ${matchedRoute.targetUrl}: ${srcReq.method} ${srcReq.url}`;
        // console.log(`[${new Date().toISOString()}] ${logMessage}`, { // Replaced by addLog
        addLog(logMessage);
        console.log(`[DEBUG] Dynamic proxy options details:`, {
          route: matchedRoute.hostname,
          target: matchedRoute.targetUrl,
          method: srcReq.method,
          url: srcReq.url
        });
        return proxyReqOpts;
      },
      proxyErrorHandler: (err, res, next) => {
        const logMessage = `${res.req.id} Proxy error for ${matchedRoute.hostname} to ${matchedRoute.targetUrl}: ${err.message}`;
        // console.error(`[${new Date().toISOString()}] ${logMessage}`, { // Replaced by addLog
        addLog(`ERROR: ${logMessage}`);
        console.error(`[DEBUG] Dynamic proxy error details:`, {
          route: matchedRoute.hostname,
          target: matchedRoute.targetUrl,
          error: err.message
        });
        res.status(504).json({
          error: 'Gateway Timeout',
          message: `Failed to proxy request to ${matchedRoute.targetUrl}`,
          details: err.message
        });
      }
    })(req, res, next);
  }
  next();
});

// Serve static frontend
app.use('/', express.static(path.join(process.cwd(), '../frontend')));
app.use('/proxy', proxy('www.google.com'));
app.use("/debug", (req, res) => {
  res.json({
    hostname: req.hostname,
    headers: req.headers,
    url: req.url,
    method: req.method,
    body: req.body
  });
});

// Endpoint to get logs
app.get('/api/logs', (req, res) => {
  res.json(serverLogs);
});

// In-memory analytics
let analytics = {
  totalRequests: 0,
  errorCount: 0
};
app.use((req, res, next) => {
  analytics.totalRequests++;
  const origSend = res.send;
  res.send = function (...args) {
    if (res.statusCode >= 400) analytics.errorCount++;
    return origSend.apply(this, args);
  };
  next();
});
app.get('/api/analytics', (req, res) => {
  const errorRate = analytics.totalRequests ? ((analytics.errorCount / analytics.totalRequests) * 100).toFixed(2) : 0;
  res.json({
    totalRequests: analytics.totalRequests,
    errorRate
  });
});
app.get('/api/server-stats', async (req, res) => {
  try {
    const [cpuData, memData] = await Promise.all([
      si.currentLoad(),
      si.mem()
    ]);

    const cpuUsage = cpuData.currentLoad.toFixed(2);
    // Use memData.active for a potentially more accurate representation of used memory
    const memoryUsage = ((memData.active / memData.total) * 100).toFixed(2);

    res.json({
      cpu: cpuUsage,
      memory: memoryUsage
    });
  } catch (error) {
    addLog(`ERROR fetching server stats: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch server stats' });
  }
});