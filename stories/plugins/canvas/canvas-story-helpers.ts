import { userEvent, within } from "storybook/test";

/** Tests open controls through the same collapsed buttons that users receive. */
export async function expandCanvasTools(root: HTMLElement): Promise<void> {
  for (const label of ["Expand authoring tools", "Expand navigation tools"]) {
    const trigger = within(root).queryByRole("button", { name: label, exact: true });
    if (trigger) await userEvent.click(trigger);
  }
}
