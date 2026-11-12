import {
  AttributeExpression,
  BooleanExpression,
  ColumnExpression,
  Expression,
  FunctionExpression,
  LiteralExpression,
  parseQuery,
  Query,
  SubscriptExpression,
} from "peaql";

export function parseBasesExpression(source: string): Expression {
  // PEaQL recovers an equality AST for == but also reports a parser error;
  // its executor rejects that recovery. Lower only operator tokens, leaving
  // literals, comments and quoted identifiers byte-for-byte intact.
  let lowered = source.replace(
    /(['"])(?:\\.|\1\1|(?!\1)[^\\])*?\1|\{(?:}}|[^}])*\}|--[^\n]*|\/\*[\s\S]*?\*\/|\.\s*(filter|join|unique|time)\s*(?=\()|={2,}/g,
    (token) => {
      if (token === "==") return "=";
      if (token.startsWith(".")) return `.bases_${token.slice(1).trim()}`;
      if (/^={3,}$/.test(token)) throw new Error("Invalid Bases expression.");
      return token;
    }
  );
  // Bases list literals differ from SQL bracket identifiers. Lower their
  // delimiters before parsing, preserving property subscripts and all quoted
  // content. This also gives empty/nested lists an unambiguous representation.
  let previous = "";
  const brackets: boolean[] = [];
  lowered = lowered.replace(
    /(['"])(?:\\.|\1\1|(?!\1)[^\\])*?\1|\{(?:}}|[^}])*\}|--[^\n]*|\/\*[\s\S]*?\*\/|[a-zA-Z_][\w]*|\s+|./g,
    (token) => {
      if (
        /^\s+$/.test(token) ||
        token.startsWith("--") ||
        token.startsWith("/*")
      )
        return token;
      if (token === "[") {
        const subscript =
          /^(?:[a-zA-Z_]\w*|[)\]}]|['"])/.test(previous) &&
          !/^(?:AND|OR|NOT|IN)$/i.test(previous);
        brackets.push(subscript);
        previous = "[";
        return subscript ? "[" : "bases_list(";
      }
      if (token === "]") {
        const subscript = brackets.pop();
        previous = "]";
        return subscript === false ? ")" : "]";
      }
      previous = token;
      return token;
    }
  );
  const [query, errors] = parseQuery(
    `SET identifier_quoting = bracket; SELECT 1 WHERE ${lowered}`
  );
  if (
    errors.length ||
    !(query instanceof Query) ||
    !query.where ||
    query.from ||
    query.groupBy ||
    query.orderBy ||
    query.limit != null ||
    query.unions.length
  ) {
    throw new Error("Invalid Bases expression.");
  }
  return query.where;
}

/** Compile Bases expressions at the execution boundary, without rewriting
 * quoted strings or changing the filter builder's saved/displayed source. */
export function compileBasesExpression(
  source: string,
  formulas: Record<string, string> = {},
  predicate = false
): string {
  const active = new Set<string>();
  const cache = new Map<string, string>();
  let callbackScope = false;
  function formula(name: string): string {
    if (active.has(name))
      throw new Error(
        `Circular Bases formula: ${[...active, name].join(" -> ")}`
      );
    if (!Object.hasOwn(formulas, name) || !formulas[name])
      throw new Error(`Unknown Bases formula: ${name}`);
    if (!cache.has(name)) {
      active.add(name);
      const outerScope = callbackScope;
      callbackScope = false;
      try {
        cache.set(name, render(parseBasesExpression(formulas[name])));
      } finally {
        callbackScope = outerScope;
        active.delete(name);
      }
    }
    return `(${cache.get(name)})`;
  }
  function render(expr: Expression, method = false): string {
    if (expr instanceof ColumnExpression && callbackScope) {
      if (expr.name === "value") return "bases_value";
      if (expr.name === "index") return "bases_index";
      if (expr.name === "acc") return "bases_acc";
    }
    if (expr instanceof LiteralExpression || expr instanceof ColumnExpression)
      return expr.toString();
    if (expr instanceof AttributeExpression) {
      if (
        expr.operand instanceof ColumnExpression &&
        expr.operand.name === "formula" &&
        typeof expr.name === "string"
      )
        return formula(expr.name);
      const operand = render(expr.operand);
      return `${
        expr.operand instanceof LiteralExpression ? `(${operand})` : operand
      }.${typeof expr.name === "string" ? expr.name : render(expr.name, true)}`;
    }
    if (expr instanceof SubscriptExpression) {
      if (expr.operand instanceof ColumnExpression) {
        if (expr.operand.name === "formula") return formula(expr.key);
        if (expr.operand.name === "note")
          return `{${`note[${JSON.stringify(expr.key)}]`.replaceAll(
            "}",
            "}}"
          )}}`;
      }
      return `${render(expr.operand)}[${JSON.stringify(expr.key)}]`;
    }
    if (expr instanceof BooleanExpression) {
      const args = expr.args.map((arg) => render(arg));
      if (callbackScope && args.length === 2) {
        const operations: Record<string, string> = {
          "+": "add",
          "-": "subtract",
          "*": "multiply",
          "/": "divide",
          "%": "modulo",
        };
        const name = operations[expr.op];
        if (name) return `bases_${name}(${args.join(", ")})`;
      }
      if (["AND", "OR", "NOT"].includes(expr.op)) {
        const truthy = args.map((arg) => `isTruthy(${arg})`);
        return expr.op === "NOT"
          ? `(NOT ${truthy[0]})`
          : `(${truthy.join(` ${expr.op} `)})`;
      }
      if (expr.op === "ISNULL") return `(${args[0]} IS NULL)`;
      if (expr.op === "ISNOTNULL") return `(${args[0]} IS NOT NULL)`;
      if (expr.op === "BETWEEN")
        return `(${args[0]} BETWEEN ${args[1]} AND ${args[2]})`;
      if (args.length === 1) return `(${expr.op}(${args[0]}))`;
      return `(${args.join(` ${expr.op} `)})`;
    }
    if (expr instanceof FunctionExpression) {
      const nativeName = expr.name.replace(/^bases_/, "");
      const scoped = method && ["map", "filter", "reduce"].includes(nativeName);
      let name =
        scoped ||
        ["contains", "containsAll", "containsAny"].includes(nativeName)
          ? `bases_${nativeName}`
          : expr.name;
      if (!method && ["number", "today"].includes(expr.name))
        name = `bases_${expr.name}`;
      if (method && expr.name === "date") name = "bases_dateOnly";
      if (method && expr.name === "format") name = "bases_format";
      let result = `${name}(${expr.distinct ? "DISTINCT " : ""}${expr.args
        .map((arg, index) => {
          const outer = callbackScope;
          if (scoped && index === 0) callbackScope = true;
          try {
            return render(arg);
          } finally {
            callbackScope = outer;
          }
        })
        .join(", ")})`;
      if (expr.filter) result += ` FILTER (WHERE ${render(expr.filter)})`;
      if (expr.window) result += ` ${render(expr.window)}`;
      return result;
    }
    // Preserve the native serializer for other supported PEaQL constructs,
    // including function modifiers, casts, collections and case expressions.
    // Child toString methods still pass through this compiler, so nested formula
    // references and operator precedence remain correct in those constructs.
    function wrap(value: unknown): unknown {
      if (value instanceof Expression) {
        const child = Object.create(Object.getPrototypeOf(value));
        Object.assign(child, value, { toString: () => render(value) });
        return child;
      }
      if (Array.isArray(value)) return value.map(wrap);
      if (value && Object.getPrototypeOf(value) === Object.prototype)
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, wrap(item)])
        );
      return value;
    }
    const copy = Object.create(Object.getPrototypeOf(expr));
    for (const [key, value] of Object.entries(expr)) copy[key] = wrap(value);
    return copy.toString();
  }
  const expression = render(parseBasesExpression(source));
  return predicate ? `isTruthy(${expression})` : expression;
}
