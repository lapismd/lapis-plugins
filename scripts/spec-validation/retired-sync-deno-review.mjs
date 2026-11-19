import { auditRetiredSyncDenoReview } from "../check-retired-sync-deno-review.mjs";

export const name = "retiredSyncDenoReview";
export function validate(context) {
  return auditRetiredSyncDenoReview(context.model.repoRoot).map((message) => ({
    code: "RETIRED-SYNC-DENO-REVIEW",
    rule: "LP-SPEC-063",
    file: message.split(":")[0],
    line: 1,
    message: `${message}. Keep the parked browser and portability contracts; do not restore the retired live-Deno driver.`,
  }));
}
export default { name, validate };
