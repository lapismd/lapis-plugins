import type { Meta, StoryObj } from "@storybook/svelte-vite";
import RegistryShowcase from "../_shared/registry/RegistryShowcase.svelte";
import { registryShowcases } from "../_shared/registry/registry-showcases";
const meta = {
  title: "Plugins/Search/Registry",
  component: RegistryShowcase,
  tags: ["visual-pending"],
  parameters: { layout: "fullscreen", controls: { disable: true } },
  args: { model: registryShowcases.search },
} satisfies Meta<typeof RegistryShowcase>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
