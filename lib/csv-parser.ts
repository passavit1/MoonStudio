import Papa from "papaparse";
import fs from "fs";
import * as XLSX from "xlsx";

export interface TikTokOrderRow {
  "Order ID": string;
  "Order Status": string;
  "SKU Subtotal After Discount": string;
  "Shipping Fee": string;
  "Order Amount": string;
  "Buyer Username": string;
  "Province": string;
  "Payment Method": string;
  "Created Time": string;
  "Paid Time": string;
  "Product Name": string;
  "Variation": string;
  "Quantity": string;
  "SKU ID": string;
  "SKU Unit Original Price": string;
  "SKU Platform Discount": string;
  "SKU Seller Discount": string;
}

export const parseTikTokCSV = (filePath: string): Promise<TikTokOrderRow[]> => {
  return new Promise((resolve, reject) => {
    try {
      // Check file extension to determine format
      const isXlsx = filePath.endsWith(".xlsx") || filePath.endsWith(".xlsm");

      if (isXlsx) {
        // Parse XLSX file - read the first sheet only
        try {
          const workbook = XLSX.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json<TikTokOrderRow>(worksheet);
          resolve(data);
        } catch (xlsxError) {
          reject(new Error(`Failed to parse XLSX file: ${filePath}. Error: ${(xlsxError as Error).message}`));
        }
      } else {
        // Parse CSV file
        const csvFile = fs.readFileSync(filePath, "utf8");
        Papa.parse(csvFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data as TikTokOrderRow[]);
          },
          error: (error: any) => {
            reject(error);
          },
        });
      }
    } catch (error) {
      reject(new Error(`Error processing file: ${filePath}. Error: ${(error as Error).message}`));
    }
  });
};

export const parseTikTokDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  // Remove timezone info like "(GMT+07:00)"
  const cleanedDate = dateStr.split(" (")[0].trim();

  // Parse DD/MM/YYYY HH:MM:SS format (with optional time)
  // Example: "12/03/2026 22:24:56" or "12/03/2026"
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s(\d{1,2}):(\d{2}):(\d{2}))?$/;
  const match = cleanedDate.match(dateRegex);

  if (match) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1, // JavaScript months are 0-indexed
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
    return isNaN(date.getTime()) ? null : date;
  }

  // Fallback for YYYY-MM-DD HH:MM:SS format (if data format changes)
  const date = new Date(cleanedDate);
  return isNaN(date.getTime()) ? null : date;
};

export const parseCurrency = (val: string): number => {
  if (!val) return 0;
  // Remove currency symbols and commas
  const cleaned = val.replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};
