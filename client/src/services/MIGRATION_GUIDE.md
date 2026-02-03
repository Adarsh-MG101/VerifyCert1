# Migration Example: Login Page

## Before (Using process.env directly)

```javascript
"use client";
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            // ❌ OLD WAY - Direct fetch with process.env
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                }
            );
            
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.replace('/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong');
        }
    };
    
    return (/* JSX */);
}
```

## After (Using authService)

```javascript
"use client";
import { useState } from 'react';
import { login } from '@/services/authService'; // ✅ Import from service

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            // ✅ NEW WAY - Clean service call
            const data = await login(email, password);
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.replace('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };
    
    return (/* JSX */);
}
```

## Benefits

1. **Cleaner Code**: No more long fetch URLs
2. **Centralized Config**: API URL defined once in apiService.js
3. **Easier Testing**: Mock services instead of fetch
4. **Type Safety**: Can add TypeScript types to services
5. **Reusability**: Same login function used everywhere
6. **Maintainability**: Change API structure in one place

---

# Migration Example: Templates Page

## Before

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const fetchTemplates = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);
    
    const res = await fetch(`${API_URL}/api/templates?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setTemplates(data.templates);
};
```

## After

```javascript
import { getTemplates } from '@/services/TemplateLib';

const fetchTemplates = async () => {
    const data = await getTemplates({
        search,
        page,
        limit
    });
    setTemplates(data.templates);
};
```

**Lines of code reduced: 12 → 5** 🎉

---

# Migration Example: Document Generation

## Before

```javascript
const handleGenerate = async () => {
    const token = localStorage.getItem('token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    try {
        const res = await fetch(`${API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                templateId: selectedTemplate,
                data: formData
            })
        });
        
        const result = await res.json();
        // Handle result
    } catch (error) {
        // Handle error
    }
};
```

## After

```javascript
import { generateCertificate } from '@/services/documentService';

const handleGenerate = async () => {
    try {
        const result = await generateCertificate(selectedTemplate, formData);
        // Handle result
    } catch (error) {
        // Handle error
    }
};
```

**Much cleaner!** ✨

---

# Migration Checklist

## Step 1: Update Imports
- [ ] Remove `const API_URL = process.env...` lines
- [ ] Add service imports: `import { functionName } from '@/services/serviceName'`

## Step 2: Replace Fetch Calls
- [ ] Replace `fetch(...)` with service function calls
- [ ] Remove manual header construction
- [ ] Remove manual token retrieval (handled by service)

## Step 3: Simplify Response Handling
- [ ] Service already calls `.json()`, use response directly
- [ ] Update error handling if needed

## Step 4: Test
- [ ] Verify functionality works the same
- [ ] Check network tab to ensure requests are correct
- [ ] Test error scenarios

## Common Patterns

### Pattern 1: GET with Query Params
```javascript
// Before
const res = await fetch(`${API_URL}/api/endpoint?param1=value1&param2=value2`, {
    headers: { 'Authorization': `Bearer ${token}` }
});

// After
import { get, buildUrl } from '@/services/apiService';
const res = await get(buildUrl('/api/endpoint', { param1: 'value1', param2: 'value2' }));
```

### Pattern 2: POST with JSON Body
```javascript
// Before
const res = await fetch(`${API_URL}/api/endpoint`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
});

// After
import { post } from '@/services/apiService';
const res = await post('/api/endpoint', data);
```

### Pattern 3: File Upload
```javascript
// Before
const formData = new FormData();
formData.append('file', file);
const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
});

// After
import { upload } from '@/services/apiService';
const formData = new FormData();
formData.append('file', file);
const res = await upload('/api/upload', formData);
```

### Pattern 4: Direct File URLs
```javascript
// Before
const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${filePath}`;

// After
import { getApiUrl } from '@/services/apiService';
const fileUrl = getApiUrl(filePath);
```

---

# Quick Reference

| Old Code | New Code |
|----------|----------|
| `process.env.NEXT_PUBLIC_API_URL` | Import from `@/services/apiService` |
| `localStorage.getItem('token')` | Automatic in services |
| `fetch(url, { headers: {...} })` | Service function call |
| Manual `.json()` parsing | Already handled |
| URL string concatenation | `buildUrl()` or service params |

**Result: Cleaner, more maintainable, professional code!** 🚀
