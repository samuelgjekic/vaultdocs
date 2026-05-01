import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Placeholder } from "@tiptap/extension-placeholder";
import { docExtensions } from "@/lib/tiptap/extensions";
import { Bold, Italic, Underline as UnderlineIcon, Code, Link as LinkIcon, Heading2, List, ListOrdered, Quote, Minus, MessageSquare } from "lucide-react";
import { EditorToolbar } from "./EditorToolbar";

interface Props {
  initialContent: any;
  initialTitle: string;
  isDraft?: boolean;
  onChange: (content: any, title: string) => void;
  onPublish?: () => void;
  onSaveStatus?: (status: "saving" | "saved" | "idle") => void;
}

export function PageEditor({ initialContent, initialTitle, isDraft, onChange, onPublish, onSaveStatus }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [showSlash, setShowSlash] = useState(false);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      ...docExtensions,
      Placeholder.configure({ placeholder: "Start writing, or press / for blocks…" }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), title);
    },
  });

  // autosave debounce status
  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      onSaveStatus?.("saving");
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => onSaveStatus?.("saved"), 1500);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor, onSaveStatus]);

  // slash menu trigger
  useEffect(() => {
    if (!editor) return;
    const handler = ({ editor: ed }: any) => {
      const { selection } = ed.state;
      const { $from } = selection;
      const text = $from.parent.textContent;
      if (text.endsWith("/")) {
        const coords = ed.view.coordsAtPos($from.pos);
        setSlashPos({ top: coords.bottom + 4, left: coords.left });
        setShowSlash(true);
      } else {
        setShowSlash(false);
      }
    };
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("update", handler);
    };
  }, [editor]);

  const insertBlock = (action: () => void) => {
    if (!editor) return;
    // remove the trailing slash
    const { from } = editor.state.selection;
    editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
    action();
    setShowSlash(false);
  };

  if (!editor) return null;

  const slashItems = [
    { label: "Heading 2", icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Heading 3", icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "Bullet list", icon: List, action: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Quote", icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Code block", icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: "Divider", icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run() },
    { label: "Callout", icon: MessageSquare, action: () => editor.chain().focus().insertContent({ type: "callout", attrs: { variant: "info" }, content: [{ type: "paragraph", content: [{ type: "text", text: "Note" }] }] }).run() },
  ];

  return (
    <div ref={editorRef}>
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          onChange(editor.getJSON(), e.target.value);
        }}
        placeholder="Untitled"
        className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none mb-6 placeholder:text-muted-foreground/50"
      />
      <EditorToolbar editor={editor} />
      <FloatingToolbar editor={editor} />
      <div className="editor-frame">
        <EditorContent editor={editor} className="prose-doc" />
      </div>

      {showSlash && (
        <div
          style={{ position: "fixed", top: slashPos.top, left: slashPos.left }}
          className="z-50 w-64 bg-popover border border-border rounded-md shadow-xl p-1"
        >
          {slashItems.map((it) => (
            <button
              key={it.label}
              onClick={() => insertBlock(it.action)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground text-left"
            >
              <it.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {it.label}
            </button>
          ))}
        </div>
      )}

      {/* hidden status indicator slot — controlled by parent */}
      <div className="hidden">{isDraft && "draft"}{onPublish && "publish"}</div>
    </div>
  );
}

function ToolbarBtn({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`h-7 w-7 inline-flex items-center justify-center rounded ${active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

function FloatingToolbar({ editor }: { editor: any }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) { setPos(null); return; }
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const left = (start.left + end.left) / 2;
      setPos({ top: start.top - 44, left });
    };
    editor.on("selectionUpdate", update);
    return () => { editor.off("selectionUpdate", update); };
  }, [editor]);

  if (!pos) return null;
  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
      className="z-50 flex items-center gap-0.5 bg-popover border border-border rounded-md shadow-lg p-1"
    >
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><UnderlineIcon className="h-3.5 w-3.5" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}><Code className="h-3.5 w-3.5" /></ToolbarBtn>
      <ToolbarBtn onClick={() => {
        const url = prompt("URL");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }}><LinkIcon className="h-3.5 w-3.5" /></ToolbarBtn>
    </div>
  );
}

