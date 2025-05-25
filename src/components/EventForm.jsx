import React, { useState } from "react";

const recurrenceOptions = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom (every 2 weeks)" },
];

// Helper to format date for datetime-local input (fixes timezone offset)
function toLocalDatetimeInputValue(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EventForm({ date, event, onSave, onCancel }) {
  const [title, setTitle] = useState(event ? event.title : "");
  const [dateTime, setDateTime] = useState(
    event
      ? toLocalDatetimeInputValue(event.dateTime)
      : date
      ? toLocalDatetimeInputValue(date)
      : ""
  );
  const [description, setDescription] = useState(event ? event.description : "");
  const [color, setColor] = useState(event ? event.color : "#1976d2");
  const [category, setCategory] = useState(event ? event.category : "");
  const [recurrence, setRecurrence] = useState(event ? event.recurrence : "none");

  function handleSubmit(e) {
    e.preventDefault();
    const dateObj = new Date(dateTime);
    if (isNaN(dateObj.getTime())) {
      alert("Please provide a valid date and time.");
      return;
    }
    onSave({
      ...event,
      title,
      description,
      color,
      category,
      recurrence,
      dateTime: dateObj.toISOString(),
      id: event ? event.id : Date.now().toString(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        minWidth: 320,
      }}
    >
      <h2 style={{ marginBottom: 0 }}>{event ? "Edit Event" : "Add Event"}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label>
          <span style={{ fontWeight: 500 }}>Title</span>
          <input
            required
            placeholder="Event Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          />
        </label>
        <label>
          <span style={{ fontWeight: 500 }}>Date & Time</span>
          <input
            type="datetime-local"
            required
            value={dateTime}
            onChange={e => setDateTime(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          />
        </label>
        <label>
          <span style={{ fontWeight: 500 }}>Description</span>
          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", resize: "vertical" }}
          />
        </label>
        <label>
          <span style={{ fontWeight: 500 }}>Color</span>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            style={{ width: 48, height: 32, border: "none", background: "none" }}
          />
        </label>
        <label>
          <span style={{ fontWeight: 500 }}>Category</span>
          <input
            placeholder="Category (optional)"
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          />
        </label>
        <label>
          <span style={{ fontWeight: 500 }}>Recurrence</span>
          <select
            value={recurrence}
            onChange={e => setRecurrence(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          >
            {recurrenceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, justifyContent: "flex-end" }}>
        <button
          type="submit"
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "8px 18px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {event ? "Update" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "#eee",
            color: "#333",
            border: "none",
            borderRadius: 4,
            padding: "8px 18px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
