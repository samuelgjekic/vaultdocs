import { Node, mergeAttributes } from "@tiptap/core";

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-variant") || "info",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const variant = node.attrs.variant ?? "info";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "true",
        class: `vd-callout my-5 rounded-lg border-l-4 px-4 py-3 callout-${variant}`,
      }),
      0,
    ];
  },
});
