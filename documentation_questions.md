# Documentation Planning Questions

Please answer the following questions to help build documentation for your field_coordination_browser and fieldplan_analyzer apps.

## 1. Target Audience
**Who is your target audience?** (e.g., developers wanting to use your apps, end-users, both?)

**Your Answer:**
I want the documentation to be accessible to developers wanting to create their own AND end-users who want to understand how it works. I want end-users to get an understanding of the apps, but they don't need to know all the technical details. In particular, I want end-users to understand how appsscript works and how it is useful. On the other hand, I need developers to know the details of how to implement their own system.

---

## 2. Field Coordination Browser Features
**What are the main features/functionalities of field_coordination_browser that should be documented?**

**Your Answer:**
All of the core functionalities should be documented. Including but not limited to how it uses spreadsheets as database and how it deploys on the web. 

---

## 3. Fieldplan Analyzer Features
**What are the main features/functionalities of fieldplan_analyzer that should be documented?**

**Your Answer:**
All of the core functionalities should be documented. Including but not limited to the class-based structures and the functional programming involved in returning an email response. Fo example I want developers to know how to implement their own timers, how to map their own spreadsheets, and how to extend the functionality if needed.

---

## 4. Documentation Format
**What format/structure would you prefer for the documentation?** (e.g., single page, multi-page with navigation, API reference style)

**Your Answer:**
The documentation should be multi-page navigation. Since this program doesn't use nor is it meant to be used as an API, I'd prefer something like an instruction manual.

---

## 5. Existing Documentation
**Do you have any existing documentation or README files I should incorporate or use as a starting point?**

**Your Answer:**
I do not have existing documentation or readmes because this has been used internally. But a readme file should be added in addition to documentation.

---

## 6. Spreadsheet Mappings
**What are the key spreadsheet mappings/configurations that users need to understand?** (without revealing your specific spreadsheet IDs)

**Your Answer:**
I want users to know how to map their spreadsheet columns to specific spreadsheets and reference those mappings within functions to manipulate spreadsheet data.

---

## 7. Prerequisites and Dependencies
**Are there any prerequisites or dependencies users need to have installed before using your apps?**

**Your Answer:**
The only dependencies used in these apps are google spreadsheets and appsscript. 

---

## 8. Code Examples
**Do you want to include code examples, and if so, what level of detail?**

**Your Answer:**
Please include code examples as long as they do not reveal specific spreadsheet information. 

---

## 9. Troubleshooting and FAQs
**Should the documentation include troubleshooting guides or FAQs?**

**Your Answer:**
Please add troubleshooting, error handling, and FAQ sections. In particular add information about how to navigate the google appsscript execution logger.

---

## 10. Documentation Theme
**Do you want to use a specific documentation theme or framework?** (e.g., Jekyll theme, Docsify, plain HTML/CSS)

**Your Answer:**
Use the Jekyll theme.

---

## Additional Notes
Feel free to add any other information or requirements for the documentation:

**Your Answer:**
Any developer with javascript knowledge should be able to use this documentation. Any end-user curious about how this works should be able to understand the parts geared toward them.

////

Improvements:
- Review the field plan analyzer and give more accurate examples of what the budget analyzer and field plan analyzer emails look like.