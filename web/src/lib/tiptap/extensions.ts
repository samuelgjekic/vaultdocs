import { useMemo } from "react";
import { generateHTML } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Callout } from "./callout";

export const docExtensions = [
  StarterKit.configure({ codeBlock: { HTMLAttributes: { class: "vd-code" } } }),
  Underline,
  Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
  Image,
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,
  Callout,
];

export function useDocHTML(json: any): string {
  return useMemo(() => {
    if (!json) return "";
    try {
      return generateHTML(json, docExtensions as any);
    } catch {
      return "";
    }
  }, [json]);
}
