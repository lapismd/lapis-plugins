<script lang="ts">
  import { Icon } from "@lapis-notes/api/icon";
  import { ColorPicker } from "@lapismd/design-core/forms";
  import PropertyPicker from "./components/property-picker.svelte";
  import KanbanSettings from "./kanban-view/settings.svelte";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Slider } from "@lapismd/design-core/shadcn/slider";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import type {
    BasesAllOptions,
    BasesOptions,
    BasesPropertyId,
  } from "@lapis-notes/api";
  import type { QueryController } from "./bases.svelte";
  import type { BasesViewBase } from "./models";

  let {
    controller,
    view = $bindable(),
  }: { controller: QueryController; view: BasesViewBase } = $props();
  let layoutOptions = $derived.by(() => {
    return [...controller.views.entries()].map(([key, view]) => {
      return { value: key, label: view.name, icon: view.icon };
    });
  });
  let options = $derived(
    controller.views.get(view.type)?.options?.(controller.view.config) || [],
  );
  type OptionEntry =
    | { kind: "group"; key: string; displayName: string }
    | { kind: "option"; key: string; option: BasesOptions };
  function flattenOptions(
    items: BasesAllOptions[],
    path = "options",
  ): OptionEntry[] {
    return items.flatMap((item, index) => {
      const key = `${path}-${index}`;
      if (item.type !== "group") {
        return [{ kind: "option", key, option: item } satisfies OptionEntry];
      }
      if (item.shouldHide?.()) return [];
      return [
        {
          kind: "group",
          key,
          displayName: item.displayName,
        } satisfies OptionEntry,
        ...flattenOptions(item.items, key),
      ];
    });
  }
  let optionEntries = $derived.by(() => flattenOptions(options));
  const selectedLayout = $derived(
    layoutOptions.find((f) => f.value === view.type) ?? layoutOptions[0],
  );

  function dropDownOptions(data: Record<string, string>) {
    return Object.entries(data).map(([value, label]) => {
      return { label, value };
    });
  }
</script>

<Field.Group class="bases-view-settings">
  <Field.Field class="bases-view-setting">
    <Field.Label for="layout">Layout</Field.Label>
    <Select.Root
      type="single"
      name="layout"
      bind:value={
        () => view.type,
        (value) => {
          view.type = value;
        }
      }
    >
      <Select.Trigger aria-label="Layout" class="bases-style-w-full-6da6a3">
        <Icon name={selectedLayout.icon} />
        {selectedLayout.label}
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          <Select.Label>Layouts</Select.Label>
          {#each layoutOptions as option (option.value)}
            <Select.Item value={option.value} label={option.label}>
              <Icon name={option.icon} />
              {option.label}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </Field.Field>
  {#if view.type === "kanban" || view.type === "activity"}<KanbanSettings
      {controller}
    />{/if}
  {#each optionEntries as entry (entry.key)}
    {#if entry.kind === "group"}
      <h3 class="bases-view-settings__group" data-ui-part="option-group">
        {entry.displayName}
      </h3>
    {:else}
      {@const option = entry.option}
      {#if option.type === "dropdown"}
        {@const selectOptions = dropDownOptions(option.options)}
        {@const selectedOption =
          selectOptions.find(
            (it) =>
              it.value ===
              (controller.view.config.get(option.key) ?? option.default),
          ) ?? selectOptions[0]}
        <Field.Field
          class="bases-view-setting"
          data-option-type="dropdown"
        >
          <Field.Label for={option.key}>{option.displayName}</Field.Label>
          <Select.Root
            type="single"
            name={option.key}
            bind:value={
              () => {
                return (controller.view.config.get(option.key) ||
                  option.default) as string;
              },
              (value) => {
                controller.view.config.set(option.key, value);
              }
            }
          >
            <Select.Trigger
              aria-label={option.displayName}
              class="bases-style-w-full-6da6a3"
            >
              {selectedOption.label}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Label>{option.displayName}</Select.Label>
                {#each selectOptions as opt (opt.value)}
                  <Select.Item value={opt.value} label={opt.label}>
                    {opt.label}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </Field.Field>
      {:else if option.type === "slider"}
        <Field.Field
          class="bases-view-setting"
          data-option-type="slider"
        >
          <Field.Label for={option.key}>{option.displayName}</Field.Label>
          <Slider
            data-tooltip={controller.view.config.get(option.key)}
            type="single"
            bind:value={
              () => {
                return (controller.view.config.get(option.key) ||
                  option.default) as number;
              },
              (value) => {
                controller.view.config.set(option.key, value);
              }
            }
            min={option.min}
            max={option.max}
            step={option.step}
            class="bases-style-w-full-6da6a3"
          />
        </Field.Field>
      {:else if option.type === "text"}
        <Field.Field
          class="bases-view-setting"
          data-option-type="text"
        >
          <Field.Label for={option.key}>{option.displayName}</Field.Label>
          {#if option.key === "badgeColor" && (view.type === "kanban" || view.type === "activity")}
            <ColorPicker
              value={String(controller.view.config.get(option.key) ?? "")}
              placeholder="#15803d"
              ariaLabel={option.displayName}
              onChange={(value) =>
                controller.view.config.set(option.key, value)}
            />
          {:else}
            <Input
              bind:value={
                () => {
                  return (controller.view.config.get(option.key) ??
                    option.default ??
                    "") as string;
                },
                (value) => {
                  controller.view.config.set(option.key, value);
                }
              }
              id={option.key}
              placeholder={option.placeholder}
            />
          {/if}
        </Field.Field>
      {:else if option.type === "multitext"}
        <Field.Field
          class="bases-view-setting"
          data-option-type="multitext"
        >
          <Field.Label for={option.key}>{option.displayName}</Field.Label>
          <Input
            id={option.key}
            value={(
              (controller.view.config.get(option.key) ??
                option.default ??
                []) as string[]
            ).join(", ")}
            onblur={(event) => {
              controller.view.config.set(
                option.key,
                event.currentTarget.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean),
              );
            }}
          />
        </Field.Field>
      {:else if option.type === "toggle"}
        <Field.Field
          class="bases-view-setting"
          data-option-type="toggle"
        >
          <Field.Label for={option.key}>{option.displayName}</Field.Label>
          <Switch
            bind:checked={
              () => {
                return Boolean(
                  controller.view.config.get(option.key) ?? option.default,
                );
              },
              (value) => {
                controller.view.config.set(option.key, value);
              }
            }
            id={option.key}
          />
        </Field.Field>
      {:else if option.type === "file" || option.type === "folder"}
        <Field.Field
          class="bases-view-setting"
          data-option-type={option.type}
        >
          <Field.Label for={option.key}>{option.displayName}</Field.Label>
          <Input
            id={option.key}
            placeholder={option.placeholder}
            bind:value={
              () =>
                (controller.view.config.get(option.key) ??
                  option.default ??
                  "") as string,
              (value) => controller.view.config.set(option.key, value)
            }
          />
        </Field.Field>
      {:else if option.type === "formula"}
        <Field.Field
          class="bases-view-setting"
          data-option-type="formula"
        >
          <Field.Label for={option.key}>{option.displayName}</Field.Label>
          <Textarea
            id={option.key}
            placeholder={option.placeholder}
            bind:value={
              () =>
                (controller.view.config.get(option.key) ??
                  option.default ??
                  "") as string,
              (value) => controller.view.config.set(option.key, value)
            }
          />
        </Field.Field>
      {:else if option.type === "property"}
        <Field.Field
          class="bases-view-setting"
          data-option-type="property"
        >
          <Field.Label for={option.key}>{option.displayName}</Field.Label>
          <PropertyPicker
            id={option.key}
            label={option.displayName}
            columns={controller
              .getAllColumns()
              .filter((column) => !option.filter || option.filter(column.id))}
            value={(controller.view.config.get(option.key) ??
              option.default) as BasesPropertyId | undefined}
            placeholder={option.placeholder ?? "Property"}
            onChange={(value) => controller.view.config.set(option.key, value)}
          />
        </Field.Field>
      {/if}
    {/if}
  {/each}
</Field.Group>

<style>
  :global(.bases-view-settings) {
    gap: 1rem;
  }

  :global(.bases-view-setting) {
    min-width: 0;
    gap: 0.5rem;
  }

  .bases-view-settings__group {
    margin: 0;
    color: var(--ui-workspace-muted-foreground);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
</style>
