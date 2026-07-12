/* =========================================================
   Підвантаження новин з Google Таблиці (CSV-експорт)
   Очікувані колонки: Назва | Опис | Зображення
   "Зображення" — назва файлу картинки з папки /images
   (наприклад "1.png"), а не посилання на Google Drive.
   ========================================================= */

// ID таблиці з посилання, яке ти надіслав.
// Якщо новини лежать не на першому аркуші — зміни gid=0
// на потрібний (його видно в URL таблиці після "gid=").
const SHEET_ID = "1TTxAwvubYbyZ8tVgaZktnGlHLP1RIjdUeBzb4MRPdDs";
const SHEET_GID = "0";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const IMAGES_FOLDER = "images/";

const stateEl = document.getElementById("news-state");
const gridEl = document.getElementById("news-grid");
const countEl = document.getElementById("news-count");

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function renderNews(rows) {
  const items = rows.filter((r) => (r["Назва"] || "").trim() !== "");

  if (items.length === 0) {
    stateEl.textContent = "Поки що немає жодної новини.";
    return;
  }

  countEl.textContent = `№ 001 — ${String(items.length).padStart(3, "0")}`;

  const html = items
    .map((row, i) => {
      const title = escapeHtml(row["Назва"]);
      const desc = escapeHtml(row["Опис"]);
      const imgName = (row["Зображення"] || "").trim();
      const cardNo = String(i + 1).padStart(3, "0");

      const imageBlock = imgName
        ? `<img class="card-img" src="${IMAGES_FOLDER}${encodeURIComponent(imgName)}" alt="${title}" loading="lazy" onerror="this.outerHTML='<div class=&quot;card-img placeholder&quot;>зображення відсутнє</div>'">`
        : `<div class="card-img placeholder">без зображення</div>`;

      return `
        <article class="catalog-card">
          <span class="card-no">№ ${cardNo}</span>
          ${imageBlock}
          <h3>${title}</h3>
          <p>${desc}</p>
        </article>
      `;
    })
    .join("");

  gridEl.innerHTML = html;
  gridEl.hidden = false;
  stateEl.hidden = true;
}

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    if (!results.data || results.data.length === 0) {
      stateEl.textContent = "Не вдалося знайти дані в таблиці.";
      return;
    }
    renderNews(results.data);
  },
  error: () => {
    stateEl.textContent =
      "Не вдалося завантажити новини. Перевірте, чи таблиця відкрита для перегляду за посиланням.";
  },
});
