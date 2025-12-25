function myFunction() {
// Main function to process new form responses
function processNewResponse(responseData) {
  try {
    // Check consent - only process if user gave permission
    if (!responseData.consent || responseData.consent.toLowerCase().includes('no')) {
      console.log(`User ${responseData.email} declined contact permission - skipping processing`);
      return;
    }
    
    // Parse the form response
    const userResponse = {
      firstName: responseData.firstName,
      lastName: responseData.lastName,
      name: `${responseData.firstName} ${responseData.lastName}`,
      email: responseData.email,
      phone: responseData.phone,
      zipCode: responseData.zipCode,
      topics: parseMultipleChoice(responseData.topics),
      participation: parseMultipleChoice(responseData.participation),
      format: responseData.format
    };
    
    // Save response to sheet
    saveResponseToSheet(userResponse);
    
    // Find matching organizations
    const matches = findMatches(userResponse);
    
    // Save match results
    saveMatchResults(userResponse, matches);
    
    // Add to Mailchimp
    const mailchimpResult = addToMailchimp(userResponse, matches);
    
    if (mailchimpResult.success) {
      console.log(`✓ Successfully processed response for ${userResponse.firstName} ${userResponse.lastName} - added to Mailchimp`);
    } else {
      console.error(`✗ Failed to add to Mailchimp: ${mailchimpResult.error}`);
      // Send error notification
      sendErrorNotification(new Error(`Mailchimp error: ${mailchimpResult.error}`), responseData);
    }
    
  } catch (error) {
    console.error('Error processing response:', error);
    // Send error notification email
    sendErrorNotification(error, responseData);
  }
}

// Function to handle webhook from JotForm
function doPost(e) {
  try {
    // JotForm sends data as form-encoded
    const rawSubmission = e.parameter.rawRequest || e.postData.contents;
    const params = e.parameter;
    
    // Convert JotForm response to our format
    const responseData = {};
    
    // JotForm sends fields with question IDs as keys
    // We'll map by matching question text patterns
    Object.keys(params).forEach(key => {
      const value = params[key];
      const keyLower = key.toLowerCase();
      
      // Map fields based on question text
      if (keyLower.includes('first') && keyLower.includes('name')) {
        responseData.firstName = value;
      } else if (keyLower.includes('last') && keyLower.includes('name')) {
        responseData.lastName = value;
      } else if (keyLower.includes('email')) {
        responseData.email = value;
      } else if (keyLower.includes('phone')) {
        responseData.phone = value;
      } else if (keyLower.includes('zip')) {
        responseData.zipCode = value;
      } else if (keyLower.includes('causes') || keyLower.includes('passionate')) {
        responseData.topics = value;
      } else if (keyLower.includes('plug in') || keyLower.includes('make a difference')) {
        responseData.participation = value;
      } else if (keyLower.includes('participate') || keyLower.includes('preference')) {
        responseData.format = value;
      } else if (keyLower.includes('permission') || keyLower.includes('contacted')) {
        responseData.consent = value;
      }
    });
    
    // Alternative parsing if standard structure doesn't work
    // JotForm often sends data with q[ID]_ prefix
    if (!responseData.firstName) {
      Object.keys(params).forEach(key => {
        if (key.startsWith('q') && key.includes('_')) {
          const value = params[key];
          const fieldText = (params[key + '_text'] || '').toLowerCase();
          
          if (fieldText.includes('first') && fieldText.includes('name')) {
            responseData.firstName = value;
          } else if (fieldText.includes('last') && fieldText.includes('name')) {
            responseData.lastName = value;
          } else if (fieldText.includes('email')) {
            responseData.email = value;
          } else if (fieldText.includes('phone')) {
            responseData.phone = value;
          } else if (fieldText.includes('zip')) {
            responseData.zipCode = value;
          } else if (fieldText.includes('causes') || fieldText.includes('passionate')) {
            responseData.topics = value;
          } else if (fieldText.includes('plug in') || fieldText.includes('difference')) {
            responseData.participation = value;
          } else if (fieldText.includes('participate') || fieldText.includes('preference')) {
            responseData.format = value;
          } else if (fieldText.includes('permission') || fieldText.includes('contacted')) {
            responseData.consent = value;
          }
        }
      });
    }
    
    processNewResponse(responseData);
    
    return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
    
  } catch (error) {
    console.error('Webhook error:', error);
    return ContentService.createTextOutput('Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

// Parse multiple choice responses (handles arrays and comma-separated strings)
function parseMultipleChoice(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // JotForm often separates multiple choices with newlines or commas
    return value.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
  }
  return [];
}

// Save user response to spreadsheet
function saveResponseToSheet(userResponse) {
  const sheet = getOrCreateSheet(CONFIG.RESPONSES_SHEET);
  
  // Create header row if it doesn't exist
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 8).setValues([[
      'Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Zip Code', 
      'Topics', 'Participation', 'Format'
    ]]);
  }
  
  // Add the response
  sheet.appendRow([
    new Date(),
    userResponse.firstName,
    userResponse.lastName,
    userResponse.email,
    userResponse.phone,
    userResponse.zipCode,
    userResponse.topics.join(', '),
    userResponse.participation.join(', '),
    userResponse.format
  ]);
}

// Find matching organizations based on user preferences
function findMatches(userResponse) {
  const orgsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ORGANIZATIONS_SHEET);
  if (!orgsSheet) {
    throw new Error('Organizations sheet not found. Please create it first.');
  }
  
  const data = orgsSheet.getDataRange().getValues();
  const headers = data[0];
  const organizations = data.slice(1);
  
  const matches = [];
  
  organizations.forEach(orgRow => {
    const org = {};
    headers.forEach((header, index) => {
      org[header.toLowerCase().replace(/\s+/g, '_')] = orgRow[index];
    });
    
    const score = calculateMatchScore(userResponse, org);
    if (score.total > 0) {
      matches.push({
        organization: org,
        score: score.total,
        matchReasons: score.reasons
      });
    }
  });
  
  // Sort by score (highest first) and return top 5
  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Calculate match score between user and organization
function calculateMatchScore(user, org) {
  let score = 0;
  const reasons = [];
  
  // Topic matching (weight: 3)
  const userTopics = user.topics.map(t => t.toLowerCase().replace(/[^a-z]/g, '_'));
  const orgTopics = (org.topics || '').toLowerCase().split(',').map(t => t.trim().replace(/[^a-z]/g, '_'));
  
  // Alabama Forward topic mappings
  const topicMappings = {
    'access_to_quality_education': ['quality_education', 'education', 'schools', 'learning'],
    'access_to_quality_healthcare': ['quality_healthcare', 'healthcare', 'health', 'medical'],
    'basic_human_rights': ['basic_human_rights', 'human_rights', 'civil_rights', 'rights'],
    'bipoc_issues___equality': ['bipoc_issues_equality', 'racial_equity', 'racial_justice', 'diversity', 'inclusion', 'bipoc'],
    'criminal_justice_reform': ['criminal_justice_reform', 'justice_reform', 'prison_reform', 'police_reform'],
    'environmental_justice': ['environmental_justice', 'environment', 'climate', 'sustainability', 'green'],
    'lgbtq__issues___equality': ['lgbtq_issues_equality', 'lgbtq_rights', 'lgbt', 'gender_equality', 'sexual_orientation', 'lgbtq'],
    'reproductive_justice': ['reproductive_justice', 'reproductive_rights', 'reproductive_health', 'choice'],
    'voting_rights_and_fair_representation': ['voting_rights_fair_representation', 'voting_rights', 'electoral', 'democracy', 'voting'],
    'women_s_issues___equality': ['women_issues_equality', 'womens_rights', 'gender_equality', 'feminist', 'women']
  };
  
  let topicMatches = 0;
  userTopics.forEach(topic => {
    const mappedTopics = topicMappings[topic] || [topic];
    orgTopics.forEach(orgTopic => {
      mappedTopics.forEach(mappedTopic => {
        if (orgTopic.includes(mappedTopic) || mappedTopic.includes(orgTopic)) {
          topicMatches++;
        }
      });
    });
  });
  
  if (topicMatches > 0) {
    score += topicMatches * 3;
    reasons.push(`Shared interests in your selected topics`);
  }
  
  // Participation matching (weight: 2)
  const userParticipation = user.participation.map(p => p.toLowerCase().replace(/[^a-z]/g, '_'));
  const orgParticipation = (org.participation_types || '').toLowerCase().split(',').map(p => p.trim().replace(/[^a-z]/g, '_'));
  
  // Alabama Forward participation mappings (updated with new options)
  const participationMappings = {
    'voter_engagement_in_person_community_outreach_canvassing_etc': ['voter_engagement', 'canvassing', 'outreach', 'voter_registration', 'gotv', 'community_outreach'],
    'digital_organizing_social_media_content_creation_digital_communications_strategy_etc': ['digital_organizing', 'social_media', 'online', 'digital', 'communications', 'content_creation'],
    'shake_the_field_events_volunteer_opportunities_involving_our_community_events': ['shake_the_field_events', 'events', 'community_events', 'organizing', 'volunteer'],
    'content_creation_music_artwork_social_media_content_rooted_in_shake_the_field_messaging': ['content_creation', 'creative', 'media', 'marketing', 'design', 'music', 'artwork'],
    'data_supporting_the_collection_and_analysis_of_voting_data_that_guides_our_work': ['data', 'research', 'analysis', 'analytics', 'reporting', 'voting_data'],
    'education___leadership_opportunities_book_club_leadership_development_training': ['education', 'leadership', 'training', 'development', 'book_club', 'learning'],
    'fundraising_help_support_the_mission_by_donating_sponsoring_or_sharing_with_your_network': ['fundraise', 'fundraising', 'donations', 'development', 'grants', 'donating', 'sponsoring']
  };
  
  let participationMatches = 0;
  userParticipation.forEach(pref => {
    const mappedPrefs = participationMappings[pref] || [pref];
    orgParticipation.forEach(orgPref => {
      mappedPrefs.forEach(mappedPref => {
        if (orgPref.includes(mappedPref) || mappedPref.includes(orgPref)) {
          participationMatches++;
        }
      });
    });
  });
  
  if (participationMatches > 0) {
    score += participationMatches * 2;
    reasons.push(`Matching participation preferences`);
  }
  
  // Format compatibility (weight: 1)
  const userFormat = user.format.toLowerCase();
  const orgInPerson = (org.in_person || '').toLowerCase() === 'true';
  const orgVirtual = (org.virtual || '').toLowerCase() === 'true';
  
  let formatMatch = false;
  if (userFormat.includes('in-person only') && orgInPerson) formatMatch = true;
  if (userFormat.includes('virtual only') && orgVirtual) formatMatch = true;
  if (userFormat.includes('both') && (orgInPerson || orgVirtual)) formatMatch = true;
  if (userFormat.includes('no preference')) formatMatch = true;
  
  if (formatMatch) {
    score += 1;
    reasons.push(`Compatible format preferences`);
  }
  
  // Geographic compatibility - Alabama statewide (weight: 1)
  const userZip = parseInt(user.zipCode);
  const orgZips = (org.zip_codes || '').split(',').map(z => parseInt(z.trim()));
  
  // Alabama zip codes range from 35000-36925
  const isAlabamaZip = userZip >= 35000 && userZip <= 36925;
  const hasAlabamaServiceArea = orgZips.some(zip => zip >= 35000 && zip <= 36925) || 
                                (org.service_area && org.service_area.toLowerCase().includes('alabama')) ||
                                (org.statewide && org.statewide.toLowerCase() === 'true');
  
  if (isAlabamaZip && hasAlabamaServiceArea) {
    score += 1;
    reasons.push(`Serves Alabama residents`);
  }
  
  return {
    total: score,
    reasons: reasons
  };
}

// Save match results to spreadsheet
function saveMatchResults(userResponse, matches) {
  const sheet = getOrCreateSheet(CONFIG.RESULTS_SHEET);
  
  // Create header if needed
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 6).setValues([[
      'Timestamp', 'User Email', 'User Name', 'Organization', 'Score', 'Match Reasons'
    ]]);
  }
  
  // Save each match
  matches.forEach(match => {
    sheet.appendRow([
      new Date(),
      userResponse.email,
      userResponse.name,
      match.organization.name || 'Unknown Organization',
      match.score,
      match.matchReasons.join('; ')
    ]);
  });
}

// ============================================
// MAILCHIMP INTEGRATION FUNCTIONS
// ============================================

// Add contact to Mailchimp audience with all their data
function addToMailchimp(userResponse, matches) {
  try {
    const apiUrl = `https://${MAILCHIMP_CONFIG.SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_CONFIG.LIST_ID}/members`;
    
    // Prepare merge fields data
    const mergeFields = {};
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.FIRST_NAME] = userResponse.firstName;
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.LAST_NAME] = userResponse.lastName;
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.PHONE] = userResponse.phone || '';
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.ZIP_CODE] = userResponse.zipCode || '';
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.TOPICS] = userResponse.topics.join(', ');
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.PARTICIPATION] = userResponse.participation.join(', ');
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.FORMAT] = userResponse.format || '';
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.MATCH_COUNT] = matches.length.toString();
    
    // Add top match organization name if available
    if (matches.length > 0) {
      mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.TOP_MATCH] = matches[0].organization.name || '';
    }
    
    // Prepare tags
    const tags = [MAILCHIMP_CONFIG.TAGS.QUIZ_COMPLETED];
    
    if (matches.length > 0) {
      tags.push(MAILCHIMP_CONFIG.TAGS.HAS_MATCHES);
    } else {
      tags.push(MAILCHIMP_CONFIG.TAGS.NO_MATCHES);
    }
    
    // Check if Alabama resident
    const zipCode = parseInt(userResponse.zipCode);
    if (zipCode >= 35000 && zipCode <= 36999) {
      tags.push(MAILCHIMP_CONFIG.TAGS.ALABAMA_RESIDENT);
    }
    
    // Add topic-specific tags
    userResponse.topics.forEach(topic => {
      tags.push(`Topic: ${topic}`);
    });
    
    // Add participation-specific tags
    userResponse.participation.forEach(pref => {
      // Shorten participation tags for readability
      if (pref.includes('Voter Engagement')) {
        tags.push('Participation: Voter Engagement');
      } else if (pref.includes('Digital Organizing')) {
        tags.push('Participation: Digital Organizing');
      } else if (pref.includes('Shake the Field')) {
        tags.push('Participation: Events');
      } else if (pref.includes('Content Creation')) {
        tags.push('Participation: Content Creation');
      } else if (pref.includes('Data')) {
        tags.push('Participation: Data');
      } else if (pref.includes('Education')) {
        tags.push('Participation: Education & Leadership');
      } else if (pref.includes('Fundraising')) {
        tags.push('Participation: Fundraising');
      }
    });
    
    // Prepare the request payload
    const payload = {
      email_address: userResponse.email,
      status: 'subscribed', // Change to 'pending' if you want double opt-in
      merge_fields: mergeFields,
      tags: tags
    };
    
    // Make API request to Mailchimp
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode('anystring:' + MAILCHIMP_CONFIG.API_KEY)
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseBody = JSON.parse(response.getContentText());
    
    if (responseCode === 200 || responseCode === 201) {
      console.log(`✓ Successfully added ${userResponse.email} to Mailchimp`);
      
      // Store match details as a note in Mailchimp (optional)
      if (matches.length > 0) {
        addMatchDetailsNote(responseBody.id, userResponse, matches);
      }
      
      return {
        success: true,
        subscriberId: responseBody.id,
        message: 'Successfully added to Mailchimp'
      };
      
    } else if (responseCode === 400 && responseBody.title === 'Member Exists') {
      // Member already exists, update their information instead
      console.log(`Member exists, updating ${userResponse.email}`);
      return updateMailchimpMember(userResponse, matches);
      
    } else {
      console.error('Mailchimp API Error:', responseBody);
      return {
        success: false,
        error: responseBody.title || 'Unknown error',
        details: responseBody.detail || ''
      };
    }
    
  } catch (error) {
    console.error('Error adding to Mailchimp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Update existing Mailchimp member
function updateMailchimpMember(userResponse, matches) {
  try {
    const subscriberHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      userResponse.email.toLowerCase()
    ).map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
    
    const apiUrl = `https://${MAILCHIMP_CONFIG.SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_CONFIG.LIST_ID}/members/${subscriberHash}`;
    
    // Prepare merge fields
    const mergeFields = {};
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.FIRST_NAME] = userResponse.firstName;
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.LAST_NAME] = userResponse.lastName;
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.PHONE] = userResponse.phone || '';
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.ZIP_CODE] = userResponse.zipCode || '';
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.TOPICS] = userResponse.topics.join(', ');
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.PARTICIPATION] = userResponse.participation.join(', ');
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.FORMAT] = userResponse.format || '';
    mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.MATCH_COUNT] = matches.length.toString();
    
    if (matches.length > 0) {
      mergeFields[MAILCHIMP_CONFIG.MERGE_FIELDS.TOP_MATCH] = matches[0].organization.name || '';
    }
    
    const payload = {
      merge_fields: mergeFields
    };
    
    const options = {
      method: 'patch',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode('anystring:' + MAILCHIMP_CONFIG.API_KEY)
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      console.log(`✓ Successfully updated ${userResponse.email} in Mailchimp`);
      return {
        success: true,
        message: 'Successfully updated in Mailchimp'
      };
    } else {
      console.error('Error updating Mailchimp member:', response.getContentText());
      return {
        success: false,
        error: 'Failed to update member'
      };
    }
    
  } catch (error) {
    console.error('Error updating Mailchimp member:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Add match details as a note in Mailchimp
function addMatchDetailsNote(subscriberId, userResponse, matches) {
  try {
    const apiUrl = `https://${MAILCHIMP_CONFIG.SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_CONFIG.LIST_ID}/members/${subscriberId}/notes`;
    
    // Format match details
    let noteContent = `Quiz Results for ${userResponse.firstName} ${userResponse.lastName}\n\n`;
    noteContent += `Found ${matches.length} matching organizations:\n\n`;
    
    matches.forEach((match, index) => {
      const org = match.organization;
      noteContent += `${index + 1}. ${org.name || 'Organization'} (Score: ${match.score})\n`;
      noteContent += `   ${org.description || 'No description'}\n`;
      noteContent += `   Contact: ${org.email || org.contact_email || 'N/A'}\n`;
      if (org.website) noteContent += `   Website: ${org.website}\n`;
      noteContent += `   Match reasons: ${match.matchReasons.join(', ')}\n\n`;
    });
    
    const payload = {
      note: noteContent
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode('anystring:' + MAILCHIMP_CONFIG.API_KEY)
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    
    if (response.getResponseCode() === 200) {
      console.log(`✓ Added match details note for ${userResponse.email}`);
    }
    
  } catch (error) {
    console.error('Error adding note to Mailchimp:', error);
  }
}

// Send error notification via email (keeping this for system errors)
function sendErrorNotification(error, responseData) {
  const subject = 'Quiz Processing Error - Alabama Forward';
  const body = `Error processing quiz response:\n\nError: ${error.message}\n\nStack: ${error.stack}\n\nResponse Data: ${JSON.stringify(responseData, null, 2)}`;
  
  try {
    GmailApp.sendEmail(CONFIG.FROM_EMAIL, subject, body);
  } catch (e) {
    console.error('Error sending error notification:', e);
  }
}

// Utility function to get or create a sheet
function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  return sheet;
}

// ============================================
// TESTING FUNCTIONS
// ============================================

// Test Mailchimp connection
function testMailchimpConnection() {
  try {
    const apiUrl = `https://${MAILCHIMP_CONFIG.SERVER_PREFIX}.api.mailchimp.com/3.0/ping`;
    
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode('anystring:' + MAILCHIMP_CONFIG.API_KEY)
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      console.log('✓ Mailchimp connection successful!');
      
      // Test getting list info
      const listUrl = `https://${MAILCHIMP_CONFIG.SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_CONFIG.LIST_ID}`;
      const listResponse = UrlFetchApp.fetch(listUrl, options);
      
      if (listResponse.getResponseCode() === 200) {
        const listData = JSON.parse(listResponse.getContentText());
        console.log(`✓ Connected to list: ${listData.name}`);
        console.log(`  Subscriber count: ${listData.stats.member_count}`);
        return true;
      }
    } else {
      console.error('✗ Mailchimp connection failed');
      console.error('Response:', response.getContentText());
      return false;
    }
    
  } catch (error) {
    console.error('✗ Error testing Mailchimp connection:', error);
    return false;
  }
}

// Test function - run this to test your complete setup
function testSetup() {
  console.log('Testing Alabama Forward setup with Mailchimp...');
  
  // First test Mailchimp connection
  console.log('\n1. Testing Mailchimp connection...');
  if (!testMailchimpConnection()) {
    console.error('⚠ Mailchimp connection test failed. Check your API key, server prefix, and list ID.');
    console.log('Note: The rest of the system will still work (saving to sheets), but Mailchimp integration won\'t work until configured.');
  }
  
  // Test sample data processing
  console.log('\n2. Testing data processing...');
  const testResponse = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test+alabama@example.com',
    phone: '555-123-4567',
    zipCode: '35203',
    topics: ['Access to Quality Education', 'Environmental Justice'],
    participation: ['Voter Engagement: In-person community outreach, canvassing, etc.', 'Digital Organizing: Social media content creation, digital communications strategy, etc.'],
    format: 'Both in-person and virtual',
    consent: 'Yes, I give you permission to be contacted by the Alabama Forward/Shake the Field Network in the future.'
  };
  
  try {
    saveResponseToSheet(testResponse);
    console.log('✓ Response saved to sheet successfully');
    
    const matches = findMatches(testResponse);
    console.log(`✓ Found ${matches.length} matches`);
    
    if (matches.length > 0) {
      console.log('  Top match:', matches[0].organization.name);
    }
    
    // Test Mailchimp integration if configured
    if (MAILCHIMP_CONFIG.API_KEY !== 'YOUR_MAILCHIMP_API_KEY_HERE') {
      console.log('\n3. Testing Mailchimp integration...');
      const mailchimpResult = addToMailchimp(testResponse, matches);
      
      if (mailchimpResult.success) {
        console.log('✓ Mailchimp integration test PASSED');
        console.log('⚠ Note: You may want to remove the test user from your Mailchimp audience');
      } else {
        console.error('✗ Mailchimp integration test FAILED');
        console.error('  Error:', mailchimpResult.error);
      }
    } else {
      console.log('\n3. Skipping Mailchimp test (not configured yet)');
    }
    
    console.log('\n✓ Alabama Forward test completed!');
    console.log('\nNext steps:');
    console.log('1. Configure Mailchimp API credentials in MAILCHIMP_CONFIG');
    console.log('2. Create custom merge fields in your Mailchimp audience');
    console.log('3. Populate your Organizations sheet with data');
    console.log('4. Set up JotForm webhook to point to this script');
    
  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}


}
