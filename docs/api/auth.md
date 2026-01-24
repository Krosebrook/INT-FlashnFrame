# GET /api/auth/user

**Purpose:** Retrieve the currently authenticated user session.

**Auth Required:** Yes (Cookie-based session)

**Response (200):**
```typescript
interface UserResponse {
  user: {
    id: string;
    email: string;
    username?: string;
  }
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```
