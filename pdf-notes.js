/* =====================================================
   Calculator Pro — pdf-notes.js
   PDF Viewer + Notes Section Logic
   ===================================================== */
(function () {
  'use strict';

  // ── PDF Viewer ──
  const pdfFileInput = document.getElementById('pdfFileInput');
  const pdfUploadBtn = document.getElementById('pdfUploadBtn');
  const pdfFileName = document.getElementById('pdfFileName');
  const pdfIframe = document.getElementById('pdfIframe');

  if (pdfUploadBtn) {
    pdfUploadBtn.addEventListener('click', () => pdfFileInput.click());
  }

  if (pdfFileInput) {
    pdfFileInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      pdfFileName.textContent = file.name;
      const url = URL.createObjectURL(file);
      pdfIframe.src = url;
      pdfIframe.style.display = 'block';
    });
  }

  // ── Notes ──
  const notesTextarea = document.getElementById('calcNotes');
  const saveNotesBtn = document.getElementById('saveNotesBtn');
  const clearNotesBtn = document.getElementById('clearNotesBtn');
  const savedIndicator = document.getElementById('notesSavedIndicator');

  // Get page-specific storage key
  const pageKey = 'calc-notes-' + window.location.pathname.split('/').pop().replace('.html', '');

  // Load saved notes
  if (notesTextarea) {
    const saved = localStorage.getItem(pageKey);
    if (saved) notesTextarea.value = saved;
  }

  if (saveNotesBtn) {
    saveNotesBtn.addEventListener('click', function () {
      if (notesTextarea) {
        localStorage.setItem(pageKey, notesTextarea.value);
        savedIndicator.textContent = '✓ Saved';
        savedIndicator.style.color = 'var(--green, #10B981)';
        setTimeout(() => { savedIndicator.textContent = ''; }, 3000);
      }
    });
  }

  if (clearNotesBtn) {
    clearNotesBtn.addEventListener('click', function () {
      if (notesTextarea) {
        notesTextarea.value = '';
        localStorage.removeItem(pageKey);
        savedIndicator.textContent = '✓ Cleared';
        savedIndicator.style.color = 'var(--amber, #F59E0B)';
        setTimeout(() => { savedIndicator.textContent = ''; }, 3000);
      }
    });
  }
})();