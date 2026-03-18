const $ = (selector) => document.querySelector(selector);

// Inserts HTML content at the current cursor position in the content editable area
export function insertHtmlAtCursor(html) {
  const contentEl = $("#content");
  if (!contentEl) return;

  contentEl.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    contentEl.insertAdjacentHTML("beforeend", html);
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const fragment = range.createContextualFragment(html);
  range.insertNode(fragment);
}

// Sets up all formatting toolbar buttons and their corresponding actions
export function wireFormattingToolbar() {
  const contentEl = $("#content");
  if (!contentEl) return;

  // Applies the specified formatting or edit command to the selected text
  function applyFormat(command) {
    contentEl.focus();
    try {
      document.execCommand(command, false, null);
    } catch (e) {
      console.error("Command failed", command, e);
    }
  }

  // Format dropdown (Bold, Italic, Underline, Bullet List)
  const formatSelect = $("#format-action");
  if (formatSelect) {
    formatSelect.addEventListener("change", (e) => {
      const action = e.target.value;
      if (!action) return;

      switch (action) {
        case "bold":
          applyFormat("bold");
          break;
        case "italic":
          applyFormat("italic");
          break;
        case "underline":
          applyFormat("underline");
          break;
        case "strikethrough":
          applyFormat("strikeThrough");
          break;
        case "alignLeft":
          applyFormat("justifyLeft");
          break;
        case "alignCenter":
          applyFormat("justifyCenter");
          break;
        case "alignRight":
          applyFormat("justifyRight");
          break;
        case "bullet":
          applyFormat("insertUnorderedList");
          break;
      }

      // Reset dropdown to default
      setTimeout(() => {
        e.target.value = "";
      }, 100);
    });
  }

  // Edit dropdown (Cut, Copy, Paste)
  const editSelect = $("#edit-action");
  if (editSelect) {
    editSelect.addEventListener("change", (e) => {
      const action = e.target.value;
      if (!action) return;

      switch (action) {
        case "cut":
          applyFormat("cut");
          break;
        case "copy":
          applyFormat("copy");
          break;
        case "paste":
          applyFormat("paste");
          break;
      }

      // Reset dropdown to default
      setTimeout(() => {
        e.target.value = "";
      }, 100);
    });
  }




  // Undo/Redo buttons
  const undoBtn = $("#edit-undo");
  if (undoBtn) {
    undoBtn.addEventListener("click", () => {
      applyFormat("undo");
    });
  }

  const redoBtn = $("#edit-redo");
  if (redoBtn) {
    redoBtn.addEventListener("click", () => {
      applyFormat("redo");
    });
  }

  // Text size control with proper event handling
  const textSizeSelect = $("#text-size");
  if (textSizeSelect) {
    try {
      // Load saved size preference from localStorage
      const savedSize = localStorage.getItem("notesWorkspace.textSize") || "15";
      // Set the select dropdown to the saved value
      textSizeSelect.value = savedSize;
      // Apply the saved font size to content area
      if (contentEl) {
        contentEl.style.fontSize = `${savedSize}px`;
        contentEl.style.setProperty("--editor-font-size", `${savedSize}px`);
      }
    } catch {
      // Default to 15px if localStorage fails
      if (contentEl) {
        contentEl.style.fontSize = "15px";
      }
    }

    // Listen for changes to text size dropdown
    textSizeSelect.addEventListener("change", (e) => {
      const size = e.target.value;
      console.log("Text size changed to:", size);

      // Apply new font size to content area
      if (contentEl) {
        contentEl.style.setProperty("--editor-font-size", `${size}px`);
        // Also keep the actual font-size property for compatibility if needed
        contentEl.style.fontSize = `${size}px`;
        // Force browser to recognize the change
        contentEl.offsetHeight;
      }

      try {
        // Persist the user's choice to localStorage
        localStorage.setItem("notesWorkspace.textSize", size);
      } catch (err) {
        console.warn("Failed to save text size preference:", err);
      }
    });

    console.log("Text size control initialized");
  } else {
    console.warn("Text size select element not found");
  }


  // Text color control
  const textColorSelect = $("#text-color");
  if (textColorSelect) {
    textColorSelect.addEventListener("change", (e) => {
      const color = e.target.value;
      contentEl.focus();
      if (color) {
        try {
          document.execCommand("foreColor", false, color);
        } catch (err) {
          console.error("Color command failed", err);
        }
      } else {
        try {
          document.execCommand("removeFormat", false, null);
        } catch (err) {
          console.error("Remove format failed", err);
        }
      }
      // Reset dropdown to default after applying
      setTimeout(() => {
        textColorSelect.value = "";
      }, 100);
    });
  }

  // Custom text color control
  const customColorInput = $("#custom-text-color");
  if (customColorInput) {
    customColorInput.addEventListener("input", (e) => {
      const color = e.target.value;
      contentEl.focus();
      if (color) {
        applyFormat("foreColor", color);
        // Note: applyFormat currently only takes one arg. We need to handle the color arg.
        // Wait, I can't modify applyFormat easily in this block without potentially breaking others or duplicating logic.
        // I'll just use document.execCommand directly like the select handler does.
        try {
          document.execCommand("foreColor", false, color);
        } catch (err) {
          console.error("Color command failed", err);
        }
      }
    });

    // Also handle 'change' event to ensure final selection is applied
    customColorInput.addEventListener("change", (e) => {
      const color = e.target.value;
      contentEl.focus();
      if (color) {
        try {
          document.execCommand("foreColor", false, color);
        } catch (err) {
          console.error("Color command failed", err);
        }
      }
    });
  }

  // Highlight color control
  const highlightColorSelect = $("#highlight-color");
  console.log("Highlight Element:", highlightColorSelect); // DEBUG
  if (highlightColorSelect) {
    highlightColorSelect.addEventListener("change", (e) => {
      const color = e.target.value;
      contentEl.focus();
      if (color) {
        try {
          document.execCommand("hiliteColor", false, color);
        } catch (err) {
          console.error("Highlight command failed", err);
        }
      } else {
        try {
          // Remove highlight (transparent background)
          document.execCommand("hiliteColor", false, "transparent");
        } catch (err) {
          console.error("Remove highlight failed", err);
        }
      }
      // Reset dropdown to default after applying if desired, 
      // but usually for highlight state it's nice to see what was picked?
      // Actually standard behavior in this app seems to be reset.
      setTimeout(() => {
        highlightColorSelect.value = "";
      }, 100);
    });
  }
}