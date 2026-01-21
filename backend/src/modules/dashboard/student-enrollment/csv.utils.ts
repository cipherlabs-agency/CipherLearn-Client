import { CSVStudentRow, CSVImportError } from "./types";

/**
 * Parse CSV content to array of student rows
 */
export function parseCSV(content: string): {
  rows: CSVStudentRow[];
  errors: CSVImportError[];
} {
  const lines = content.trim().split("\n");
  const rows: CSVStudentRow[] = [];
  const errors: CSVImportError[] = [];

  if (lines.length < 2) {
    errors.push({ row: 0, error: "CSV file must have a header row and at least one data row" });
    return { rows, errors };
  }

  // Parse header to get column indices
  const header = parseCSVLine(lines[0].toLowerCase());
  const columnMap = getColumnMapping(header);

  // Validate required columns exist
  const requiredColumns = ["firstname", "lastname", "email", "dob"];
  const missingColumns = requiredColumns.filter((col) => columnMap[col] === -1);
  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      error: `Missing required columns: ${missingColumns.join(", ")}`,
    });
    return { rows, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    try {
      const values = parseCSVLine(line);
      const row = mapRowToStudent(values, columnMap);

      // Validate row
      const validationErrors = validateStudentRow(row, i + 1);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
      } else {
        rows.push(row);
      }
    } catch (error: any) {
      errors.push({ row: i + 1, error: `Failed to parse row: ${error.message}` });
    }
  }

  return { rows, errors };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Map column headers to indices
 */
function getColumnMapping(
  header: string[]
): Record<string, number> {
  const mapping: Record<string, number> = {
    firstname: -1,
    middlename: -1,
    lastname: -1,
    email: -1,
    dob: -1,
    address: -1,
    batchid: -1,
  };

  header.forEach((col, index) => {
    const normalized = col.trim().toLowerCase().replace(/[_\s-]/g, "");

    // Map various column name variations
    if (normalized === "firstname" || normalized === "first" || normalized === "fname") {
      mapping.firstname = index;
    } else if (normalized === "middlename" || normalized === "middle" || normalized === "mname") {
      mapping.middlename = index;
    } else if (normalized === "lastname" || normalized === "last" || normalized === "lname") {
      mapping.lastname = index;
    } else if (normalized === "email" || normalized === "emailaddress" || normalized === "mail") {
      mapping.email = index;
    } else if (normalized === "dob" || normalized === "dateofbirth" || normalized === "birthdate" || normalized === "birthday") {
      mapping.dob = index;
    } else if (normalized === "address" || normalized === "addr" || normalized === "location") {
      mapping.address = index;
    } else if (normalized === "batchid" || normalized === "batch") {
      mapping.batchid = index;
    }
  });

  return mapping;
}

/**
 * Map row values to student object
 */
function mapRowToStudent(
  values: string[],
  columnMap: Record<string, number>
): CSVStudentRow {
  return {
    firstname: columnMap.firstname >= 0 ? values[columnMap.firstname] || "" : "",
    middlename: columnMap.middlename >= 0 ? values[columnMap.middlename] || "" : "",
    lastname: columnMap.lastname >= 0 ? values[columnMap.lastname] || "" : "",
    email: columnMap.email >= 0 ? values[columnMap.email] || "" : "",
    dob: columnMap.dob >= 0 ? values[columnMap.dob] || "" : "",
    address: columnMap.address >= 0 ? values[columnMap.address] || "" : undefined,
    batchId: columnMap.batchid >= 0 && values[columnMap.batchid]
      ? parseInt(values[columnMap.batchid], 10) || undefined
      : undefined,
  };
}

/**
 * Validate a student row
 */
function validateStudentRow(row: CSVStudentRow, rowNum: number): CSVImportError[] {
  const errors: CSVImportError[] = [];

  if (!row.firstname || row.firstname.trim() === "") {
    errors.push({ row: rowNum, email: row.email, error: "First name is required" });
  }

  if (!row.lastname || row.lastname.trim() === "") {
    errors.push({ row: rowNum, email: row.email, error: "Last name is required" });
  }

  if (!row.email || row.email.trim() === "") {
    errors.push({ row: rowNum, error: "Email is required" });
  } else if (!isValidEmail(row.email)) {
    errors.push({ row: rowNum, email: row.email, error: "Invalid email format" });
  }

  if (!row.dob || row.dob.trim() === "") {
    errors.push({ row: rowNum, email: row.email, error: "Date of birth is required" });
  } else if (!isValidDate(row.dob)) {
    errors.push({ row: rowNum, email: row.email, error: "Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY" });
  }

  return errors;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate and normalize date format
 */
function isValidDate(dateStr: string): boolean {
  // Try different date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/,   // DD-MM-YYYY
  ];

  return formats.some((format) => format.test(dateStr.trim()));
}

/**
 * Normalize date to YYYY-MM-DD format
 */
export function normalizeDateFormat(dateStr: string): string {
  const trimmed = dateStr.trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // MM/DD/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return trimmed;
}

/**
 * Generate sample CSV content for download
 */
export function generateSampleCSV(): string {
  const headers = "firstname,middlename,lastname,email,dob,address";
  const sampleRow = "John,William,Doe,john.doe@example.com,2000-01-15,123 Main St";

  return `${headers}\n${sampleRow}`;
}
