# Spreadsheet Import Setup Guide

This guide will help you set up the Google Sheets API integration for importing spreadsheet data into your Prisma database.

## Prerequisites

1. A Google Cloud Project with the Google Sheets API enabled
2. Google Sheets API credentials (API Key or Service Account)

## Setup Steps

### 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Get API Credentials

#### Option A: API Key (for public spreadsheets)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key

#### Option B: Service Account (for private spreadsheets)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Click "Create and Continue"
5. Download the JSON key file
6. Share your Google Sheets with the service account email

### 3. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Google Sheets API (choose one option)
# Option A: API Key (for public sheets)
GOOGLE_SHEETS_API_KEY="your_api_key_here"

# Option B: Service Account (for private sheets)
GOOGLE_SERVICE_ACCOUNT_KEY_FILE="path/to/your/service-account-key.json"
```

### 4. Database Setup

The Prisma database is already configured. If you need to reset it:

```bash
npx prisma db push
npx prisma generate
```

## Usage

### Import a Spreadsheet

1. Navigate to `/spreadsheet-import` in your app
2. Paste a Google Sheets URL
3. Click "Import Spreadsheet"

### View Imported Data

1. Navigate to `/spreadsheets` to see all imported spreadsheets
2. Click on a spreadsheet to view its data
3. Use the API endpoints to programmatically access data

## API Endpoints

### Import Spreadsheet
```
POST /api/import-spreadsheet
Content-Type: application/json

{
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

### Get All Spreadsheets
```
GET /api/spreadsheets
```

### Get Specific Spreadsheet
```
GET /api/spreadsheets?id=spreadsheet_id
```

### Delete Spreadsheet
```
DELETE /api/spreadsheets?id=spreadsheet_id
```

## Data Structure

The imported data is stored in two tables:

### Spreadsheet Table
- `id`: Unique identifier
- `url`: Original Google Sheets URL
- `title`: Spreadsheet title
- `createdAt`: Import timestamp
- `updatedAt`: Last update timestamp

### SpreadsheetRecord Table
- `id`: Unique identifier
- `spreadsheetId`: Reference to spreadsheet
- `rowIndex`: Row number in the original sheet
- `data`: JSON object containing the row data
- `createdAt`: Import timestamp
- `updatedAt`: Last update timestamp

## Troubleshooting

### Common Issues

1. **"Invalid Google Sheets URL"**
   - Ensure the URL is a valid Google Sheets URL
   - The URL should contain the spreadsheet ID

2. **"Failed to import spreadsheet"**
   - Check if the spreadsheet is public (if using API key)
   - Verify your API credentials
   - Ensure the Google Sheets API is enabled

3. **"Access denied"**
   - For private spreadsheets, use service account authentication
   - Share the spreadsheet with the service account email

### Testing with Public Spreadsheets

You can test the integration with this public spreadsheet:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for production deployments
- Consider using service accounts for better security
- Limit API key permissions in Google Cloud Console
