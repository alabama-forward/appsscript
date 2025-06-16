# Apps Script Field Coordination Tools

This repository contains two Google Apps Script applications designed for field coordination and budget analysis. These tools demonstrate how to build sophisticated business applications using Google Sheets as databases and Apps Script for automation.

## Overview

### Field Coordination Browser
A web-based application that transforms Google Sheets into an interactive coordination system. Users can browse, search, and claim field assignments through a user-friendly interface.

**Key Features:**
- Web-based interface for easy access
- Real-time search and filtering
- Claim management system
- Email notifications
- Mobile responsive design

### FieldPlan Analyzer
An automated analysis system that processes form submissions, analyzes budgets against field plans, and generates detailed email reports.

**Key Features:**
- Automated data processing
- Budget vs. actual analysis
- Cost-per-attempt calculations
- Scheduled email reports
- Missing data alerts

## Documentation

Full documentation is available at: [GitHub Pages URL]/appsscript

- [For End Users](docs/end-users/) - Learn how to use the applications
- [For Developers](docs/developers/) - Technical documentation for customization
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [FAQ](docs/faq.md) - Frequently asked questions

## Quick Start

### For End Users

1. Get the web app URL from your administrator
2. Sign in with your Google account
3. Start using the applications immediately

### For Developers

1. Open Google Apps Script editor
2. Create a new project
3. Copy the relevant source files
4. Configure your spreadsheet IDs and settings
5. Deploy as web app

## Project Structure

```
appsscript/
├── field_coordination_browser/
│   ├── src/
│   │   ├── Code.gs              # Server-side logic
│   │   ├── index.html           # Main HTML interface
│   │   ├── client-side.html     # Client JavaScript
│   │   └── styles.html          # CSS styling
│   └── developing/
│       └── (development files)
│
├── fieldplan_analyzer/
│   ├── src/
│   │   ├── budget_class.js      # Budget data model
│   │   ├── field_plan_parent_class.js
│   │   ├── budget_trigger_functions.js
│   │   └── field_trigger_functions.js
│   └── docs/
│       └── (documentation)
│
└── docs/                         # GitHub Pages documentation
    ├── _end_users/
    ├── _developers/
    └── (documentation files)
```

## Key Technologies

- **Google Apps Script**: Server-side JavaScript platform
- **HTML Service**: For web app creation
- **Google Sheets API**: Database functionality
- **Gmail Service**: Email notifications
- **Time-based Triggers**: Automation

## Requirements

- Google account
- Access to Google Sheets
- Modern web browser
- JavaScript knowledge (for developers)

## Configuration

### Essential Settings

1. **Spreadsheet Setup**
   - Create required sheets (see documentation)
   - Set up column headers
   - Configure permissions

2. **Script Properties**
   ```javascript
   // Store configuration securely
   PropertiesService.getScriptProperties().setProperties({
     'SPREADSHEET_ID': 'your-spreadsheet-id',
     'EMAIL_RECIPIENTS': 'email1@example.com,email2@example.com',
     'TIMEZONE': 'America/New_York'
   });
   ```

3. **Deploy Settings**
   - Execute as: User accessing the web app
   - Who has access: Anyone in your organization

## Security Considerations

- All data stays within your Google Workspace
- User authentication via Google accounts
- Configurable access permissions
- Audit logging capabilities
- No external dependencies

## Limitations

Google Apps Script has quotas:
- Execution time: 6 minutes per run
- Email: 100/day (consumer), 1,500/day (Workspace)
- Triggers: 20 per script
- URL Fetch calls: 20,000/day

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

Please ensure:
- Code follows existing patterns
- Documentation is updated
- No hardcoded credentials
- Proper error handling

## Support

- Check the [documentation](docs/)
- Review [FAQ](docs/faq.md)
- See [Troubleshooting](docs/troubleshooting.md)
- Contact your administrator

## License

This project is provided as-is for educational and reference purposes. Customize and use according to your organization's needs.

## Acknowledgments

Built with Google Apps Script and designed to demonstrate the power of Google Workspace automation.

---

**Note**: Remember to update all placeholder values (spreadsheet IDs, email addresses, etc.) with your actual configuration before deploying.