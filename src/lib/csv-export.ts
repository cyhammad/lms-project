/**
 * CSV Export Utility
 * Provides functions to convert data arrays to CSV format and trigger downloads
 */

/**
 * Escapes a value for CSV format
 * Handles commas, quotes, and newlines
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Converts an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers. If not provided, uses object keys
 * @returns CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Determine headers
  let csvHeaders: { key: keyof T; label: string }[];
  
  if (headers) {
    csvHeaders = headers;
  } else {
    // Use all keys from first object as headers
    const firstObject = data[0];
    csvHeaders = Object.keys(firstObject).map(key => ({
      key: key as keyof T,
      label: key,
    }));
  }

  // Create header row
  const headerRow = csvHeaders.map(h => escapeCSVValue(h.label)).join(',');

  // Create data rows
  const dataRows = data.map(item => {
    return csvHeaders.map(header => {
      const value = item[header.key];
      return escapeCSVValue(value);
    }).join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Downloads data as a CSV file
 * @param data Array of objects to download
 * @param filename Name of the file (without .csv extension)
 * @param headers Optional custom headers
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  const csv = convertToCSV(data, headers);
  
  if (!csv) {
    console.warn('No data to export');
    return;
  }

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}
