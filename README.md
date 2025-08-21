# Zayo Web Tools Collection

A comprehensive collection of web-based tools for various tasks including data processing, time calculations, and utility functions.

## 🛠️ Available Tools

### 1. **Zayo CID Extractor** (`cidextractor/`)
- **Purpose**: Extract Zayo Circuit IDs from text
- **Features**: 
  - Automatically detects Zayo CIDs ending with `/ZYO`
  - Handles various formats: `IDIA/343375//ZYO`, `ELAN/178878/N01/ZYO`, etc.
  - Export to CSV functionality
  - Copy to clipboard
- **Usage**: Paste text containing CIDs and click "Extract IDs"

### 2. **Splice Point Text Formatter** (`textformatter/`)
- **Purpose**: Format and clean text data
- **Features**: Text cleaning, formatting, and transformation tools

### 3. **Timezone Converter** (`timezones/`)
- **Purpose**: Convert times between different timezones
- **Features**: Multi-timezone support and conversion utilities

### 4. **Date Converter** (`dateconvert/`)
- **Purpose**: Convert dates between different formats
- **Features**: Date parsing, formatting, and conversion tools

### 5. **Browser Extensions** (`extensions/`)
- **Purpose**: Browser extension tools and utilities
- **Features**: Various browser enhancement tools

### 6. **SF Lookup** (`sflookup/`)
- **Purpose**: Salesforce lookup and search tools
- **Features**: Data lookup and search functionality

### 7. **Business Days Calculator** (`businessdays/`)
- **Purpose**: Calculate business days between dates
- **Features**: Excludes weekends and holidays

### 8. **HP CSV Cleanup Tool** (`hp-csv-cleanup-tool/`)
- **Purpose**: Clean and format HP CSV data
- **Features**: Data cleaning and formatting for HP systems

### 9. **Embargo High Cleanup Tool** (`embargo-high-cleanup-tool/`)
- **Purpose**: Process Dark Fiber CSV data with FSB report enhancement
- **Features**: 
  - Processes all CSV rows while identifying Dark Fiber items
  - Extracts SC numbers or Service Names from FSB reports
  - Adds new "SC or Service" column for enhanced data
  - Maintains all original data with selective Dark Fiber enhancement

### 10. **DP Tool** (`dptool/`)
- **Purpose**: Data processing tool
- **Features**: Various data processing utilities

### 11. **Compare Tool** (`compare/`)
- **Purpose**: Compare data sets or files
- **Features**: Data comparison and analysis

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adampaulsen/zayo-web-tools.git
   cd zayo-web-tools
   ```

2. **Open any tool**:
   - Navigate to the specific tool directory
   - Open the `index.html` file in your web browser
   - Or serve the directory with a web server

3. **Serve locally** (optional):
   ```bash
   python3 -m http.server 8080
   # Then open http://localhost:8080 in your browser
   ```

## 📁 Project Structure

```
zayo-web-tools/
├── README.md
├── cidextractor/
│   └── index.html          # Zayo CID Extractor
├── textformatter/
│   └── index.html          # Text formatting tools
├── timezones/
│   └── index.html          # Timezone converter
├── dateconvert/
│   └── index.html          # Date converter
├── extensions/
│   └── index.html          # Browser extensions
├── sflookup/
│   └── index.html          # Salesforce lookup
├── businessdays/
│   └── index.html          # Business days calculator
├── hp-csv-cleanup-tool/
│   └── index.html          # HP CSV cleanup
├── embargo-high-cleanup-tool/
│   └── index.html          # Embargo High Cleanup Tool
├── dptool/
│   └── index.html          # Data processing tool
└── compare/
    └── index.html          # Comparison tool
```

## 🔧 Development

- All tools are built with vanilla HTML, CSS, and JavaScript
- No external dependencies required
- Responsive design for mobile and desktop use
- Dark/light theme support in most tools

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Support

For issues or questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include steps to reproduce the problem

---

**Last Updated**: August 21, 2025
**Version**: 1.0.0
