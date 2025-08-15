# Text Formatter - Splice Point Tool

A web-based tool designed to format Splice Point summaries for better readability. This tool converts inline, slash-separated text into a clean, line-by-line format.

## Features

- **Smart Text Parsing**: Automatically detects and formats Splice Point summary text
- **Preserves Headers**: Keeps header information like "Splice Point(s):" and status counts intact
- **Clean Output**: Converts slash-separated items into individual lines
- **Dark/Light Theme**: Toggle between light and dark themes
- **Copy to Clipboard**: One-click copying of formatted text
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Use Ctrl+Enter to format text quickly

## How It Works

The tool processes text in the following way:

1. **Header Lines**: Lines containing "Splice Point(s):" or bracket notation are preserved as-is
2. **Summary Lines**: Lines starting with "Summary:" are processed to extract individual items
3. **Item Separation**: Items separated by " / " are split into individual lines
4. **Cleanup**: Trailing slashes and extra whitespace are automatically removed

## Input Format

The tool expects text in this format:

```
6 Splice Point(s):
[0 Embargoed] / [2 High Profile]

Summary:SPLICE-172048 - Active - MEEC / SPLICE-189663 - Active - MEEC / SPLICE-172934 - Active / SPLICE-017914 - Active (High Profile) / SPLICE-022640 - Active (High Profile) / SPLICE-093158 - Active /
```

## Output Format

The tool produces clean, formatted output:

```
6 Splice Point(s):
[0 Embargoed] / [2 High Profile]

SPLICE-172048 - Active - MEEC
SPLICE-189663 - Active - MEEC
SPLICE-172934 - Active
SPLICE-017914 - Active (High Profile)
SPLICE-022640 - Active (High Profile)
SPLICE-093158 - Active
```

## Usage

1. **Paste Text**: Copy your Splice Point summary text and paste it into the input field
2. **Format**: Click the "Format Text" button or use Ctrl+Enter
3. **Copy Result**: Use the "Copy Formatted Text" button to copy the result to your clipboard
4. **Clear**: Use "Clear All" to reset both input and output fields

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- Fallback clipboard support for older browsers

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript
- **No Dependencies**: Lightweight and fast
- **Local Storage**: Theme preference is saved locally
- **Responsive**: Mobile-first design approach
- **Accessibility**: Keyboard navigation and screen reader friendly

## File Structure

```
textformatter/
├── index.html      # Main HTML file
├── styles.css      # CSS styling and themes
├── script.js       # JavaScript functionality
└── README.md       # This documentation
```

## Customization

The tool can be easily customized by modifying:

- **CSS Variables**: Theme colors and styling in `styles.css`
- **Formatting Logic**: Text processing rules in `script.js`
- **UI Elements**: Layout and components in `index.html`

## License

© 2025 Raylos - All rights reserved.
