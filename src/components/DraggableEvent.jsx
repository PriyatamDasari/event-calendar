// src/components/DraggableEvent.jsx
import React from "react";
import { useDrag } from "react-dnd";

const EVENT_TYPE = "EVENT";

export default function DraggableEvent({ event, children, canDrag = true }) {
  const [{ isDragging }, drag] = useDrag({
    type: EVENT_TYPE,
    item: { id: event.id, originalDate: event.dateTime },
    canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: canDrag ? "move" : "pointer",
      }}
    >
      {children}
    </div>
  );
}
