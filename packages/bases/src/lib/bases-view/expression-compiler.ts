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

/** Compile Bases expressions at the execution boundary, without rewriting
 * quoted strings or changing the filter builder's saved/displayed source. */
export function compileBasesExpression(
  source: string,
  formulas: Record<string, string> = {},
  predicate = false
): string {
  const active = new Set<string>();
  const cache = new Map<string, string>();
  function parse(source: string): Expression {
    // PEaQL recovers an equality AST for == but also reports a parser error;
    // its executor rejects that recovery. Lower only operator tokens, leaving
    // literals, comments and quoted identifiers byte-for-byte intact.
    const lowered = source.replace(
      /(['"])(?:\\.|\1\1|(?!\1)[^\\])*?\1|\{(?:}}|[^}])*\}|--[^\n]*|\/\*[\s\S]*?\*\/|={2,}/g,
      (token) => {
        if (token === "==") return "=";
        if (/^={3,}$/.test(token)) throw new Error("Invalid Bases expression.");
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
  function formula(name: string): string {
    if (active.has(name))
      throw new Error(
        `Circular Bases formula: ${[...active, name].join(" -> ")}`
      );
    if (!Object.hasOwn(formulas, name) || !formulas[name])
      throw new Error(`Unknown Bases formula: ${name}`);
    if (!cache.has(name)) {
      active.add(name);
      try {
        cache.set(name, render(parse(formulas[name])));
      } finally {
        active.delete(name);
      }
    }
    return `(${cache.get(name)})`;
  }
  function render(expr: Expression): string {
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
      }.${typeof expr.name === "string" ? expr.name : render(expr.name)}`;
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
      const args = expr.args.map(render);
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
      let result = `${expr.name}(${expr.distinct ? "DISTINCT " : ""}${expr.args
        .map(render)
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
  const expression = render(parse(source));
  return predicate ? `isTruthy(${expression})` : expression;
}
