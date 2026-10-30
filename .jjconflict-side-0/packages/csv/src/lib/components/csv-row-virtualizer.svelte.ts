import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  Virtualizer,
  type VirtualItem,
  type VirtualizerOptions,
} from "@tanstack/virtual-core";
import { flushSync } from "svelte";

export const CSV_ROW_HEIGHT = 32;
/** Rows kept above and below the viewport so a fast scroll does not run into the spacer. */
export const CSV_ROW_OVERSCAN = 16;

export function createCsvRowVirtualizer() {
  let items = $state.raw<VirtualItem[]>([]);
  let totalSize = $state(0);
  let flushing = false;
  const options: VirtualizerOptions<HTMLElement, HTMLTableRowElement> = {
    count: 0,
    enabled: false,
    estimateSize: () => CSV_ROW_HEIGHT,
    getScrollElement: () => null,
    observeElementOffset,
    observeElementRect,
    onChange: (instance, scrolling) => {
      items = instance.getVirtualItems();
      totalSize = instance.getTotalSize();
      if (!scrolling || flushing) return;
      flushing = true;
      try {
        flushSync();
      } finally {
        flushing = false;
      }
    },
    overscan: CSV_ROW_OVERSCAN,
    scrollToFn: elementScroll,
  };
  const virtualizer = new Virtualizer(options);

  $effect(() => {
    const cleanup = virtualizer._didMount();
    virtualizer._willUpdate();
    return cleanup;
  });

  return {
    get items() {
      return items;
    },
    get totalSize() {
      return totalSize;
    },
    setOptions(
      next: Partial<VirtualizerOptions<HTMLElement, HTMLTableRowElement>>,
    ) {
      virtualizer.setOptions({
        ...virtualizer.options,
        ...next,
        onChange: options.onChange,
      });
      // virtual-core only observes the scroll element from `_willUpdate`.
      // The count and scrollport arrive after mount, so rebinding has to
      // happen here or `getVirtualItems()` stays empty.
      virtualizer._willUpdate();
      virtualizer.measure();
    },
  };
}
