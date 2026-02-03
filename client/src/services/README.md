# API Services Documentation

## Overview
This directory contains all API service modules for the VerifyCert frontend application. The services are organized by domain and provide a clean, professional interface for making API calls without directly using `process.env` or `fetch` throughout the application.

## Architecture

### Base Service (`apiService.js`)
The foundation of all API calls. Provides:
- Centralized API URL configuration
- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Automatic authentication token injection
- File upload support
- URL building utilities

### Domain Services
Each service handles a specific domain of the application:

1. **authService.js** - Authentication and authorization
2. **TemplateLib.js** - Template management
3. **documentService.js** - Document/certificate operations
4. **dashboardService.js** - Dashboard statistics and analytics
5. **userService.js** - User profile and settings

## Usage Examples

### Basic Import
```javascript
// Import specific service
import { authService } from '@/services';
import { templateService } from '@/services';

// Or import specific functions
import { login, register } from '@/services/authService';
import { getTemplates, uploadTemplate } from '@/services/TemplateLib';
```

### Authentication Examples

#### Login
```javascript
import { login } from '@/services/authService';

const handleLogin = async (email, password) => {
    try {
        const data = await login(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Handle success
    } catch (error) {
        // Handle error
    }
};
```

#### Register
```javascript
import { register } from '@/services/authService';

const handleRegister = async (name, email, password) => {
    try {
        const data = await register(name, email, password);
        // Handle success
    } catch (error) {
        // Handle error
    }
};
```

#### Verify Token
```javascript
import { verifyToken } from '@/services/authService';

useEffect(() => {
    const checkAuth = async () => {
        try {
            const data = await verifyToken();
            setUser(data.user);
        } catch (error) {
            // Token invalid, redirect to login
        }
    };
    checkAuth();
}, []);
```

### Template Examples

#### Get All Templates
```javascript
import { getTemplates } from '@/services/TemplateLib';

const fetchTemplates = async () => {
    try {
        const data = await getTemplates({
            search: 'certificate',
            page: 1,
            limit: 10
        });
        setTemplates(data.templates);
        setTotalPages(data.pages);
    } catch (error) {
        console.error('Error fetching templates:', error);
    }
};
```

#### Upload Template
```javascript
import { uploadTemplate } from '@/services/TemplateLib';

const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('template', file);
    
    try {
        const data = await uploadTemplate(formData);
        // Handle success
    } catch (error) {
        // Handle error
    }
};
```

#### Update Template Name
```javascript
import { updateTemplateName } from '@/services/TemplateLib';

const handleRename = async (templateId, newName) => {
    try {
        await updateTemplateName(templateId, newName);
        // Refresh templates list
    } catch (error) {
        // Handle error
    }
};
```

#### Delete Template
```javascript
import { deleteTemplate } from '@/services/TemplateLib';

const handleDelete = async (templateId) => {
    try {
        await deleteTemplate(templateId);
        // Refresh templates list
    } catch (error) {
        // Handle error
    }
};
```

### Document Examples

#### Get Documents with Filters
```javascript
import { getDocuments } from '@/services/documentService';

const fetchDocuments = async () => {
    try {
        const data = await getDocuments({
            search: 'John',
            templateId: selectedTemplate,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            page: 1,
            limit: 5
        });
        setDocuments(data.documents);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

#### Generate Single Certificate
```javascript
import { generateCertificate } from '@/services/documentService';

const handleGenerate = async () => {
    try {
        const data = await generateCertificate(templateId, {
            NAME: 'John Doe',
            COURSE: 'React Development',
            DATE: '2024-01-15'
        });
        // Handle success
    } catch (error) {
        // Handle error
    }
};
```

#### Generate Bulk Certificates
```javascript
import { generateBulkCertificates } from '@/services/documentService';

const handleBulkGenerate = async (templateId, csvFile) => {
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('csvFile', csvFile);
    
    try {
        const data = await generateBulkCertificates(formData);
        // Handle success
    } catch (error) {
        // Handle error
    }
};
```

#### Send Certificate Email
```javascript
import { sendCertificateEmail } from '@/services/documentService';

const handleSendEmail = async (documentId, email) => {
    try {
        await sendCertificateEmail(documentId, email);
        // Show success message
    } catch (error) {
        // Handle error
    }
};
```

#### Verify Document
```javascript
import { verifyDocument } from '@/services/documentService';

const handleVerify = async (documentId) => {
    try {
        const data = await verifyDocument(documentId);
        if (data.valid) {
            // Show document details
        } else {
            // Show invalid message
        }
    } catch (error) {
        // Handle error
    }
};
```

### Dashboard Examples

#### Get Dashboard Stats
```javascript
import { getDashboardStats } from '@/services/dashboardService';

useEffect(() => {
    const fetchStats = async () => {
        try {
            const stats = await getDashboardStats();
            setTotalTemplates(stats.totalTemplates);
            setTotalDocuments(stats.totalDocuments);
        } catch (error) {
            console.error('Error:', error);
        }
    };
    fetchStats();
}, []);
```

#### Get User Activity
```javascript
import { getUserActivity } from '@/services/dashboardService';

const fetchActivity = async () => {
    try {
        const data = await getUserActivity({ page: 1, limit: 20 });
        setActivities(data.activities);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

### User Examples

#### Get User Profile
```javascript
import { getUserProfile } from '@/services/userService';

const loadProfile = async () => {
    try {
        const profile = await getUserProfile();
        setUserData(profile);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

#### Update Profile
```javascript
import { updateUserProfile } from '@/services/userService';

const handleUpdateProfile = async (profileData) => {
    try {
        await updateUserProfile(profileData);
        // Show success message
    } catch (error) {
        // Handle error
    }
};
```

#### Change Password
```javascript
import { changePassword } from '@/services/userService';

const handlePasswordChange = async (current, newPass) => {
    try {
        await changePassword(current, newPass);
        // Show success message
    } catch (error) {
        // Handle error
    }
};
```

## Utility Functions

### Get API URL
```javascript
import { getApiUrl } from '@/services/apiService';

// For direct file links
const pdfUrl = getApiUrl('/uploads/certificate.pdf');
const thumbnailUrl = getApiUrl(template.thumbnailPath);
```

### Build URL with Query Params
```javascript
import { buildUrl } from '@/services/apiService';

const endpoint = buildUrl('/api/documents', {
    search: 'test',
    page: 1,
    limit: 10
});
// Result: '/api/documents?search=test&page=1&limit=10'
```

## Error Handling

All service methods return promises. Always use try-catch or .catch() for error handling:

```javascript
try {
    const data = await someServiceMethod();
    // Handle success
} catch (error) {
    console.error('API Error:', error);
    // Handle error (show message to user, etc.)
}
```

## Response Handling

Most services return the parsed JSON response. Check the response structure:

```javascript
const response = await getTemplates();
// response.json() is already called
// Access data directly: response.templates, response.total, etc.
```

## Authentication

The base service automatically includes the JWT token from localStorage in all requests. No need to manually add authorization headers.

## Best Practices

1. **Always import from services**: Never use `fetch` or `process.env.NEXT_PUBLIC_API_URL` directly in components
2. **Use try-catch**: Always handle errors appropriately
3. **Type safety**: Consider adding TypeScript types for better IDE support
4. **Loading states**: Show loading indicators while API calls are in progress
5. **Error messages**: Display user-friendly error messages
6. **Debouncing**: For search/filter operations, debounce API calls

## Migration Guide

### Before (Old Way)
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const token = localStorage.getItem('token');

const res = await fetch(`${API_URL}/api/templates`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const data = await res.json();
```

### After (New Way)
```javascript
import { getTemplates } from '@/services/TemplateLib';

const data = await getTemplates();
```

Much cleaner and more maintainable! 🎉
