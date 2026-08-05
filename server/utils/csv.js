// Shared CSV builder — reused by any admin export feature so escaping rules
// (quotes, commas, embedded newlines) live in one place.
const escapeCSVField = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCSV = (rows, columns) => {
  const header = columns.map(({ label }) => escapeCSVField(label)).join(',');
  const lines = rows.map((row) => columns.map(({ key }) => escapeCSVField(row[key])).join(','));
  return [header, ...lines].join('\r\n');
};

module.exports = { toCSV, escapeCSVField };
