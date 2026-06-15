import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SPREADSHEET_ID = '1ekl5xeA3otFGVWDrPx7phM4RFFtxETu0iueEPYSICd0';
const RANGE = 'A:C'; // Column A for date, Column B for email, Column C for status
const HEADER_ROW = ['Date', 'Email', 'Status'];

export default async function handler(req, res) {
  try {
    // Path to the service account JSON file
    const serviceAccountPath = path.join(process.cwd(), 'google_service_account.json');
    
    // Read the service account credentials from file
    const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Create an auth client
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    // Create a Sheets API instance
    const sheets = google.sheets({ version: 'v4', auth });

    // Helper function to ensure headers exist
    const ensureHeaders = async () => {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'A1:C1',
        });

        const firstRow = response.data.values?.[0] || [];
        if (!firstRow.length || firstRow[0] !== 'Date') {
          // Headers don't exist, add them
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'A1:C1',
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: [HEADER_ROW],
            },
          });
        }
      } catch (error) {
        console.error('Error ensuring headers:', error);
      }
    };

    if (req.method === 'GET') {
      // Ensure headers exist
      await ensureHeaders();

      // Fetch all subscribers
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values || [];
      
      // Transform the data into a more usable format (skip header row)
      const data = rows.slice(1).map(row => ({
        date: row[0] || '',
        email: row[1] || '',
        status: row[2] || 'active',
      }));

      res.status(200).json({ 
        success: true, 
        count: data.length,
        subscribers: data 
      });
    } else if (req.method === 'POST') {
      // Ensure headers exist
      await ensureHeaders();

      // Add a new subscriber
      const { email } = req.body;

      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      // Check if email already exists
      const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const existingRows = getResponse.data.values || [];
      // Skip header row when checking for duplicates
      const emailExists = existingRows.slice(1).some(row => row[1]?.toLowerCase() === email.toLowerCase());

      if (emailExists) {
        return res.status(400).json({ error: 'Email already subscribed' });
      }

      // Add new subscriber with date and active status
      const timestamp = new Date().toLocaleString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'A2', // Start from row 2 (after headers)
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[timestamp, email, 'active']],
        },
      });

      res.status(200).json({ 
        success: true, 
        message: 'Successfully subscribed to newsletter',
        email: email 
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error with Google Sheets:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
}
