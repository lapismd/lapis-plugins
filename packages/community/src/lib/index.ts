import "./styles.css";

export { default as manifest } from "@lapis-notes/community/manifest.json";
export { default as CommunityPluginApplication } from "./community-plugin-application.svelte";
export { CommunityPlugin } from "./community-plugin";
export {
  createCommunityPluginController,
  DEFAULT_COMMUNITY_RELAY_URL,
} from "./community-runtime";
export {
  createCommunityPluginRegistrySource,
  installCommunityRegistryPlugin,
  selectCommunityPluginRegistrySource,
} from "./community-registry";
export { CommunityView } from "./community-view";
export { CommunityHostIdentityProvider, identityFor } from "./host-identity";
export { COMMUNITY_PLUGIN_ID, CommunityViewType } from "./ids";

export { CommunityPlugin as default } from "./community-plugin";
