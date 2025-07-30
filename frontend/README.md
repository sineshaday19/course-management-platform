# Course Management Platform Frontend

A modern, responsive web interface for the Course Management Platform that demonstrates cohort filtering functionality.

## Features

- **Authentication**: Login and registration forms with JWT token management
- **Cohort Filtering**: Filter course allocations by cohort ID, trimester, and year
- **Real-time Results**: Dynamic loading and display of allocation data
- **Create Allocations**: Form to create new course allocations
- **Modern UI**: Built with Tailwind CSS and Font Awesome icons
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Start the Backend Server**
   ```bash
   cd ../
   npm start
   ```

2. **Open the Frontend**
   - Open `frontend/index.html` in your web browser
   - Or serve it using a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server -p 8000
     ```

3. **Authentication**
   - Use the registration form to create a new manager account
   - Or login with existing credentials
   - The system will automatically store your authentication token

4. **Cohort Filtering Demo**
   - After logging in, you'll see the cohort filtering interface
   - Enter a cohort ID to filter allocations by that specific cohort
   - Use trimester and year filters for additional filtering
   - Click "Apply Filters" to see the results

5. **Create Allocations**
   - Use the form at the bottom to create new course allocations
   - All fields are required and validated
   - New allocations will appear in the results after creation

## API Integration

The frontend communicates with the backend API at `http://localhost:3000`:

- **Authentication**: `/api/v1/auth/login` and `/api/v1/auth/register`
- **Allocations**: `/api/v1/allocations` (GET with query parameters for filtering)
- **Create Allocations**: `/api/v1/allocations` (POST)

## Key Features Demonstrated

1. **Cohort Filtering**: The main feature - filtering allocations by cohort ID
2. **Real-time Updates**: Results update immediately when filters are applied
3. **Error Handling**: User-friendly error messages for API failures
4. **Loading States**: Spinner animations during API calls
5. **Responsive Design**: Works on all screen sizes

## File Structure

```
frontend/
├── index.html          # Main HTML file with UI
├── app.js             # JavaScript application logic
└── README.md          # This file
```

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses ES6+ features (async/await, fetch API)

## Troubleshooting

1. **CORS Issues**: Make sure the backend server is running and configured to allow requests from the frontend
2. **API Connection**: Verify the backend is running on `http://localhost:3000`
3. **Authentication**: Clear browser localStorage if you encounter token issues
4. **No Results**: Check that you have allocations in the database and the cohort ID is correct 