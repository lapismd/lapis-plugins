import { auditRetiredAi } from "../check-retired-ai.mjs";

export const name = "retiredSharedAi";
export function validate(context) {
  return auditRetiredAi(context.model.repoRoot).map((message) => ({
    code: "RETIRED-SHARED-AI",
    rule: "LP-SPEC-061",
    file: message.split(":")[0],
    line: 1,
    message: `${message}. Remove the retired source/import; retain the publication tombstone.`,
  }));
}
export default { name, validate };
