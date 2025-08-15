# HP CSV Cleanup Tool

A modern web application that replicates the functionality of the Excel VBA macro for cleaning HP CSV data.

## Features

This tool performs the same operations as your Excel macro:

1. **Removes the first row** (header cleanup)
2. **Deletes columns F and G**
3. **Filters for specific Dark Fiber types** in column 6:
   - "Dark Fiber - LH"
   - "Dark Fiber - Metro"
4. **Filters for target companies** in column 7, including:
   - Google (various entities)
   - Amazon (various entities)
   - Meta/Facebook
   - Microsoft
   - Akamai
   - And many more tech companies
5. **Inserts a new column D**
6. **Removes duplicates** based on column 3

## How to Use

### Option 1: Open in Browser (Recommended)
1. Simply open `index.html` in any modern web browser
2. Drag and drop your CSV file onto the upload area, or click to browse
3. Wait for processing to complete
4. Download the cleaned CSV file

### Option 2: Local Server (For Development)
If you want to run it on a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## File Structure

```
hp-csv-cleanup-tool/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript logic
└── README.md           # This file
```

## Browser Compatibility

This tool works in all modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Data Processing

The tool processes your CSV file entirely in the browser - no data is sent to any server. Your data remains private and secure.

## Output

After processing, you'll see:
- Statistics about the processing (original rows, filtered rows, duplicates removed)
- A preview of the cleaned data
- A download button for the final CSV file

## Troubleshooting

**File won't upload?**
- Make sure it's a valid CSV file
- Check that the file isn't too large (recommended: under 10MB)

**No results after filtering?**
- Check that your CSV has the expected column structure
- Verify that column 6 contains "Dark Fiber - LH" or "Dark Fiber - Metro"
- Verify that column 7 contains one of the target company names

**Download not working?**
- Make sure your browser allows downloads
- Check that you have sufficient disk space

## Technical Details

The tool uses:
- **FileReader API** for reading CSV files
- **Blob API** for creating downloadable files
- **Modern JavaScript (ES6+)** for data processing
- **CSS Grid and Flexbox** for responsive design

## Customization

To modify the target companies or filtering criteria, edit the `targetCompanies` array in `script.js`.

## License

This tool is provided as-is for internal use. Feel free to modify and adapt as needed. 