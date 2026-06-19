const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const dataDirectory = path.join(root, "data");
const dataFile = path.join(dataDirectory, "entries.json");
const maxBodySize = 5 * 1024 * 1024;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp"
};

function ensureStore() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]\n", "utf8");
}

function readEntries() {
  ensureStore();
  try {
    const value = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error("Could not read entries store:", error.message);
    return [];
  }
}

function writeEntries(entries) {
  ensureStore();
  const temporaryFile = `${dataFile}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryFile, dataFile);
}

function send(response, status, body, contentType = "application/json; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS"
  });
  response.end(contentType.startsWith("application/json") ? JSON.stringify(body) : body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > maxBodySize) {
        reject(Object.assign(new Error("Request body is too large"), { status: 413 }));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("Invalid JSON body"), { status: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function normalizeEntry(entry, existing = {}) {
  const now = new Date().toISOString();
  return {
    ...existing,
    ...entry,
    id: String(existing.id || entry.id || randomUUID()),
    request: Array.isArray(entry.request) ? entry.request : existing.request || [],
    designType: Array.isArray(entry.designType) ? entry.designType : existing.designType || [],
    attachments: Array.isArray(entry.attachments) ? entry.attachments : existing.attachments || [],
    created: existing.created || entry.created || now,
    updated: now
  };
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function entriesToCsv(entries) {
  const preferred = [
    "id", "title", "projectName", "projectNumber", "contactPerson", "approvalOwner",
    "donorPartner", "request", "requestDetails", "designType", "numberOfDeliverables",
    "requestedDeliveryDate", "eventPublicationDate", "euVisibilityRequired",
    "partnerLogosRequired", "languageRequirements", "confirmAttachedContent", "attachments",
    "urgencyLevel", "visibilitySensitivity", "politicalSensitivity", "contentStatus",
    "sourceFilesStatus", "estimatedComplexity", "designStatus", "strategicImportance",
    "deadlineRisk", "created", "updated", "createdBy", "delivered"
  ];
  const extra = [...new Set(entries.flatMap((entry) => Object.keys(entry)))]
    .filter((key) => !preferred.includes(key));
  const columns = [...preferred, ...extra];
  return `\uFEFF${columns.map(csvCell).join(",")}\r\n${entries
    .map((entry) => columns.map((column) => csvCell(entry[column])).join(","))
    .join("\r\n")}\r\n`;
}

async function handleApi(request, response, pathname) {
  if (request.method === "OPTIONS") return send(response, 204, "", "text/plain; charset=utf-8");

  if (pathname === "/api/health" && request.method === "GET") {
    return send(response, 200, { ok: true, entries: readEntries().length });
  }

  if (pathname === "/api/entries" && request.method === "GET") {
    return send(response, 200, { entries: readEntries() });
  }

  if (pathname === "/api/entries" && request.method === "POST") {
    const entry = normalizeEntry(await readJsonBody(request));
    const entries = readEntries();
    entries.unshift(entry);
    writeEntries(entries);
    return send(response, 201, { entry });
  }

  if (pathname === "/api/entries/import" && request.method === "POST") {
    const payload = await readJsonBody(request);
    if (!Array.isArray(payload.entries)) return send(response, 400, { error: "entries must be an array" });
    const incoming = payload.entries.map((entry) => normalizeEntry(entry));
    const entries = payload.mode === "append" ? [...incoming, ...readEntries()] : incoming;
    writeEntries(entries);
    return send(response, 200, { entries, imported: incoming.length });
  }

  if (pathname === "/api/entries/export.csv" && request.method === "GET") {
    response.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gd-hub-entries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    });
    return response.end(entriesToCsv(readEntries()));
  }

  const match = pathname.match(/^\/api\/entries\/([^/]+)$/);
  if (match && request.method === "PATCH") {
    const id = decodeURIComponent(match[1]);
    const entries = readEntries();
    const index = entries.findIndex((entry) => String(entry.id) === id);
    if (index < 0) return send(response, 404, { error: "Entry not found" });
    entries[index] = normalizeEntry(await readJsonBody(request), entries[index]);
    writeEntries(entries);
    return send(response, 200, { entry: entries[index] });
  }

  if (match && request.method === "DELETE") {
    const id = decodeURIComponent(match[1]);
    const entries = readEntries();
    const filtered = entries.filter((entry) => String(entry.id) !== id);
    if (filtered.length === entries.length) return send(response, 404, { error: "Entry not found" });
    writeEntries(filtered);
    return send(response, 204, "", "text/plain; charset=utf-8");
  }

  return send(response, 404, { error: "API endpoint not found" });
}

function serveStatic(response, pathname) {
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(`${root}${path.sep}`) || filePath.startsWith(`${dataDirectory}${path.sep}`)) {
    return send(response, 403, "Forbidden", "text/plain; charset=utf-8");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) return send(response, 404, "Not found", "text/plain; charset=utf-8");
    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": path.extname(filePath) === ".html" ? "no-cache" : "public, max-age=300"
    });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname);
  try {
    if (pathname.startsWith("/api/")) return await handleApi(request, response, pathname);
    return serveStatic(response, pathname);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) send(response, error.status || 500, { error: error.message || "Server error" });
  }
});

ensureStore();
server.listen(port, "127.0.0.1", () => {
  console.log(`Graphic Design Priority Hub live at http://127.0.0.1:${port}/`);
});
