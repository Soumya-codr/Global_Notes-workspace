import { stripHtml, escapeHtml, formatDate } from "./utilities.js";

const $ = (selector) => document.querySelector(selector);

// Converts an array of note objects into a formatted text string for export
export function formatNotesAsText(notes) {
  if (!Array.isArray(notes) || notes.length === 0) {
    return "(No notes to export)";
  }

  return notes
    .map((note, index) => {
      const title = note.title || "Untitled note";
      const tags = (note.tags || []).join(", ") || "none";
      const created = note.createdAt || "";
      const updated = note.updatedAt || "";
      const content = stripHtml(note.content || "");

      const lines = [
        `=== NOTE ${index + 1} ===`,
        `Title: ${title}`,
        `Tags: ${tags}`,
      ];

      if (created) lines.push(`Created: ${created}`);
      if (updated) lines.push(`Updated: ${updated}`);

      lines.push("", "Content:");
      lines.push(content || "(empty)");
      lines.push("", "=== END NOTE " + (index + 1) + " ===", "");

      return lines.join("\n");
    })
    .join("\n");
}

// Exports all notes as a downloadable text file


// Converts HTML content to basic Markdown
function htmlToMarkdown(html) {
  let text = html || "";
  // Headings
  text = text.replace(/<h1.*?>(.*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2.*?>(.*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3.*?>(.*?)<\/h3>/gi, "\n### $1\n");
  // Simple Formatting
  text = text.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  text = text.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  text = text.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  text = text.replace(/<u>(.*?)<\/u>/gi, "__$1__");
  text = text.replace(/<strike.*?>(.*?)<\/strike>/gi, "~~$1~~");
  text = text.replace(/<s.*?>(.*?)<\/s>/gi, "~~$1~~");
  // Lists
  text = text.replace(/<li.*?>(.*?)<\/li>/gi, "\n* $1");
  // Blocks
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<div>/gi, "\n");
  text = text.replace(/<\/div>/gi, "");
  text = text.replace(/<p>(.*?)<\/p>/gi, "\n$1\n");
  // Media
  text = text.replace(/<img.*?src="(.*?)".*?>/gi, "\n![Note Image]($1)\n");
  text = text.replace(/<video.*?src="(.*?)".*?>/gi, "\n[Embedded Video]($1)\n");
  // Cleanup
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  // Strip remaining tags
  text = text.replace(/<[^>]*>/g, "");
  return text.trim();
}

export function formatNotesAsMarkdown(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return "# No notes to export";

  return notes.map((note) => {
    const title = note.title || "Untitled";
    const created = note.createdAt ? `*Created: ${note.createdAt}*` : "";
    const tags = (note.tags || []).length ? `**Tags:** ${note.tags.join(", ")}` : "";
    const content = htmlToMarkdown(note.content);

    return `# ${title}\n${created}\n${tags}\n\n${content}\n\n---\n`;
  }).join("\n");
}

export function exportNotes(notes, format = 'txt', customFilename = null) {
  if (format === 'pdf') {
    printNotes(notes);
    return;
  }

  // Double check we have notes
  if (!notes || notes.length === 0) {
    alert("No notes found to export. Please draft or select a note first.");
    return;
  }

  let text = "";
  // Safe filename generator: handles spaces and null titles
  const safeTitle = (notes[0] && notes[0].title ? notes[0].title : "untitled").toLowerCase().replace(/\s+/g, '-');
  const baseFilename = notes.length === 1 ? `note-${safeTitle}` : "notes-backup";
  let filename = customFilename || `${baseFilename}.${format}`;
  let type = format === 'md' ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";

  if (format === 'md') {
    text = formatNotesAsMarkdown(notes);
  } else {
    text = formatNotesAsText(notes);
  }

  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printNotes(notes) {
  const printContent = notes.map(note => `
    <div class="note-print-item" style="margin-bottom: 50px; page-break-after: auto;">
      <h1 style="color: #111; font-size: 28px; margin: 0 0 8px 0; border-bottom: 2px solid #333; padding-bottom: 5px;">${escapeHtml(note.title || "Untitled Note")}</h1>
      <div style="font-size: 11px; color: #666; margin-bottom: 25px; display: flex; gap: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        <span><strong>Date:</strong> ${escapeHtml(formatDate(note.updatedAt))}</span>
        <span><strong>Tags:</strong> ${escapeHtml((note.tags || []).join(", ") || "None")}</span>
        ${note.folderId ? `<span><strong>Collection:</strong> Sub-Folder</span>` : ""}
      </div>
      <div class="note-print-content" style="line-height: 1.6; color: #333; font-size: 15px;">
        ${note.content || "(No content)"}
      </div>
    </div>
  `).join("");

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to export as PDF");
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Global Notes - Professional Export</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 25.4mm; }
          body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            padding: 20px; 
            max-width: 800px; 
            margin: 0 auto; 
            color: #111;
            line-height: 1.5;
          }
          .note-print-content p { margin: 12px 0; }
          .note-print-content ul, .note-print-content ol { padding-left: 20px; margin: 12px 0; }
          .note-print-content li { margin-bottom: 6px; }
          .note-print-item { page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 30px; margin-bottom: 40px; }
          .note-print-item:last-of-type { border-bottom: none; }
          
          img, video { max-width: 100%; height: auto; border-radius: 4px; display: block; margin: 15px 0; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: monospace; font-size: 13px; }
          code { font-family: monospace; background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }

          @media print {
            body { padding: 0; width: 100%; max-width: none; }
            .no-print { display: none; }
            .note-print-item { border-bottom: 1px solid #ddd; }
          }
          
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 30px;" class="no-print">
          <button onclick="window.print()" style="padding: 10px 20px; background: #111; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-family: inherit;">Print Document</button>
        </div>
        ${printContent}
        <div class="footer">
          Document generated by Global Notes Workspace &bull; ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Sets up event listeners for import/export functionality
export function wireImportExport(state) {
  $("#export")?.addEventListener("click", () => {
    // Check if there are any notes at all
    if (!state.notes || state.notes.length === 0) {
      alert("No notes available to export. Create a note first!");
      return;
    }

    let modal = document.getElementById("export-modal");
    if (!modal) {
      // Lazy create the modal if not present in the DOM (e.g. on landing pages or old builds)
      console.log("Lazy creating export modal...");
      document.body.insertAdjacentHTML('beforeend', `
        <dialog id="export-modal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Export Workspace</h2>
              <button class="btn-icon close-modal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="export-options" style="display: grid; gap: 20px;">
                <div class="export-section">
                  <h3 style="margin-bottom: 8px; font-size: 0.8em; color: var(--text-secondary); text-transform: uppercase;">Active Note</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="btn secondary" id="export-active-txt">Text (.txt)</button>
                    <button class="btn secondary" id="export-active-md">Markdown (.md)</button>
                    <button class="btn primary" id="export-active-pdf" style="grid-column: span 2;">Professional PDF</button>
                  </div>
                </div>
                <div style="height: 1px; background: rgba(128,128,128,0.2);"></div>
                <div class="export-section">
                  <h3 style="margin-bottom: 8px; font-size: 0.8em; color: var(--text-secondary); text-transform: uppercase;">Backup All</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="btn secondary" id="export-all-txt">All Files (.txt)</button>
                    <button class="btn secondary" id="export-all-md">All Files (.md)</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      `);
      modal = document.getElementById("export-modal");
    }

    // Helper for getting active note
    const getActiveNote = () => state.notes.find(n => n.id === state.activeNoteId);

    // MAPPING ALL CLICKABLE IDs (New and Legacy for cached browsers)
    const exportTargets = [
      { id: "export-active-txt", notes: () => [getActiveNote()], format: 'txt' },
      { id: "export-active-md", notes: () => [getActiveNote()], format: 'md' },
      { id: "export-active-pdf", notes: () => [getActiveNote()], format: 'pdf' },
      { id: "export-all-txt", notes: () => state.notes, format: 'txt' },
      { id: "export-all-md", notes: () => state.notes, format: 'md' },
      // LEGACY IDs (Support for old app.html versions)
      { id: "export-txt", notes: () => state.notes, format: 'txt' },
      { id: "export-md", notes: () => state.notes, format: 'md' },
      { id: "export-pdf", notes: () => [getActiveNote()], format: 'pdf' }
    ];

    exportTargets.forEach(target => {
      const btn = document.getElementById(target.id);
      if (!btn) return;

      btn.onclick = (e) => {
        e.stopPropagation();
        const nts = target.notes().filter(n => n); // Clean nulls

        if (nts.length === 0) {
          alert("Could not identify the note to export. Please make sure a note is selected.");
        } else {
          exportNotes(nts, target.format);
        }
        modal.close();
      };
    });

    // Modal behavior (Close buttons and backdrop)
    modal.querySelectorAll(".close-modal").forEach(b => {
      b.onclick = () => modal.close();
    });

    modal.onclick = (e) => {
      if (e.target === modal) modal.close();
    };

    modal.showModal();
  });
}