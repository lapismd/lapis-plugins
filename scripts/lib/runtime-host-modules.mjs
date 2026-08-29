export function isPluginSelfReference(packageName, specifier) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}
