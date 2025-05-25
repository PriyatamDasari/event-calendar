// src/components/DroppableCell.jsx
import React from "react";
import { useDrop } from "react-dnd";

const EVENT_TYPE = "EVENT";

export default function DroppableCell({ onDrop, canDropEvent, children, ...props }) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: EVENT_TYPE,
    drop: (item) => {
      if (canDropEvent(item)) onDrop(item);
    },
    canDrop: canDropEvent,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        background: isOver && canDrop ? "#e3f2fd" : undefined,
        transition: "background 0.2s",
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
