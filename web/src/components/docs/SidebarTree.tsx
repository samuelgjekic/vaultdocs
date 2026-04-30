import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ExternalLink, Plus, FileText, MoreHorizontal } from "lucide-react";
import type { PageNode, Space } from "@/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarTreeProps {
  space: Space;
  tree: PageNode[];
  basePath: string; // /org/space
  activePath: string[]; // segments
  canEdit?: boolean;
  onReorder?: (next: PageNode[]) => void;
}

function pathFor(basePath: string, segments: string[]) {
  return segments.length ? `${basePath}/${segments.join("/")}` : basePath;
}

export function SidebarTree({ space, tree, basePath, activePath, canEdit, onReorder }: SidebarTreeProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    if (!onReorder) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = tree.findIndex((n) => n.id === active.id);
    const newIndex = tree.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(tree, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tree.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-0.5">
          {tree.map((node) => (
            <SidebarItem
              key={node.id}
              node={node}
              depth={0}
              basePath={basePath}
              parentSegments={[]}
              activePath={activePath}
              canEdit={canEdit}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface ItemProps {
  node: PageNode;
  depth: number;
  basePath: string;
  parentSegments: string[];
  activePath: string[];
  canEdit?: boolean;
}

function SidebarItem({ node, depth, basePath, parentSegments, activePath, canEdit }: ItemProps) {
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: !canEdit || depth > 0,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const indent = depth * 12;

  if (node.type === "divider") {
    return (
      <li ref={setNodeRef} style={style}>
        <hr className="my-3 border-border" />
      </li>
    );
  }

  if (node.type === "group") {
    const hasChildren = (node.children?.length ?? 0) > 0;
    return (
      <li ref={setNodeRef} style={style} {...attributes}>
        <div
          className="group flex items-center gap-1 px-2 py-2 cursor-pointer select-none"
          onClick={() => setOpen(!open)}
          {...listeners}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            {node.title}
          </span>
          {canEdit && (
            <button
              className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
              aria-label="Add page"
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        {open && hasChildren && (
          <ul className="space-y-0.5">
            {node.children!.map((child) => (
              <SidebarItem
                key={child.id}
                node={child}
                depth={depth + 1}
                basePath={basePath}
                parentSegments={parentSegments}
                activePath={activePath}
                canEdit={canEdit}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (node.type === "link") {
    return (
      <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <a
          href={node.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-item"
          style={{ paddingLeft: indent + 8 }}
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="truncate flex-1">{node.title}</span>
        </a>
      </li>
    );
  }

  // page
  const segs = [...parentSegments, node.slug];
  const isActive = activePath.join("/") === segs.join("/");
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <div className="group flex items-center" style={{ paddingLeft: indent }}>
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="p-1 rounded hover:bg-muted"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link
          to={pathFor(basePath, segs)}
          data-active={isActive}
          className="sidebar-item flex-1"
          {...listeners}
        >
          <span className="text-base leading-none w-4 inline-flex justify-center">
            {node.emoji ?? <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
          </span>
          <span className="truncate flex-1">{node.title}</span>
          {node.is_draft && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Draft
            </span>
          )}
        </Link>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
                aria-label="Page actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Move</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {open && hasChildren && (
        <ul className="space-y-0.5 mt-0.5">
          {node.children!.map((child) => (
            <SidebarItem
              key={child.id}
              node={child}
              depth={depth + 1}
              basePath={basePath}
              parentSegments={segs}
              activePath={activePath}
              canEdit={canEdit}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

void ({} as Space);
