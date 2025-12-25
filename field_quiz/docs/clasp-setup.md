# Connecting field_quiz to Google Apps Script with clasp

## Overview
This guide explains how to connect your local `field_quiz` project to Google Apps Script using clasp (Command Line Apps Script Projects).

## Prerequisites

Make sure clasp is installed globally:
```bash
npm install -g @google/clasp
```

## Your Project Configuration

Your `.clasp.json` file is already configured:
- **Script ID**: `19JRB-4E0A1wUtOsY9-3JbSJuMYZ2RAocrjT6c4DDJkd7BMYjcZFdKDUL`
- **Root Directory**: `./src`
- **Auth Email**: `datateam@alforward.org`

## Setup Steps

### 1. Login to clasp with your organization email

```bash
clasp login --creds datateam@alforward.org
```

This will open a browser window for authentication. Make sure you log in with the `datateam@alforward.org` account.

### 2. Navigate to your project directory

```bash
cd /Users/richardscc1/alf_dev/appsscript/field_quiz
```

### 3. Verify the connection

Check your current clasp status:
```bash
clasp status
```

This should show that you're connected to the Apps Script project.

### 4. Pull the latest code from Apps Script

If you want to pull the current code from Google Apps Script to your local project:
```bash
clasp pull
```

This will download all files from the Apps Script project into your `src/` directory.

### 5. Push your local changes to Apps Script

When you're ready to push your local changes to Google Apps Script:
```bash
clasp push
```

You can also watch for changes and automatically push:
```bash
clasp push --watch
```

## Common Commands

| Command | Description |
|---------|-------------|
| `clasp login` | Authenticate with Google |
| `clasp logout` | Log out of clasp |
| `clasp pull` | Pull files from Apps Script to local |
| `clasp push` | Push local files to Apps Script |
| `clasp push --watch` | Watch for local changes and auto-push |
| `clasp open` | Open the Apps Script project in browser |
| `clasp status` | Check connection status |
| `clasp logs` | View Apps Script execution logs |
| `clasp deploy` | Create a versioned deployment |

## Opening Your Project

To open your Apps Script project in the browser:
```bash
clasp open
```

This will open the Apps Script editor for your project.

## Troubleshooting

### Authentication Issues
If you have trouble authenticating, try:
```bash
clasp logout
clasp login
```

Make sure you're logging in with `datateam@alforward.org`.

### Permission Issues
Ensure that `datateam@alforward.org` has edit access to the Apps Script project with ID `19JRB-4E0A1wUtOsY9-3JbSJuMYZ2RAocrjT6c4DDJkd7BMYjcZFdKDUL`.

### Sync Conflicts
If there are conflicts between local and remote:
1. Pull first: `clasp pull`
2. Resolve any conflicts
3. Then push: `clasp push`

## Notes

- The `.clasp.json` file connects your local folder to the specific Apps Script project
- All source files should be in the `src/` directory as specified in your `rootDir` setting
- Changes made in the Apps Script web editor won't appear locally until you run `clasp pull`
- Changes made locally won't appear in Apps Script until you run `clasp push`
