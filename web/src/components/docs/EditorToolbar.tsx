import { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Link as LinkIcon,
  List, ListOrdered, ListChecks,
  Quote, Code2, Minus,
  MessageSquare, ChevronDown,
  Image as ImageIcon, Table as TableIcon,
  Info, AlertTriangle, AlertOctagon, CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  editor: Editor;
}

// Re-render the toolbar when the cursor moves (block type / mark active state
// can change). We deliberately don't listen to `transaction` — it fires on
// every keystroke and would re-render the whole toolbar per character typed.
function useEditorTick(editor: Editor) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const update = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);
}

const blockOptions = [
  { label: "Paragraph", action: (e: Editor) => e.chain().focus().setParagraph().run(), match: (e: Editor) => e.isActive("paragraph") },
  { label: "Heading 2", action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(), match: (e: Editor) => e.isActive("heading", { level: 2 }) },
  { label: "Heading 3", action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run(), match: (e: Editor) => e.isActive("heading", { level: 3 }) },
  { label: "Heading 4", action: (e: Editor) => e.chain().focus().toggleHeading({ level: 4 }).run(), match: (e: Editor) => e.isActive("heading", { level: 4 }) },
];

export function EditorToolbar({ editor }: Props) {
  useEditorTick(editor);
  const blockLabel = blockOptions.find((b) => b.match(editor))?.label ?? "Paragraph";

  // preventDefault on mousedown keeps the editor selection alive when buttons are clicked.
  const stop = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div
      onMouseDown={stop}
      className="sticky top-14 z-20 -mx-2 mb-3 flex items-center gap-0.5 overflow-x-auto rounded-md border border-border bg-background/95 px-2 py-1.5 backdrop-blur"
    >
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium hover:bg-muted">
          {blockLabel}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {blockOptions.map((b) => (
            <DropdownMenuItem
              key={b.label}
              onSelect={() => b.action(editor)}
              className={b.match(editor) ? "bg-accent" : ""}
            >
              {b.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Sep />

      <Btn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Link" active={editor.isActive("link")} onClick={() => {
        const prev = editor.getAttributes("link").href ?? "";
        const url = prompt("URL", prev);
        if (url === null) return;
        if (url === "") editor.chain().focus().unsetLink().run();
        else editor.chain().focus().setLink({ href: url }).run();
      }}>
        <LinkIcon className="h-3.5 w-3.5" />
      </Btn>

      <Sep />

      <Btn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ListChecks className="h-3.5 w-3.5" />
      </Btn>

      <Sep />

      <Btn label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 className="h-3.5 w-3.5" />
      </Btn>
      <Btn label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-3.5 w-3.5" />
      </Btn>

      <CalloutMenu editor={editor} />

      <Btn label="Image" onClick={() => {
        const url = prompt("Image URL");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }}>
        <ImageIcon className="h-3.5 w-3.5" />
      </Btn>

      <Btn label="Table" onClick={() =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      }>
        <TableIcon className="h-3.5 w-3.5" />
      </Btn>
    </div>
  );
}

const calloutVariants: { variant: string; label: string; Icon: typeof Info }[] = [
  { variant: "info", label: "Info", Icon: Info },
  { variant: "warning", label: "Warning", Icon: AlertTriangle },
  { variant: "danger", label: "Danger", Icon: AlertOctagon },
  { variant: "success", label: "Success", Icon: CheckCircle2 },
];

function CalloutMenu({ editor }: { editor: Editor }) {
  const insert = (variant: string) =>
    editor.chain().focus().insertContent({
      type: "callout",
      attrs: { variant },
      content: [{ type: "paragraph", content: [{ type: "text", text: "Note" }] }],
    }).run();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Callout"
        className="h-7 inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 text-foreground hover:bg-muted"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {calloutVariants.map(({ variant, label, Icon }) => (
          <DropdownMenuItem key={variant} onSelect={() => insert(variant)} className="gap-2">
            <Icon className={`h-3.5 w-3.5 callout-${variant} bg-transparent rounded p-0`} />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Btn({ children, onClick, active, label }: { children: React.ReactNode; onClick: () => void; active?: boolean; label: string }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`h-7 w-7 inline-flex shrink-0 items-center justify-center rounded ${active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-4 w-px bg-border" />;
}
