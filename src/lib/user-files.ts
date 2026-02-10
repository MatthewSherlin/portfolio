/**
 * localStorage-backed writable file layer.
 * User files can live anywhere under ~/ and overlay the read-only base filesystem.
 * Editing a system file creates a "shadow copy" in localStorage.
 */

const STORAGE_KEY = "user-files";

export interface UserFile {
  path: string; // full path e.g. "~/about.txt"
  content: string;
}

function load(): Map<string, string> {
  if (typeof window === "undefined") return new Map();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return new Map();
    const entries: [string, string][] = JSON.parse(saved);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function save(files: Map<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(files.entries())));
  } catch {
    // localStorage quota exceeded — silently fail
  }
}

/** Normalize a path to a clean ~/... form. Accepts any path under ~/. */
function normalizePath(path: string): string {
  let p = path;
  // Ensure it starts with ~/
  if (p === "~") return "";
  if (!p.startsWith("~/")) {
    if (p.startsWith("~")) p = `~/${p.slice(1)}`;
    else p = `~/${p}`;
  }
  // Resolve . and .. segments
  const parts = p.split("/");
  const resolved: string[] = ["~"];
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i];
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (resolved.length > 1) resolved.pop();
    } else {
      resolved.push(seg);
    }
  }
  if (resolved.length <= 1) return ""; // just "~", no filename
  return resolved.join("/");
}

export function createFile(path: string): string | null {
  const normalized = normalizePath(path);
  if (!normalized) return "touch: invalid filename";

  const files = load();
  if (!files.has(normalized)) {
    files.set(normalized, "");
    save(files);
  }
  return null; // success
}

export function readFile(path: string): string | null {
  const normalized = normalizePath(path);
  const files = load();
  const content = files.get(normalized);
  return content ?? null;
}

export function writeFile(path: string, content: string): string | null {
  const normalized = normalizePath(path);
  if (!normalized) return "write: invalid filename";

  const files = load();
  files.set(normalized, content);
  save(files);
  return null; // success
}

export function deleteFile(path: string): string | null {
  const normalized = normalizePath(path);
  const files = load();
  if (!files.has(normalized)) {
    return `rm: ${path}: No such file`;
  }
  files.delete(normalized);
  save(files);
  return null; // success
}

export function listUserFiles(): string[] {
  const files = load();
  return Array.from(files.keys()).sort();
}

export function renameFile(oldPath: string, newPath: string): string | null {
  const normalizedOld = normalizePath(oldPath);
  const normalizedNew = normalizePath(newPath);
  if (!normalizedOld || !normalizedNew) return "mv: invalid path";

  const files = load();
  if (!files.has(normalizedOld)) return `mv: ${oldPath}: No such file`;

  const content = files.get(normalizedOld)!;
  files.delete(normalizedOld);
  files.set(normalizedNew, content);
  save(files);
  return null;
}

export function isUserFile(path: string): boolean {
  const normalized = normalizePath(path);
  return load().has(normalized);
}

export function resetUserFiles(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
