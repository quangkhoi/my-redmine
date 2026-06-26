const TABLE_SCHEMA_URL = "data/tables.json";
const SCHEMA_STORAGE_KEY = "myRedmineTableSchema";

const elsSchema = {
  load: document.querySelector("#loadSchemaConfig"),
  save: document.querySelector("#saveSchemaConfig"),
  reset: document.querySelector("#resetSchemaConfig"),
  importBtn: document.querySelector("#importSchemaConfig"),
  exportBtn: document.querySelector("#exportSchemaConfig"),
  editor: document.querySelector("#schemaConfigEditor"),
  info: document.querySelector("#schemaConfigInfo"),
};

let schemaDefaults = null;

function initSchemaConfig() {
  elsSchema.load.addEventListener("click", loadSchemaConfig);
  elsSchema.save.addEventListener("click", saveSchemaConfig);
  elsSchema.reset.addEventListener("click", resetSchemaConfig);
  elsSchema.importBtn.addEventListener("click", importSchemaConfig);
  elsSchema.exportBtn.addEventListener("click", exportSchemaConfig);
}

function getActiveSchema() {
  const defaults = schemaDefaults || { tables: {}, totalTables: 0, server: "", database: "", fetchedAt: "" };
  const stored = localStorage.getItem(SCHEMA_STORAGE_KEY);
  if (!stored) {
    return defaults;
  }
  try {
    const override = JSON.parse(stored);
    return mergeSchema(defaults, override);
  } catch {
    return defaults;
  }
}

function mergeSchema(defaults, override) {
  const merged = {};
  merged.server = override.server || defaults.server;
  merged.database = override.database || defaults.database;
  merged.fetchedAt = override.fetchedAt || defaults.fetchedAt;
  merged.tables = Object.assign({}, defaults.tables);
  if (override.tables) {
    Object.keys(override.tables).forEach((name) => {
      merged.tables[name] = Object.assign({}, merged.tables[name] || {}, override.tables[name]);
    });
  }
  merged.totalTables = Object.keys(merged.tables).length;
  return merged;
}

function getSchemaOverride() {
  const stored = localStorage.getItem(SCHEMA_STORAGE_KEY);
  if (!stored) {
    return {};
  }
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function setSchemaOverride(data) {
  localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(data, null, 2));
}

function clearSchemaOverride() {
  localStorage.removeItem(SCHEMA_STORAGE_KEY);
}

async function loadSchemaConfig() {
  switchView("schema-config");
  setStatus("Loading schema data...");
  elsSchema.load.disabled = true;
  elsSchema.save.disabled = true;
  elsSchema.reset.disabled = true;
  elsSchema.editor.value = "Loading...";
  elsSchema.editor.readOnly = true;

  try {
    const response = await fetch(`${TABLE_SCHEMA_URL}?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — run scripts/fetch-mssql.mjs first to generate data/tables.json`);
    }
    schemaDefaults = await response.json();
    renderSchemaEditor();
    markLoadButtonAsReload(elsSchema.load);
    setStatus(`Loaded schema for ${schemaDefaults.totalTables} tables from ${TABLE_SCHEMA_URL}.`, "ok");
  } catch (error) {
    schemaDefaults = null;
    renderSchemaError(error.message);
    setStatus("Could not load schema data", "error");
  } finally {
    elsSchema.load.disabled = false;
  }
}

function renderSchemaEditor() {
  const override = getSchemaOverride();
  const hasOverride = Object.keys(override).length > 0 || localStorage.getItem(SCHEMA_STORAGE_KEY) !== null;

  if (hasOverride) {
    elsSchema.editor.value = JSON.stringify(override, null, 2);
    elsSchema.info.textContent = "Local override active";
  } else if (schemaDefaults) {
    elsSchema.editor.value = JSON.stringify(schemaDefaults, null, 2);
    elsSchema.info.textContent = `Defaults loaded (${schemaDefaults.totalTables} tables)`;
  } else {
    elsSchema.editor.value = "";
    elsSchema.info.textContent = "No data";
  }

  elsSchema.editor.readOnly = false;
  elsSchema.save.disabled = false;
  elsSchema.reset.disabled = false;
}

function renderSchemaError(message) {
  elsSchema.info.textContent = "Error";
  elsSchema.editor.value = message;
  elsSchema.editor.readOnly = true;
  elsSchema.save.disabled = true;
  elsSchema.reset.disabled = false;
}

function saveSchemaConfig() {
  const raw = elsSchema.editor.value.trim();
  if (!raw) {
    clearSchemaOverride();
    renderSchemaEditor();
    setStatus("Schema override cleared.", "ok");
    return;
  }
  try {
    const data = JSON.parse(raw);
    setSchemaOverride(data);
    renderSchemaEditor();
    setStatus("Schema override saved to localStorage.", "ok");
  } catch (error) {
    setStatus(`Invalid JSON: ${error.message}`, "error");
  }
}

function resetSchemaConfig() {
  clearSchemaOverride();
  if (schemaDefaults) {
    renderSchemaEditor();
    setStatus("Schema override cleared, defaults restored.", "ok");
  } else {
    elsSchema.editor.value = "";
    elsSchema.info.textContent = "No data";
    elsSchema.save.disabled = true;
    elsSchema.reset.disabled = true;
    setStatus("Schema override cleared.", "ok");
  }
}

function importSchemaConfig() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        JSON.parse(reader.result);
        elsSchema.editor.value = reader.result;
        setStatus(`Imported ${file.name}. Click Save to apply.`, "ok");
      } catch (error) {
        setStatus(`Invalid JSON file: ${error.message}`, "error");
      }
    });
    reader.readAsText(file);
  });
  input.click();
}

function exportSchemaConfig() {
  const content = elsSchema.editor.value.trim();
  if (!content) {
    setStatus("Nothing to export.", "error");
    return;
  }
  try {
    JSON.parse(content);
  } catch {
    setStatus("Cannot export — invalid JSON.", "error");
    return;
  }
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `table-schema-override-${formatTimestamp(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Schema override exported.", "ok");
}

initSchemaConfig();
