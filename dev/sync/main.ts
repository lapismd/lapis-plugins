import { mount } from "svelte";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import "@lapis-notes/lapis-plugin-sync/styles.css";
import Review from "./Review.svelte";

mount(Review, { target: document.getElementById("app")! });
