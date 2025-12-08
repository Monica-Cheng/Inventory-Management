// client/src/components/CollapsibleCard.jsx
import React, { useState } from "react";

function CollapsibleCard({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel">
      <div className="collapsible-header" onClick={() => setOpen(!open)}>
        <div>{title}</div>
        <div className="chevron">{open ? "−" : "+"}</div>
      </div>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}

export default CollapsibleCard;
