import { getResumeData } from "./resume-data";
import { listUserFiles, readFile as readUserFile } from "./user-files";
import { hasUnlock } from "./unlocks";

interface FSNode {
  name: string;
  type: "file" | "directory";
  content?: string;
  children?: Map<string, FSNode>;
  permissions: string;
  size: number;
  modified: string;
}

function file(name: string, content: string, modified = "Feb 05 2026"): FSNode {
  return {
    name,
    type: "file",
    content,
    permissions: "-rw-r--r--",
    size: content.length,
    modified,
  };
}

function dir(
  name: string,
  children: FSNode[],
  modified = "Feb 05 2026"
): FSNode {
  const map = new Map<string, FSNode>();
  children.forEach((c) => map.set(c.name, c));
  return {
    name,
    type: "directory",
    children: map,
    permissions: "drwxr-xr-x",
    size: 4096,
    modified,
  };
}

function buildFilesystem(): FSNode {
  const d = getResumeData();

  const projectDirs = d.projects.map((p) => {
    const readme = [
      `# ${p.name}`,
      "",
      p.description,
      "",
      "## Tech Stack",
      ...p.tech.map((t) => `- ${t}`),
      ...(p.url ? ["", "## Links", p.url] : []),
    ].join("\n");
    return dir(p.name.toLowerCase().replace(/\s+/g, "-"), [
      file("README.md", readme),
      file("tech-stack.txt", p.tech.join("\n")),
    ]);
  });

  const expFiles = d.experience.map((e) => {
    const content = [
      `${e.role} @ ${e.company}`,
      `Period: ${e.period}`,
      "",
      "Highlights:",
      ...e.highlights.map((h) => `  - ${h}`),
    ].join("\n");
    return file(
      `${e.company.toLowerCase().replace(/\s+/g, "-")}.txt`,
      content
    );
  });

  const skillFiles = d.skills.map((s) =>
    file(`${s.category.toLowerCase()}.txt`, s.items.join("\n"))
  );

  const eduFiles = d.education.map((e) =>
    file("degree.txt", `${e.degree}\n${e.institution} (${e.year})`)
  );

  const aboutContent = [
    d.name,
    "=".repeat(d.name.length),
    "",
    d.title,
    "",
    d.summary,
    "",
    `Location: ${d.location}`,
    `Email:    ${d.email}`,
  ].join("\n");

  const contactContent = [
    `Email:    ${d.contact.email}`,
    d.contact.github ? `GitHub:   ${d.contact.github}` : "",
    d.contact.linkedin ? `LinkedIn: ${d.contact.linkedin}` : "",
    d.contact.website ? `Website:  ${d.contact.website}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return dir("~", [
    file("about.txt", aboutContent),
    file("contact.txt", contactContent),
    file(
      ".bashrc",
      '# ~/.bashrc\nexport PS1="visitor@portfolio:~$ "\nexport EDITOR=vim\nalias ll="ls -la"'
    ),
    file(
      ".vimrc",
      '" ~/.vimrc\nset number\nset relativenumber\nsyntax on\ncolorscheme retrobox'
    ),
    dir("projects", projectDirs),
    dir("experience", expFiles),
    dir("skills", skillFiles),
    dir("education", eduFiles),
    dir(".secret", [
      file(
        "README.md",
        "You found a hidden directory!\n\nThere are secrets hidden in this terminal.\nTry some classic codes and commands..."
      ),
    ]),
  ]);
}

export class VirtualFS {
  private root: FSNode;
  private _cwd: string = "~";

  constructor() {
    this.root = buildFilesystem();
  }

  get cwd(): string {
    return this._cwd;
  }

  /** Overlay localStorage user files onto the virtual FS (shadow copies + user-created). */
  private syncUserFiles(): void {
    if (!hasUnlock("editor")) return;

    const userFiles = listUserFiles();

    for (const fullPath of userFiles) {
      // fullPath is like "~/about.txt" or "~/projects/newfile.txt"
      const content = readUserFile(fullPath) ?? "";
      const segments = fullPath.slice(2).split("/"); // Remove "~/"
      const fileName = segments.pop();
      if (!fileName) continue;

      // Navigate to the parent directory, creating intermediate dirs as needed
      let current = this.root;
      for (const dirName of segments) {
        if (!current.children) {
          current.children = new Map();
        }
        let child = current.children.get(dirName);
        if (!child || child.type !== "directory") {
          child = {
            name: dirName,
            type: "directory",
            children: new Map(),
            permissions: "drwxrwxr-x",
            size: 4096,
            modified: "Feb 10 2026",
          };
          current.children.set(dirName, child);
        }
        current = child;
      }

      // Insert or overwrite the file node
      if (!current.children) current.children = new Map();
      current.children.set(fileName, {
        name: fileName,
        type: "file",
        content,
        permissions: "-rw-rw-r--",
        size: content.length,
        modified: "Feb 10 2026",
      });
    }
  }

  private resolve(path: string): string {
    if (path === "~" || path === "") return "~";

    let parts: string[];

    if (path.startsWith("~/")) {
      parts = ["~", ...path.slice(2).split("/").filter(Boolean)];
    } else if (path.startsWith("/")) {
      parts = ["~", ...path.slice(1).split("/").filter(Boolean)];
    } else {
      parts = [
        ...this._cwd.split("/"),
        ...path.split("/").filter(Boolean),
      ];
    }

    const resolved: string[] = [];
    for (const segment of parts) {
      if (segment === ".") continue;
      if (segment === "..") {
        if (resolved.length > 1) resolved.pop();
      } else {
        resolved.push(segment);
      }
    }

    return resolved.join("/") || "~";
  }

  private getNode(path: string): FSNode | null {
    this.syncUserFiles();
    const resolved = this.resolve(path);
    if (resolved === "~") return this.root;

    const parts = resolved.slice(2).split("/"); // skip "~/"
    let node = this.root;

    for (const part of parts) {
      if (!part) continue;
      if (node.type !== "directory" || !node.children) return null;
      const child = node.children.get(part);
      if (!child) return null;
      node = child;
    }

    return node;
  }

  pwd(): string {
    return this._cwd;
  }

  cd(path: string): string | null {
    if (!path) path = "~";
    const resolved = this.resolve(path);
    const node = this.getNode(resolved);

    if (!node) return `cd: ${path}: No such file or directory`;
    if (node.type !== "directory") return `cd: ${path}: Not a directory`;

    this._cwd = resolved;
    return null;
  }

  ls(path?: string, flags: string[] = []): string {
    const target = path ? this.resolve(path) : this._cwd;
    const node = this.getNode(target);

    if (!node)
      return `ls: cannot access '${path || "."}': No such file or directory`;
    if (node.type !== "directory") {
      if (flags.includes("-l") || flags.includes("-la") || flags.includes("-al"))
        return `${node.permissions}  1 visitor visitor ${String(node.size).padStart(6)} ${node.modified} ${node.name}`;
      return node.name;
    }

    const showHidden =
      flags.includes("-a") ||
      flags.includes("-la") ||
      flags.includes("-al");
    const longFormat =
      flags.includes("-l") ||
      flags.includes("-la") ||
      flags.includes("-al");

    let entries = Array.from(node.children?.values() ?? []);
    if (!showHidden) {
      entries = entries.filter((e) => !e.name.startsWith("."));
    }
    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    if (longFormat) {
      const lines = [`total ${entries.length}`];
      if (showHidden) {
        lines.push(
          "drwxr-xr-x  1 visitor visitor   4096 Feb 05 2026 ."
        );
        lines.push(
          "drwxr-xr-x  1 visitor visitor   4096 Feb 05 2026 .."
        );
      }
      for (const entry of entries) {
        const name =
          entry.type === "directory" ? `${entry.name}/` : entry.name;
        lines.push(
          `${entry.permissions}  1 visitor visitor ${String(entry.size).padStart(6)} ${entry.modified} ${name}`
        );
      }
      return lines.join("\n");
    }

    const names = entries.map((e) =>
      e.type === "directory" ? `${e.name}/` : e.name
    );
    if (showHidden) {
      names.unshift("./", "../");
    }
    return names.join("  ");
  }

  cat(path: string): string {
    const node = this.getNode(path);
    if (!node) return `cat: ${path}: No such file or directory`;
    if (node.type === "directory") return `cat: ${path}: Is a directory`;
    return node.content ?? "";
  }

  tree(path?: string): string {
    const target = path || this._cwd;
    const node = this.getNode(target);

    if (!node)
      return `tree: '${path || "."}': No such file or directory`;
    if (node.type !== "directory") return node.name;

    const lines: string[] = [this.resolve(target)];
    this.buildTree(node, "", lines);
    return lines.join("\n");
  }

  private buildTree(node: FSNode, prefix: string, lines: string[]) {
    if (node.type !== "directory" || !node.children) return;

    const entries = Array.from(node.children.values())
      .filter((e) => !e.name.startsWith("."))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    entries.forEach((entry, i) => {
      const isLast = i === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const childPrefix = isLast ? "    " : "│   ";
      const suffix = entry.type === "directory" ? "/" : "";

      lines.push(prefix + connector + entry.name + suffix);

      if (entry.type === "directory") {
        this.buildTree(entry, prefix + childPrefix, lines);
      }
    });
  }

  getCompletions(
    partial: string
  ): { name: string; isDir: boolean }[] {
    this.syncUserFiles();
    const lastSlash = partial.lastIndexOf("/");
    let dirPath: string;
    let prefix: string;

    if (lastSlash >= 0) {
      dirPath =
        partial.slice(0, lastSlash) ||
        (partial.startsWith("~") ? "~" : this._cwd);
      prefix = partial.slice(lastSlash + 1);
    } else {
      dirPath = this._cwd;
      prefix = partial;
    }

    const node = this.getNode(dirPath);
    if (!node || node.type !== "directory" || !node.children) return [];

    return Array.from(node.children.values())
      .filter(
        (child) =>
          child.name.startsWith(prefix) && !child.name.startsWith(".")
      )
      .map((child) => ({
        name: child.name,
        isDir: child.type === "directory",
      }));
  }

  getPromptPath(): string {
    return this._cwd;
  }
}
