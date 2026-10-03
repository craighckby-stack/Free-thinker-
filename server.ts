import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRootDir = __dirname;

const require = createRequire(import.meta.url);

// Fix for "EvalError: Code generation from strings disallowed for this context"
// which breaks es-module-lexer token unquoting in Vite and protobufjs in Firebase/Gemini
const _nativeEval = globalThis.eval;
globalThis.eval = function (code: string) {
  try {
    return _nativeEval(code);
  } catch (e) {
    if (typeof code === 'string') {
      try {
        return JSON.parse(code);
      } catch (_) {}
      const trimmed = code.trim();
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
      }
    }
    throw e;
  }
};

try {
  const protobuf = require('protobufjs');
  if (protobuf && protobuf.util) {
    protobuf.util.codegen = null;
  }
} catch (e) {}

// Ensure tapable HookCodeFactory (used by Tailwind and enhanced-resolve) falls back gracefully on EvalError
try {
  const tapablePath = path.resolve(projectRootDir, 'node_modules/tapable/lib/HookCodeFactory.js');
  if (fs.existsSync(tapablePath)) {
    let tapableContent = fs.readFileSync(tapablePath, 'utf-8');
    if (tapableContent.includes('class HookCodeFactory') && !tapableContent.includes('fallback-eval-safe')) {
      const startIdx = tapableContent.indexOf('create(options) {');
      const endIdx = tapableContent.indexOf('setup(instance, options) {', startIdx);
      if (startIdx !== -1 && endIdx !== -1) {
        const safeCreate = `create(options) {
		/* fallback-eval-safe */
		this.init(options);
		let fn;
		try {
			switch (options.type) {
				case "sync":
					fn = new Function(
						this.args(),
						\`"use strict";\\n\${this.header()}\${this.contentWithInterceptors({
							onError: (err) => \`throw \${err};\\n\`,
							onResult: (result) => \`return \${result};\\n\`,
							resultReturns: true,
							onDone: () => "",
							rethrowIfPossible: true
						})}\`
					);
					break;
				case "async":
					fn = new Function(
						this.args({ after: "_callback" }),
						\`"use strict";\\n\${this.header()}\${this.contentWithInterceptors({
							onError: (err) => \`_callback(\${err});\\n\`,
							onResult: (result) => \`_callback(null, \${result});\\n\`,
							onDone: () => "_callback();\\n"
						})}\`
					);
					break;
				case "promise": {
					let errorHelperUsed = false;
					const content = this.contentWithInterceptors({
						onError: (err) => { errorHelperUsed = true; return \`_error(\${err});\\n\`; },
						onResult: (result) => \`_resolve(\${result});\\n\`,
						onDone: () => "_resolve();\\n"
					});
					let code = '"use strict";\\n' + this.header() + "return new Promise((function(_resolve, _reject) {\\n";
					if (errorHelperUsed) {
						code += "var _sync = true;\\nfunction _error(_err) { if(_sync) _resolve(Promise.resolve().then((function() { throw _err; }))); else _reject(_err); };\\n";
					}
					code += content;
					if (errorHelperUsed) code += "_sync = false;\\n";
					code += "}));\\n";
					fn = new Function(this.args(), code);
					break;
				}
			}
		} catch (e) {
			const taps = (options.taps || []).slice();
			const isBail = options.type && options.type.toLowerCase().includes("bail");
			if (options.type === "async") {
				fn = function(...args) {
					const cb = typeof args[args.length - 1] === "function" ? args.pop() : () => {};
					let i = 0;
					function step(err, val) {
						if (err) return cb(err);
						if (val !== undefined && isBail) return cb(null, val);
						if (i >= taps.length) return cb(null, val);
						const t = taps[i++];
						try {
							if (t.type === "async") t.fn(...args, step);
							else if (t.type === "promise") Promise.resolve(t.fn(...args)).then(v => step(null, v), step);
							else { const v = t.fn(...args); step(null, v); }
						} catch (err) { step(err); }
					}
					step();
				};
			} else if (options.type === "promise") {
				fn = async function(...args) {
					let res;
					for (const t of taps) {
						if (t.type === "promise" || t.type === "async") res = await t.fn(...args);
						else res = t.fn(...args);
						if (res !== undefined && isBail) return res;
					}
					return res;
				};
			} else {
				fn = function(...args) {
					let res;
					for (const t of taps) {
						res = t.fn(...args);
						if (res !== undefined && isBail) return res;
					}
					return res;
				};
			}
		}
		this.deinit();
		return fn;
	}
	`;
        tapableContent = tapableContent.slice(0, startIdx) + safeCreate + tapableContent.slice(endIdx);
        fs.writeFileSync(tapablePath, tapableContent, 'utf-8');
      }
    }
  }
} catch (e) {}

// Ensure Vite's bundled es-module-lexer in node.js doesn't fail on (0, eval)(A)
try {
  const nodeChunkPath = path.resolve(projectRootDir, 'node_modules/vite/dist/node/chunks/node.js');
  if (fs.existsSync(nodeChunkPath)) {
    let chunkContent = fs.readFileSync(nodeChunkPath, 'utf-8');
    const badViteEval = 'function i(A) {\n\t\ttry {\n\t\t\treturn (0, eval)(A);\n\t\t} catch (A) {}\n\t}';
    if (chunkContent.includes(badViteEval)) {
      const safeViteEval = `function i(A) {\n\t\tif (typeof A === "string") {\n\t\t\ttry { return JSON.parse(A); } catch (_) {}\n\t\t\tconst f = A.charCodeAt(0), l = A.charCodeAt(A.length - 1);\n\t\t\tif ((f === 34 && l === 34) || (f === 39 && l === 39)) return A.slice(1, -1);\n\t\t}\n\t\ttry { return (0, eval)(A); } catch (A) {}\n\t}`;
      chunkContent = chunkContent.replace(badViteEval, safeViteEval);
      fs.writeFileSync(nodeChunkPath, chunkContent, 'utf-8');
    }
  }
} catch (e) {}

import { apiRoutes } from './src/api-routes';
import { NextRequest } from './src/lib/next-mock';

interface RouteHandlerModule {
  [method: string]: (req: NextRequest) => Promise<Response | unknown> | Response | unknown;
}

interface HttpError extends Error {
  status?: number;
}

async function createNextMockRequest(req: express.Request): Promise<NextRequest> {
  const host = req.headers.host ?? 'localhost';
  const url = new URL(req.url, `http://${host}`);
  const reqHeaders = new Headers();
  
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v !== undefined) {
          reqHeaders.append(key, v);
        }
      }
    } else if (typeof value === 'string') {
      reqHeaders.append(key, value);
    }
  }

  let body: unknown = undefined;
  const method = req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    body = req.body;
  }
  
  const serializedBody = body !== undefined && body !== null ? JSON.stringify(body) : undefined;
  
  const nextReq = new NextRequest(url.toString(), {
    method,
    headers: reqHeaders,
    body: serializedBody,
  });
  
  if (body !== undefined) {
    Object.defineProperty(nextReq, 'json', {
      value: async () => body,
      writable: true,
      configurable: true,
    });
  }
  
  return nextReq;
}

async function startServer(): Promise<void> {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(express.text({ limit: '50mb', type: ['text/*', 'application/xml'] }));
  app.use(express.raw({ limit: '50mb', type: ['application/octet-stream'] }));

  for (const [routeUrl, routeModule] of Object.entries(apiRoutes)) {
    app.all(routeUrl, async (req: express.Request, res: express.Response) => {
      try {
        const method = req.method.toUpperCase();
        const typedModule = routeModule as RouteHandlerModule;
        const handler = typedModule[method];

        if (typeof handler === 'function') {
          const nextReq = await createNextMockRequest(req);
          const nextRes = await handler(nextReq);
          
          if (nextRes instanceof Response) {
            nextRes.headers.forEach((val: string, key: string) => {
              res.setHeader(key, val);
            });
            const status = nextRes.status;
            const text = await nextRes.text();
            res.status(status).send(text);
          } else {
             res.status(500).send('Endpoint did not return a Response object');
          }
        } else {
          res.status(405).send('Method Not Allowed');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error executing ${routeUrl}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: errorMessage });
        }
      }
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // Ensure HMR is disabled as per environment constraints
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      // Only handle navigation requests that expect HTML
      if (req.method !== 'GET' || (url.includes('.') && !url.endsWith('.html'))) {
        return next();
      }

      try {
        let template = fs.readFileSync(path.resolve(projectRootDir, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/.*/, (_req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: HttpError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    if (!res.headersSent) {
      const status = err.status ?? 500;
      const message = err.message || 'Internal Server Error';
      res.status(status).json({
        error: message,
        success: false,
      });
    }
  });

  server.listen(PORT, '<IP_ADDRESS_REDACTED>', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
