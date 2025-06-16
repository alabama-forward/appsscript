---
layout: default
title: Frequently Asked Questions
---

# Frequently Asked Questions

## General Questions

### What is Google Apps Script?

Google Apps Script is a cloud-based JavaScript platform that allows you to extend and automate Google Workspace applications like Sheets, Docs, and Gmail. It runs on Google's servers, requires no installation, and integrates seamlessly with Google services.

### Do I need programming experience to use these applications?

**As an end user**: No, you don't need any programming knowledge. The applications are designed with user-friendly interfaces.

**As a developer**: Yes, you'll need JavaScript knowledge to customize or build your own versions.

### Are these applications free to use?

The applications themselves are free, but they operate within Google's quotas:
- Gmail: 100 emails/day (consumer), 1,500 emails/day (Workspace)
- Triggers: 20 triggers per script
- Execution time: 6 minutes per execution
- Total runtime: 6 hours/day (consumer), 30 hours/day (Workspace)

### How secure is my data?

Your data remains within your Google account:
- Only authorized users can access the applications
- Data stays in your Google Sheets
- Google's security infrastructure protects everything
- No data is stored outside Google's ecosystem

## Field Coordination Browser Questions

### How do I access the Field Coordination Browser?

1. Get the web app URL from your administrator
2. Bookmark it for easy access
3. Sign in with your Google account
4. The app will load automatically

### Why can't I see any data?

Possible reasons:
- You don't have permission to view the spreadsheet
- The data hasn't been loaded yet (refresh the page)
- There's no data matching your filters
- You're not logged into the correct Google account

### How do claims work?

When you claim an item:
1. It's immediately marked with your email
2. Others can no longer claim it
3. You receive an email confirmation
4. The claim appears in your active claims list

### Can I unclaim an item?

Yes, you can release claims:
- Find the item in your claimed list
- Click "Release" or "Unclaim"
- The item becomes available again
- You'll receive a confirmation

### What happens if two people claim simultaneously?

The system uses locking to prevent double claims:
- First person to click gets the claim
- Second person sees "Already claimed" message
- The page updates to show current status

### How often does data update?

- **Real-time**: Claims and releases
- **Near real-time**: Most data changes
- **Manual refresh**: Click refresh or reload page

## FieldPlan Analyzer Questions

### How does automated analysis work?

The analyzer:
1. Checks for new submissions every 12 hours
2. Matches budgets with field plans
3. Calculates cost metrics
4. Sends email reports automatically

### When will I receive analysis emails?

- **New field plans**: Within 12 hours of submission
- **Budget analysis**: Within 12 hours after matching field plan found
- **Weekly summary**: Every Monday at 9 AM

### What if I don't receive expected emails?

Check:
1. Your spam/junk folder
2. Email address is correct in the system
3. You're on the recipient list
4. Email quotas haven't been exceeded

### How are cost-per-attempt targets determined?

Targets are based on:
- Historical data analysis
- Industry benchmarks
- Efficiency goals
- Regional variations

Current default ranges:
- Door Knocking: $4.50 - $6.00 per attempt
- Phone Banking: $2.00 - $3.50 per attempt
- Text Banking: $0.15 - $0.30 per attempt

### What does "confidence level" mean?

Confidence level (1-10) indicates how prepared an organization is:
- **8-10**: High confidence, minimal support needed
- **6-7**: Moderate confidence, light coaching recommended
- **4-5**: Low confidence, regular support needed
- **1-3**: Very low confidence, intensive coaching required

### How is the funding gap calculated?

Funding gap = Total project cost - Current funding - Requested amount

Example:
- Project cost: $100,000
- Current funding: $60,000
- Requested: $30,000
- Gap: $10,000

## Technical Questions

### What browsers are supported?

Modern browsers work best:
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome)

Internet Explorer is NOT supported.

### Can I access from my phone?

Yes, both applications are mobile-responsive:
- Use your mobile browser
- Sign in with Google account
- Interface adapts to screen size
- All features available

### How much data can the system handle?

Practical limits:
- Spreadsheet: 10 million cells
- Reasonable performance: ~50,000 rows
- Web display: Best with pagination for >1,000 items

### Can I export data?

Yes, several ways:
- Download spreadsheet directly
- Use "Export" features in the app
- Copy/paste from displays
- Generate CSV reports

### Is offline access available?

No, these are cloud-based applications requiring internet access. However:
- You can download spreadsheets for offline viewing
- Some browsers cache recent data
- Consider Google Sheets offline mode for backup access

## Developer Questions

### How do I get started with development?

1. Learn JavaScript basics
2. Complete Google Apps Script tutorials
3. Copy our code as a starting point
4. Modify for your needs
5. Test thoroughly before deploying

### Can I modify the existing code?

Yes, the code is meant to be customized:
- Make a copy of the script
- Modify as needed
- Test in a separate environment
- Deploy your version

### What are the main customization points?

Common customizations:
- Spreadsheet column mappings
- Email templates and recipients
- Business logic and calculations
- UI styling and layout
- Trigger schedules

### How do I handle errors in my code?

Best practices:
```javascript
try {
  // Your code here
} catch (error) {
  console.error('Error:', error);
  // Handle gracefully
}
```

### Where should I store configuration?

Use Script Properties:
```javascript
PropertiesService.getScriptProperties().setProperty('KEY', 'value');
const value = PropertiesService.getScriptProperties().getProperty('KEY');
```

Never hard-code sensitive data in your scripts.

## Troubleshooting Questions

### What do I do if something isn't working?

1. Refresh the page
2. Clear browser cache
3. Try a different browser
4. Check if others have the same issue
5. Contact your administrator

### How can I see what went wrong?

For developers:
- Check Apps Script execution logs
- Add console.log() statements
- Review error emails
- Check trigger history

### The app is running slowly. What can I do?

User actions:
- Reduce data displayed
- Use filters/search
- Clear browser cache
- Check internet connection

Developer actions:
- Implement pagination
- Optimize queries
- Cache frequently used data
- Batch operations

### How do I report a bug?

Include:
1. What you were trying to do
2. What happened instead
3. Error messages (exact text)
4. Screenshots if helpful
5. Browser and OS information
6. Time it occurred

## Administrative Questions

### How do I add new users?

1. Add their email to the authorized users sheet
2. Share the spreadsheet with appropriate permissions
3. Send them the web app URL
4. Have them sign in with Google account

### Can I restrict access to certain features?

Yes, implement role-based access:
- Read-only users
- Standard users (can claim)
- Administrators (full access)
- Custom roles as needed

### How do I monitor usage?

Built-in monitoring:
- Execution logs in Apps Script
- Audit trails in spreadsheets
- Email logs for notifications
- Custom analytics as needed

### What about compliance and data privacy?

- Data stays in your Google Workspace
- Subject to Google's privacy policies
- Can implement additional logging
- GDPR compliant if Google Workspace is

### How do I backup the system?

Regular backups recommended:
1. Copy spreadsheets periodically
2. Export Apps Script code
3. Document configurations
4. Test restore procedures

## Still Have Questions?

If your question isn't answered here:

1. Check the [Troubleshooting Guide](/appsscript/troubleshooting)
2. Review relevant documentation sections
3. Contact your system administrator
4. For developers: Check Google Apps Script documentation

Remember: Most questions can be answered by understanding that these are web-based applications running on Google's infrastructure, using spreadsheets as databases and Google services for functionality.