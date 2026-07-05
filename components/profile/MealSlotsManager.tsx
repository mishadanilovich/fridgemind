"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createMealSlot,
  deleteMealSlot,
  renameMealSlot,
  reorderMealSlots,
} from "@/lib/actions/meal-slots";

type Slot = { id: string; name: string };

type Props = {
  slots: Slot[];
};

export function MealSlotsManager({ slots }: Props) {
  const [items, setItems] = useState(slots);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAdding, startAdd] = useTransition();

  // Синхронизируемся с сервером после revalidate (add/delete/reorder) — новый проп slots.
  useEffect(() => {
    setItems(slots);
  }, [slots]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next); // оптимистично

    setError(null);
    void reorderMealSlots(next.map((s) => s.id)).then((result) => {
      if (result.error) setError(result.error);
    });
  }

  function onAdd() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startAdd(async () => {
      const result = await createMealSlot(name);
      if (result.error) setError(result.error);
      else setNewName("");
    });
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((slot) => (
              <SlotRow key={slot.id} slot={slot} onError={setError} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Новый приём пищи"
          maxLength={40}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button variant="outline" onClick={onAdd} disabled={isAdding || !newName.trim()}>
          <Plus />
          Добавить
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

type SlotRowProps = {
  slot: Slot;
  onError: (message: string | null) => void;
};

function SlotRow({ slot, onError }: SlotRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id,
  });
  const [name, setName] = useState(slot.name);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(slot.name);
  }, [slot.name]);

  function commitRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === slot.name) {
      setName(slot.name);
      return;
    }
    onError(null);
    startTransition(async () => {
      const result = await renameMealSlot(slot.id, trimmed);
      if (result.error) {
        onError(result.error);
        setName(slot.name);
      }
    });
  }

  function onDelete() {
    onError(null);
    startTransition(async () => {
      const result = await deleteMealSlot(slot.id);
      if (result.error) onError(result.error);
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 rounded-md border border-border bg-card p-2"
      data-dragging={isDragging}
    >
      <button
        type="button"
        className="flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground"
        aria-label={`Переместить «${slot.name}»`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        maxLength={40}
        disabled={isPending}
        className="h-9"
        aria-label={`Название приёма пищи «${slot.name}»`}
      />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
            aria-label={`Удалить «${slot.name}»`}
            disabled={isPending}
          >
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить приём пищи?</AlertDialogTitle>
            <AlertDialogDescription>
              «{slot.name}» больше не будет предлагаться при планировании. Уже запланированные
              приёмы пищи в прошлых неделях останутся видны.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
