import { DateTime } from "luxon";
import moment from "moment";
import {
  AttributeGetter,
  createFunction,
  findFunction,
  registerStructure,
  TimeStamp,
  VARARG,
} from "peaql";
import { date, number, time } from "./functions-core";

// Enrich the Bases date structure without mutating the engine's shared
// TimeStamp columns or replacing its SQL date/number/format functions.
class BasesTimeStamp extends TimeStamp {
  public static columns = new Map(TimeStamp.columns);
}
for (const field of ["hour", "minute", "second", "millisecond"] as const) {
  BasesTimeStamp.columns.set(
    field,
    new AttributeGetter(field, Number, (value: DateTime) => value[field])
  );
}
registerStructure(DateTime, BasesTimeStamp);

createFunction(
  "bases_today",
  [],
  DateTime,
  () => DateTime.now().startOf("day"),
  false
);
createFunction("bases_number", [Object], Number, number);
createFunction("bases_dateOnly", [Object], DateTime, (value) =>
  date(value).startOf("day")
);
createFunction("bases_time", [Object], String, time);

// Keep SQL string-receiver formatting separate from date.format's token language.
createFunction(
  "bases_format",
  [String, VARARG, Object],
  String,
  (value, ...args) => {
    const operation = findFunction("format", [value, ...args]);
    if (!operation) throw new Error("Invalid native string format arguments.");
    return operation.operator(value, ...args);
  }
);

createFunction("bases_format", [Object, String], String, (value, pattern) => {
  const parsed = date(value);
  if (!parsed.isValid) return null;
  return moment(parsed.toMillis()).utcOffset(parsed.offset).format(pattern);
});
