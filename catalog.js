/* =========================================================
   Електронний каталог — підвантаження з Google Таблиці
   Очікувані колонки: ID, ISBN, Автор, Назва, Відомості,
   Відп., Видання, Місце, Видавець, Рік, Обсяг, УДК,
   Тематика, Ел. ресурс
   ========================================================= */

const SHEET_ID = "1wot9dLSh-FdA8esKV56IBbm0NwLWqs31ymXw0lUHNq8";
const SHEET_GID = "0";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const stateEl = document.getElementById("catalog-state");
const gridEl = document.getElementById("catalog-grid");
const countEl = document.getElementById("catalog-count");
const searchEl = document.getElementById("catalog-search");

const modal = document.getElementById("book-modal");
const modalClose = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalAuthor = document.getElementById("modal-author");
const modalSimple = document.getElementById("modal-body-simple");
const modalDetailed = document.getElementById("modal-body-detailed");
const modalTabs = document.querySelectorAll(".modal-tab");

let allBooks = [];

function getField(row, name) {
  const target = name.trim().toLowerCase();
  for (const key in row) {
    if (key.trim().toLowerCase() === target) {
      return (row[key] || "").toString().trim();
    }
  }
  return "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function fieldRow(label, value) {
  if (!value) return "";
  return `<div class="field-row"><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`;
}

function bookToFields(book, mode) {
  const title = escapeHtml(book.title);
  const author = escapeHtml(book.author);
  const year = escapeHtml(book.year);
  const topic = escapeHtml(book.topic);
  const volume = escapeHtml(book.volume);
  const publisher = escapeHtml(book.publisher);
  const place = escapeHtml(book.place);
  const notes = escapeHtml(book.notes);
  const isbn = escapeHtml(book.isbn);
  const edition = escapeHtml(book.edition);
  const responsibility = escapeHtml(book.responsibility);
  const udc = escapeHtml(book.udc);
  const link = book.link
    ? `<a href="${escapeHtml(book.link)}" target="_blank" rel="noopener">Відкрити електронний ресурс →</a>`
    : "";

  if (mode === "simple") {
    return [
      fieldRow("Автор", author),
      fieldRow("Рік", year),
      fieldRow("Тематика", topic),
      fieldRow("Обсяг", volume),
      fieldRow("Опис", notes),
    ].join("");
  }

  return [
    fieldRow("Автор", author),
    fieldRow("ISBN", isbn),
    fieldRow("Відомості", notes),
    fieldRow("Відп.", responsibility),
    fieldRow("Видання", edition),
    fieldRow("Місце", place),
    fieldRow("Видавець", publisher),
    fieldRow("Рік", year),
    fieldRow("Обсяг", volume),
    fieldRow("УДК", udc),
    fieldRow("Тематика", topic),
    fieldRow("Ел. ресурс", link),
  ].join("");
}

function openModal(book) {
  modalTitle.textContent = book.title;
  modalAuthor.textContent = book.author;
  modalSimple.innerHTML = bookToFields(book, "simple");
  modalDetailed.innerHTML = bookToFields(book, "detailed");

  modalTabs.forEach((tab) => tab.classList.remove("active"));
  modalTabs[0].classList.add("active");
  modalSimple.hidden = false;
  modalDetailed.hidden = true;

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

modalTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    modalTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const mode = tab.dataset.mode;
    modalSimple.hidden = mode !== "simple";
    modalDetailed.hidden = mode !== "detailed";
  });
});

function renderGrid(books) {
  if (books.length === 0) {
    gridEl.innerHTML = "";
    stateEl.hidden = false;
    stateEl.textContent = "Нічого не знайдено за цим запитом.";
    return;
  }

  stateEl.hidden = true;
  gridEl.hidden = false;

  gridEl.innerHTML = books
    .map((book, i) => {
      const title = escapeHtml(book.title);
      const author = escapeHtml(book.author);
      const year = escapeHtml(book.year);
      const type = escapeHtml(book.notes);
      return `
        <button class="book-card" type="button" data-index="${i}">
          <span class="book-spine"></span>
          <h3>${title}</h3>
          <p class="book-author">${author}</p>
          <div class="book-meta">
            ${year ? `<span>${year}</span>` : ""}
            ${type ? `<span>${type}</span>` : ""}
          </div>
        </button>
      `;
    })
    .join("");

  gridEl.querySelectorAll(".book-card").forEach((card) => {
    card.addEventListener("click", () => {
      const idx = Number(card.dataset.index);
      openModal(books[idx]);
    });
  });
}

function applySearch() {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) {
    renderGrid(allBooks);
    countEl.textContent = `${allBooks.length} видань`;
    return;
  }
  const filtered = allBooks.filter(
    (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  );
  renderGrid(filtered);
  countEl.textContent = `${filtered.length} з ${allBooks.length}`;
}

searchEl.addEventListener("input", applySearch);

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    if (!results.data || results.data.length === 0) {
      stateEl.textContent = "Не вдалося знайти дані в таблиці.";
      return;
    }

    allBooks = results.data
      .filter((row) => getField(row, "Назва") !== "")
      .map((row) => ({
        title: getField(row, "Назва"),
        author: getField(row, "Автор"),
        isbn: getField(row, "ISBN"),
        notes: getField(row, "Відомості"),
        responsibility: getField(row, "Відп."),
        edition: getField(row, "Видання"),
        place: getField(row, "Місце"),
        publisher: getField(row, "Видавець"),
        year: getField(row, "Рік"),
        volume: getField(row, "Обсяг"),
        udc: getField(row, "УДК"),
        topic: getField(row, "Тематика"),
        link: getField(row, "Ел. ресурс"),
      }));

    countEl.textContent = `${allBooks.length} видань`;
    renderGrid(allBooks);
  },
  error: () => {
    stateEl.textContent =
      "Не вдалося завантажити каталог. Перевірте, чи таблиця відкрита для перегляду за посиланням.";
  },
});
