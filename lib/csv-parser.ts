import Papa from "papaparse";
import fs from "fs";

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
  const csvFile = fs.readFileSync(filePath, "utf8");
  return new Promise((resolve, reject) => {
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
  });
};

export const parseTikTokDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  // TikTok dates are often in format: "2024-03-01 10:00:00"
  // Sometimes they have a "(GMT+07:00)" suffix which Date constructor might not like
  const cleanedDate = dateStr.split(" (")[0].trim();
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
