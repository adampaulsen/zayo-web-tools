# Embargo High Cleanup Tool

A web-based CSV processing tool designed to clean and filter Dark Fiber data with FSB report enhancement.

## Overview

This tool is based on the HP CSV Cleanup Tool but specifically modified for Embargo High processing requirements. It focuses on Dark Fiber items and enhances the data with Service Component (SC) information from FSB reports.

## Key Features

- **Complete Data Processing**: Processes all rows from input CSV files
- **Dark Fiber Identification**: Identifies items containing "Dark Fiber" (case-insensitive) for special processing
- **FSB Report Integration**: Extracts SC numbers or Service Names for Dark Fiber rows only, based on DFID matching
- **Column Management**: 
  - Removes header row
  - Deletes columns F and G
  - Inserts new column D with Excel formulas
  - Adds new "SC or Service" column between Network Facility and Product Group
- **Duplicate Removal**: Eliminates duplicate entries based on DFID
- **Excel-Ready Output**: Generates CSV with proper Excel formulas

## How It Works

1. **Upload FSB Report**: First, upload an FSB report CSV file (required)
2. **Upload CSV Files**: Upload one or more CSV files to process
3. **Automatic Processing**: The tool automatically:
   - Processes all rows from input files
   - Identifies Dark Fiber items for special processing
   - Matches DFIDs with the FSB report for Dark Fiber rows only
   - Extracts SC numbers or Service Names for Dark Fiber rows
   - Populates the new "SC or Service" column (empty for non-Dark Fiber rows)
4. **Download Results**: Download the cleaned CSV with all data and Dark Fiber enhancements

## Expected File Formats

### Input CSV Files
- Should have Dark Fiber ID in column C (DFID)
- Column 6 should contain product type information
- Multiple files can be processed simultaneously

### FSB Report File
- Must have at least 9 columns
- Dark Fiber ID should be in column B
- Service Component information in column E
- Customer Service information in column D
- Status information in column I

## Output Structure

The final CSV contains these columns:
1. Sheath
2. Fiber
3. DFID
4. SO Facility/Circuit ID | DFID (Excel formula)
5. SO Facility/Circuit ID
6. Network Facility
7. SC or Service (new column)
8. Product Group
9. Customer

## Usage Notes

- The FSB report must be uploaded before processing CSV files
- The tool processes all rows but only enhances Dark Fiber items with SC/Service information
- Non-Dark Fiber rows will have empty "SC or Service" columns
- Duplicate DFIDs are automatically removed
- Excel formulas are included for easy data manipulation

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- No server-side processing required - runs entirely in the browser

## File Naming

Downloaded files are automatically named with:
- `embargo_high_cleaned_` prefix
- Original filename (if single file) or combined names (if multiple files)
- Timestamp suffix
- `.csv` extension
