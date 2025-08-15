# Maintenance Schedule Date Comparator

A web-based tool for comparing reference dates and times against maintenance schedules with timezone support.

## Project Structure

The project has been refactored from a monolithic HTML file into a modular, maintainable structure:

```
dateconvert/
├── index.html              # Main HTML structure (clean, minimal)
├── css/
│   ├── main.css           # Core styles and layout
│   ├── themes.css         # Light/dark theme variables
│   ├── components.css     # Component-specific styles
│   └── responsive.css     # Media queries and mobile styles
├── js/
│   ├── utils.js           # Utility functions and constants
│   ├── dateProcessor.js   # Date parsing and comparison logic
│   ├── ui.js             # UI interactions and form handling
│   ├── themes.js         # Theme switching functionality
│   └── main.js           # Application initialization
└── assets/                # Future: icons, images, etc.
```

## File Descriptions

### HTML
- **`index.html`** - Clean HTML structure with external CSS/JS references

### CSS Files
- **`main.css`** - Core layout, typography, and basic component styles
- **`themes.css`** - CSS variables for light/dark themes and theme toggle button
- **`components.css`** - Specific component styles (reference groups, results, status indicators)
- **`responsive.css`** - Mobile and tablet responsive design

### JavaScript Files
- **`utils.js`** - Helper functions, timezone mapping, and formatting utilities
- **`dateProcessor.js`** - Core date parsing, comparison logic, and data processing
- **`ui.js`** - Form handling, time input validation, and results display
- **`themes.js`** - Theme switching and localStorage persistence
- **`main.js`** - Application initialization and default value setup

## Benefits of the New Structure

1. **Maintainability** - Each file has a single responsibility
2. **Readability** - Easier to find and modify specific functionality
3. **Reusability** - Components can be extracted for other projects
4. **Collaboration** - Multiple developers can work on different files
5. **Testing** - Individual modules can be tested in isolation
6. **Performance** - Better caching and loading strategies possible

## Development Workflow

### Adding New Features
1. **UI Changes** - Modify `components.css` or `responsive.css`
2. **New Logic** - Add to appropriate JS file or create new module
3. **Theme Updates** - Modify `themes.css` variables
4. **Layout Changes** - Update `main.css`

### Debugging
- Check browser console for JavaScript errors
- Use browser dev tools to inspect CSS
- Each file can be loaded independently for testing

### Future Enhancements
- Add build process (Webpack/Vite) for production optimization
- Implement CSS/JS minification
- Add source maps for debugging
- Consider component-based architecture for larger features

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS Grid and Flexbox for layout
- CSS Custom Properties (variables) for theming
- LocalStorage for theme persistence

## Dependencies

No external dependencies - pure HTML, CSS, and JavaScript.
