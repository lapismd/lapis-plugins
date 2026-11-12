type RecordValue = Record<string, unknown>;

function record(value: unknown, location: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Canvas ${location} must be an object.`);
  }
  return value as RecordValue;
}

function string(value: unknown, location: string): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Canvas ${location} must be a string.`);
  }
}

function optionalString(value: unknown, location: string): void {
  if (value !== undefined) string(value, location);
}

function choice(value: unknown, choices: string[], location: string): void {
  if (value !== undefined && !choices.includes(value as string)) {
    throw new Error(`Canvas ${location} must be one of ${choices.join(", ")}.`);
  }
}

function collection(value: unknown, location: string): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`Canvas ${location} must be an array.`);
  return value;
}

function identity(item: RecordValue, ids: Set<string>, location: string): void {
  string(item.id, `${location}.id`);
  if (!item.id || ids.has(item.id)) {
    throw new Error(`Canvas ${location} must have a nonempty unique id.`);
  }
  ids.add(item.id);
}

/** Validate before mounting an editable board; never recover by deleting data. */
export function validateJsonCanvas(value: unknown): void {
  const canvas = record(value, "document");
  const nodeIds = new Set<string>();
  for (const [index, value] of collection(canvas.nodes, "nodes").entries()) {
    const location = `nodes[${index}]`;
    const node = record(value, location);
    identity(node, nodeIds, location);
    if (!["text", "file", "link", "group"].includes(node.type as string)) {
      throw new Error(`Canvas ${location} has an unsupported node type.`);
    }
    for (const field of ["x", "y", "width", "height"]) {
      if (!Number.isSafeInteger(node[field]) ||
          ((field === "width" || field === "height") && Number(node[field]) <= 0)) {
        throw new Error(`Canvas ${location}.${field} must be a valid integer${field === "width" || field === "height" ? " greater than zero" : ""}.`);
      }
    }
    optionalString(node.color, `${location}.color`);
    if (node.type === "text") string(node.text, `${location}.text`);
    if (node.type === "link") string(node.url, `${location}.url`);
    if (node.type === "file") {
      string(node.file, `${location}.file`);
      optionalString(node.subpath, `${location}.subpath`);
      if (typeof node.subpath === "string" && !node.subpath.startsWith("#")) {
        throw new Error(`Canvas ${location}.subpath must start with #.`);
      }
    }
    if (node.type === "group") {
      optionalString(node.label, `${location}.label`);
      optionalString(node.background, `${location}.background`);
      choice(node.backgroundStyle, ["cover", "ratio", "repeat"], `${location}.backgroundStyle`);
    }
  }
  const edgeIds = new Set<string>();
  for (const [index, value] of collection(canvas.edges, "edges").entries()) {
    const location = `edges[${index}]`;
    const edge = record(value, location);
    identity(edge, edgeIds, location);
    for (const field of ["fromNode", "toNode"]) {
      string(edge[field], `${location}.${field}`);
      if (!nodeIds.has(edge[field])) {
        throw new Error(`Canvas ${location}.${field} references a missing node.`);
      }
    }
    for (const field of ["fromSide", "toSide"]) {
      choice(edge[field], ["top", "right", "bottom", "left"], `${location}.${field}`);
    }
    for (const field of ["fromEnd", "toEnd"]) {
      choice(edge[field], ["none", "arrow"], `${location}.${field}`);
    }
    optionalString(edge.color, `${location}.color`);
    optionalString(edge.label, `${location}.label`);
  }
}
