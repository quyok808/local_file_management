let paths = [];
let activePaths = [];
let isSaved = true;

function updateSaveStatus(saved) {
  const el = document.getElementById("saveStatus");
  isSaved = saved;

  if (saved) {
    el.textContent = "✅ Đã lưu";
    el.style.color = "green";
  } else {
    el.textContent = "⚠️ Chưa lưu";
    el.style.color = "orange";
  }
}

setInterval(async () => {
  const res = await fetch("/api/is-open");
  const data = await res.json(); // [{filePath, isOpen}, ...]
  activePaths = data.filter((f) => f.isOpen).map((f) => f.filePath);
  render();
}, 3000);

function normalizePath(p) {
  if (!p) return "";
  p = p.replaceAll("\\", "/");
  if (/^[A-Za-z]:[^/]/.test(p)) {
    p = p[0] + ":/" + p.slice(2);
  }
  return p;
}

async function loadPaths() {
  const res = await fetch("/api/paths");
  paths = await res.json();
  render();
}

function render() {
  const tbody = document.querySelector("#pathTable tbody");
  tbody.innerHTML = paths
    .map(
      (p, i) => `
        <tr class="${activePaths.includes(p.path) ? "active" : ""}">
          <td>${p.name}</td>
          <td>${p.path}</td>
          <td>${p.lastOpened || "—"}</td>
          <td>
            <button 
              onclick="openPath('${p.path}')"
              ${activePaths.includes(p.path) ? "disabled" : ""}
            >▶️ Mở</button>

            <button 
              onclick="removePath(${i})"
              ${activePaths.includes(p.path) ? "disabled" : ""}
            >❌ Xóa</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function addPath() {
  const nameInput = document.getElementById("name");
  const pathInput = document.getElementById("path");
  const name = nameInput.value.trim();
  let p = pathInput.value.trim();
  if (!name || !p) return alert("Nhập đủ tên và đường dẫn!");
  p = normalizePath(p);
  paths.push({ name, path: p });
  render();
  updateSaveStatus(false);
  nameInput.value = "";
  pathInput.value = "";
  nameInput.focus();
}

async function savePaths(showAlert = true) {
  await fetch("/api/paths", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paths),
  });

  updateSaveStatus(true);
  if (showAlert) alert("✅ Đã lưu!");
}

async function openPath(path) {
  const res = await fetch("/api/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  const data = await res.json();

  if (data.ok) {
    if (!activePaths.includes(path)) activePaths.push(path);

    const found = paths.find((x) => x.path === path);
    if (found) {
      found.lastOpened = new Date().toLocaleString();
      await savePaths(false);
    }

    render();
  } else {
    alert("❌ Lỗi: " + data.error);
  }
}

function closeFile(path) {
  activePaths = activePaths.filter((x) => x !== path);
  render();
}

function removePath(i) {
  if (!confirm("Bạn có chắc muốn xóa mục này?")) return;
  paths.splice(i, 1);
  render();
  updateSaveStatus(false);
}

async function importJSON() {
  const fileInput = document.getElementById("jsonFile");
  const file = fileInput.files[0];
  if (!file) return alert("Chọn file JSON trước!");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/import-json", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();

  if (data.ok) {
    paths = await (await fetch("/api/paths")).json();

    paths = paths.map((p) => ({ ...p, path: normalizePath(p.path) }));

    render();
    updateSaveStatus(false);
    alert(`✅ Đã import ${data.added} mục (đã chuẩn hoá path)`);
    fileInput.value = "";
  } else {
    alert("❌ Lỗi: " + data.error);
  }
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(paths, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "paths_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

loadPaths();
