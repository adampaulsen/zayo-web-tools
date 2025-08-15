# SFAST - SalesForce Automation Search Tool

A modern, accessible web application for generating and managing SalesForce search URLs efficiently.

## 🚀 Features

### Core Functionality
- **Bulk URL Generation**: Convert multiple DFIDs or data values into SalesForce search URLs
- **Smart Parsing**: Automatically handles comma-separated and line-separated input
- **Batch Operations**: Open all generated URLs simultaneously in new browser tabs
- **Input Validation**: Comprehensive error checking and user feedback

### User Experience
- **Modern UI**: Clean, responsive design with smooth animations
- **Keyboard Shortcuts**: Power-user features for efficient navigation
- **Loading States**: Visual feedback during operations
- **Error Handling**: Clear error messages and validation feedback
- **Success Notifications**: Confirmation messages for completed actions

### Accessibility
- **Screen Reader Support**: Full ARIA compliance and screen reader announcements
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast Support**: Automatic adaptation to user preferences
- **Reduced Motion**: Respects user motion preferences
- **Focus Management**: Clear visual focus indicators

### Technical Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern JavaScript**: ES6+ features with class-based architecture
- **External Resources**: Separated CSS and JavaScript for maintainability
- **Performance Optimized**: Efficient DOM manipulation and event handling
- **Cross-browser Compatible**: Works in all modern browsers

## 🎯 Use Cases

- **Sales Teams**: Quickly search multiple customer records or opportunities
- **Support Staff**: Efficiently look up multiple case numbers or ticket IDs
- **Administrators**: Bulk operations on user accounts or system records
- **Data Analysts**: Process large datasets for SalesForce queries

## 🛠️ Installation & Usage

### Quick Start
1. Open `index.html` in any modern web browser
2. Enter your data (comma or line separated)
3. Click "Generate URLs" to create SalesForce search links
4. Use "Open All URLs" to launch searches in new tabs
5. Clear results when finished

### File Structure
```
sflookup/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

### Browser Requirements
- **Chrome**: Version 60+
- **Firefox**: Version 55+
- **Safari**: Version 12+
- **Edge**: Version 79+

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|---------|
| `Ctrl + Enter` | Generate URLs |
| `Ctrl + K` | Focus input field |
| `Ctrl + O` | Open all URLs |
| `Ctrl + C` | Clear results |

## 🎨 Customization

### Colors
The application uses a consistent orange theme (`#f48120`) that can be easily modified in `styles.css`:

```css
:root {
    --primary-color: #f48120;
    --primary-dark: #e0701a;
    --secondary-color: #6c757d;
}
```

### SalesForce URL
To change the base SalesForce URL, modify the `baseUrl` property in `script.js`:

```javascript
this.baseUrl = 'https://your-instance.my.salesforce.com/_ui/search/ui/UnifiedSearchResults?searchType=2&str=';
```

## 🔧 Development

### Architecture
- **HTML**: Semantic markup with ARIA attributes
- **CSS**: Modern CSS with CSS Grid, Flexbox, and custom properties
- **JavaScript**: ES6+ class-based architecture with event-driven design

### Key Classes
- **SFAST**: Main application class handling all functionality
- **Event Management**: Comprehensive event binding and handling
- **Accessibility**: Built-in screen reader and keyboard support
- **Validation**: Input validation with user feedback

### Adding Features
1. **New Functions**: Add methods to the SFAST class
2. **UI Elements**: Update HTML and corresponding CSS
3. **Event Handlers**: Bind new events in the `bindEvents()` method
4. **Accessibility**: Ensure new features include proper ARIA attributes

## ♿ Accessibility Features

### Screen Reader Support
- ARIA labels and descriptions for all interactive elements
- Live regions for dynamic content updates
- Proper heading hierarchy and document structure
- Screen reader announcements for user actions

### Keyboard Navigation
- Tab order follows logical document flow
- All interactive elements are keyboard accessible
- Visual focus indicators for keyboard users
- Keyboard shortcuts for power users

### Visual Accessibility
- High contrast mode support
- Reduced motion preferences respected
- Clear visual feedback for all states
- Responsive design for various screen sizes

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+ (Full feature set)
- **Tablet**: 768px - 1199px (Optimized layout)
- **Mobile**: 320px - 767px (Touch-friendly interface)

### Mobile Optimizations
- Touch-friendly button sizes
- Simplified layouts for small screens
- Optimized text sizing and spacing
- Mobile-first responsive approach

## 🚀 Performance

### Optimizations
- Efficient DOM manipulation
- Debounced input handling
- Minimal reflows and repaints
- Optimized event handling

### Loading States
- Visual feedback during operations
- Disabled states to prevent double-clicks
- Progress indicators for long operations
- Graceful error handling

## 🔒 Security

### Best Practices
- No external dependencies or CDN links
- Input sanitization and validation
- Secure URL generation with proper encoding
- No sensitive data storage

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All accessibility features are maintained
- Code follows existing patterns
- Tests are added for new functionality
- Documentation is updated

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify browser compatibility
3. Ensure JavaScript is enabled
4. Check file paths and structure

---

**SFAST** - Making SalesForce searches faster and more efficient! 🔍
