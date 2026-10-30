declare module "reveal.js";

declare module "reveal.js/plugin/notes/notes";

declare module "*.css?inline" {
  const styles: string;
  export default styles;
}
