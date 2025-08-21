// Utility functions for date formatting

/**
 * Formats a datetime string from "2025-10-31T17:05" to "31-10-2025 17:05"
 * @param dateTimeString - The datetime string to format
 * @returns Formatted datetime string or empty string if invalid
 */
export const formatDateTime = (dateTimeString: string | null | undefined): string => {
  if (!dateTimeString) return '';
  
  try {
    // Handle both ISO format and datetime-local format
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return ''; // Return empty if invalid
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    return ''; // Return empty if error
  }
};

/**
 * Formats a date string to DD-MM-YYYY format
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    return '';
  }
};