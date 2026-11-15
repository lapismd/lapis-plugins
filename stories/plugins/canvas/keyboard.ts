/** Match CodeMirror and the canvas renderer's platform-native modifier. */
export function primaryShortcut(sequence: string): string {
  return /Mac/.test(navigator.platform)
    ? sequence.replaceAll("Control", "Meta")
    : sequence;
}
