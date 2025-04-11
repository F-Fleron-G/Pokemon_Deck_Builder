import React, { useState, useEffect } from "react";
import "./ExpandableCardWrapper.css";
import deleteIcon from "../assets/delete_btn.png";

const ExpandableCardWrapper = ({
  card,
  isExpanded,
  onExpand,
  onCollapse,
  onDelete,
  children
}) => {
  const [showCollapse, setShowCollapse] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setShowCollapse(true);
    } else {
      const timeout = setTimeout(() => setShowCollapse(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isExpanded]);

  const handleClick = () => {
    if (isExpanded) {
      onCollapse();
    } else {
      onExpand(card.id);
    }
  };

  return (
    <div
      className={`deck-card-wrapper ${isExpanded ? "expanded" : ""}`}
      onClick={handleClick}
    >
      {showCollapse && (
        <button
          className={`collapse-btn ${isExpanded ? "fade-in" : "fade-out"}`}
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
        >
          X
        </button>
      )}

      <div
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(card.id);
        }}
      >
        <img src={deleteIcon} alt="Delete card" className="delete-icon" />
      </div>

      {children}
    </div>
  );
};

export default ExpandableCardWrapper;
