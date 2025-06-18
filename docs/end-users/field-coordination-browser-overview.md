---
layout: default
title: Field Coordination Browser Overview
---

# Field Coordination Browser Overview

The Field Coordination Browser is a precinct claim management system that allows organizations to claim precincts for voter outreach activities. It provides a simple web interface for searching and claiming precincts from a Google Sheets database.

## What It Does

### Core Functionality

1. **Precinct Claiming**
   - Organizations can claim precincts for field activities
   - Each precinct allows up to 2 organizations to claim it
   - Claims are recorded with timestamps
   - Prevents duplicate claims by the same organization
   - Automatic email confirmations sent to administrators and claimants

2. **Basic Search**
   - Search by precinct number only
   - Results show county, precinct name, number, and municipality
   - Manual refresh required to see updates
   - No advanced filtering options

3. **Visual Status Indicators**
   - Blue background: Precinct has 1 claim
   - Green background: Precinct fully claimed (2 claims)
   - Orange pulsing: Selection in progress by another user

4. **Access Methods**
   - Google Sheets menu: "Search Tools" → "Choose your precincts!"
   - Web app URL (when deployed)

## How It Works

### The Spreadsheet Backend

The application uses Google Sheets as its database with these sheets:

- **priorities**: Master list of all precincts with claim status
- **search**: Temporary sheet for search results
- **orgContacts**: Organization names and email contacts
- **userSelections**: Tracks active selections to prevent conflicts

### The Claiming Process

1. **Search for Precincts**: Enter a precinct number to find available precincts
2. **Select Organization**: Choose your organization from the dropdown
3. **Claim Precinct**: System records your claim with timestamp
4. **Manual Refresh**: Click refresh or reload page to see latest claims

### Email Notifications

When you claim a precinct, the system automatically sends confirmation emails to:
- **Data team administrators** (datateam@alforward.org)
- **You** (the person making the claim)
- **Other organization** (if they've already claimed the same precinct)

The email includes:
- Precinct details (county, name, number, municipality)
- Organizations that have claimed the precinct
- Timestamp of claims
- Instructions to run the 'field_coordination_2025' query in PAD
- Link to the master spreadsheet

### Important Limitations

- **No real-time updates** - You must manually refresh to see changes
- **Basic search only** - Can only search by precinct number
- **No undo feature** - Claims cannot be reversed once made
- **Limited to 2 claims per precinct** - Hard-coded limit

## User Experience

### For Field Staff

1. **Finding Precincts**
   - Search by precinct number
   - View available precincts in your area
   - Check current claim status

2. **Making Claims**
   - Select your organization from dropdown
   - Click to claim available slots
   - Refresh page to confirm claim

3. **Tracking Claims**
   - View which precincts you've claimed
   - See who else has claimed precincts
   - Check timestamps for all claims

### For Coordinators

1. **Monitor Coverage**
   - See which precincts are claimed
   - Identify unclaimed areas
   - Track organizational participation

2. **Data Management**
   - Access underlying spreadsheet for full control
   - Export data for reporting
   - Make manual adjustments if needed

## Key Benefits

### 1. **Simple Interface**
- Easy to understand and use
- No training required
- Clear visual indicators
- Direct precinct claiming

### 2. **Conflict Prevention**
- Prevents duplicate claims
- Shows active selections
- Tracks all claims with timestamps

### 3. **Centralized Data**
- All claims in one place
- Google Sheets integration
- Easy data export

## Technical Details

### Requirements
- Google account with access permissions
- Web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection

### Configuration Needed
- `SPREADSHEET_ID`: ID of the Google Sheet with precinct data
- Access to specific named sheets
- Organization list in orgContacts sheet

### Security
- Uses Google authentication
- Permissions controlled via Google Sheets sharing
- No additional security layers

## Common Use Cases

### 1. **Precinct Assignment**
- Organizations claim precincts for canvassing
- Prevents overlap between organizations
- Tracks coverage across districts

### 2. **Field Coordination**
- Coordinate multiple organizations
- Ensure complete coverage
- Avoid duplication of effort

## Getting Started

1. **Access the Application**
   - Open the Google Sheet
   - Click "Search Tools" → "Choose your precincts!"
   - Or use the web app URL if provided

2. **Search for Precincts**
   - Enter a precinct number
   - Click search or press Enter
   - Review results

3. **Make Your Claims**
   - Select your organization from dropdown
   - Click on available precinct slots
   - Refresh to confirm claims

4. **Important Reminders**
   - Refresh frequently to see others' claims
   - Claims are permanent once made
   - Contact administrators for any issues

## Troubleshooting

<div class="tip">
<strong>Can't see recent claims?</strong> Refresh the page - updates are not automatic.
</div>

<div class="tip">
<strong>Search not working?</strong> Make sure you're searching by precinct number only.
</div>

<div class="tip">
<strong>Can't claim a precinct?</strong> Check if it already has 2 claims or if your organization already claimed it.
</div>

<div class="tip">
<strong>Selection disappeared?</strong> Another user may have claimed it. Refresh to see current status.
</div>

## Future Development

The following features are in development but not currently active:
- BigQuery integration for voter data
- Advanced search capabilities
- Real-time updates

## Next Steps

- Learn about the [FieldPlan Analyzer](/appsscript/docs/end-users/fieldplan-analyzer-overview)
- Visit the [FAQ](/appsscript/docs/faq) for common questions
- Check [Troubleshooting](/appsscript/docs/troubleshooting) if you encounter issues