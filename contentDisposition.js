// contentDisposition.js
const FILENAME_EXT_VALUE_PATTERN = /(?<charset>[^']+)'(?<lang>[a-z]{2,8}(?:-[a-z0-9-]+)?)?'(?<filename>.+)/i;
const FILENAME_VALUE_CHARS_PATTERN = /(%[a-f0-9]{2}|[a-z0-9!#$&+.^_`|~-])+/i;
const QUOTE = '"';
const BACK_SLASH = '\\';

function encodeAsciiFileName(fileName) {
  if (!fileName || (!fileName.includes(QUOTE) && !fileName.includes(BACK_SLASH))) {
    return fileName;
  }
  return fileName.replace(/(["\\])/g, '\\$1');
}

function isFilenameValueCharsEncoded(value) {
  return FILENAME_VALUE_CHARS_PATTERN.test(value);
}

function parseHttpDate(dateStr) {
  const timestamp = Date.parse(dateStr);
  return isNaN(timestamp) ? null : new Date(timestamp);
}

function validate(header) {
  const result = {
    type: null,
    fileName: null,
    creationDate: null,
    modificationDate: null,
    readDate: null,
    size: -1,
    encoded: false,
    params: {},
  };

  if (typeof header !== 'string') {
    result.params['header'] = { value: header, error: 'Header must be a string' };
    return result;
  }

  const parts = header.split(';').map(p => p.trim());
  result.type = parts.shift().toLowerCase();

  const params = {};
  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const key = part.substring(0, eqIndex).trim().toLowerCase();
    let value = part.substring(eqIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    params[key] = { value, error: null };
  }

  // File name logic
  const fileName = params['filename']?.value;
  const fileNameExt = params['filename*']?.value;
  if (params.hasOwnProperty('filename*')) {
    const match = FILENAME_EXT_VALUE_PATTERN.exec(fileNameExt);
    if (match && match.groups) {
      const { charset, lang, filename } = match.groups;
      result.encoded = true;
      if (isFilenameValueCharsEncoded(filename)) {
        result.fileName = fileNameExt;
      } else if (charset.toLowerCase() === 'utf-8') {
        result.fileName = `${charset}'${lang || ''}'${encodeURIComponent(filename)}`;
      } else {
        params['filename*'].error = `Unsupported charset: ${charset}`;
      }
    } else {
      params['filename*'].error = `Unsupported filename* format: ${fileNameExt}`;
    }
  } else {
    result.fileName = encodeAsciiFileName(fileName || null);
  }

  // Date fields
  const dateFields = ['creation-date', 'modification-date', 'read-date'];
  for (const field of dateFields) {
    if (params[field]?.value) {
      const date = parseHttpDate(params[field].value);
      if (date) {
        result[camelCase(field)] = date;
      } else {
        params[field].error = `Invalid date format for ${field}: ${params[field].value}`;
      }
    }
  }

  // Size
  if (params['size']?.value) {
    const size = parseInt(params['size'].value, 10);
    if (!isNaN(size)) {
      result.size = size;
    } else {
      params['size'].error = `Invalid size: ${params['size'].value}`;
    }
  }

  result.params = params;
  return result;
}

function camelCase(str) {
  return str.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
}

module.exports = {
  validate
};
