# Error Handling Guide for OrangeCloud API

## Overview

We've implemented a centralized error handling system for the Hono API that provides:
- Consistent error responses
- Better error logging
- Type-safe error handling following Hono's recommendations
- Automatic error transformation

## Response Format

All API responses follow this format:

```typescript
// Success response
{
  "data": { /* actual data */ },
  "message": "Success" // or custom success message
}

// Error response
{
  "data": null,
  "message": "Error message here"
}
```

## Key Components

### 1. HTTPException (from Hono)
Following [Hono's official documentation](https://hono.dev/docs/api/exception), we use `HTTPException` directly:
```typescript
import { HTTPException } from 'hono/http-exception'

// Throw errors with status code and message
throw new HTTPException(400, { message: 'Invalid input' })
throw new HTTPException(401, { message: 'Unauthorized' })
throw new HTTPException(404, { message: 'Resource not found' })
throw new HTTPException(500, { message: 'Internal server error' })
```

### 2. Error Handler Middleware (`middlewares/errorHandler.ts`)
- Global error handler attached to app with `app.onError(errorHandler)`
- Automatically logs errors with context
- Transforms errors into consistent response format

### 3. Validator Middleware (`middlewares/validator.ts`)
- Wraps zValidator to throw HTTPException
- Use `createValidator` instead of `zValidator` for consistent validation errors

## Refactoring Pattern

### Before (Old Pattern):
```typescript
.post('/', authMiddleware, 
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json({ data: null, message: result.error.issues[0].message }, 400);
    }
  }),
  async (c) => {
    if (!userId) {
      return c.json({ data: null, message: 'Unauthorized' }, 401);
    }
    try {
      // ... code
      return c.json({ data: result, message: 'Success' });
    } catch (error) {
      console.error('Error:', error);
      return c.json({ data: null, message: 'Error' }, 500);
    }
  }
)
```

### After (New Pattern):
```typescript
.post('/', authMiddleware,
  createValidator('json', schema),
  async (c) => {
    if (!userId) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }
    
    try {
      // ... code
      return c.json(createSuccessResponse(result, 'Custom success message'));
    } catch (error) {
      logger.error('Error description', error, { userId, otherContext });
      
      if (error instanceof HTTPException) {
        throw error; // Re-throw if already formatted
      }
      
      if (error instanceof Cloudflare.APIError) {
        const { status, message } = handleCloudflareError(error);
        throw new HTTPException(status, { message });
      }
      
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
)
```

## Error Handling Patterns

### 1. Routes with Auth
```typescript
async (c) => {
  const userId = c.get('user')?.id;
  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  // ... rest of code
}
```

### 2. Database Operations
```typescript
try {
  const userConfig = await getUserConfig(userId, c.env);
  // getUserConfig already throws HTTPException if not found
} catch (error) {
  // Error is automatically handled by global handler
  throw error;
}
```

### 3. External API Calls
```typescript
try {
  const response = await cloudflare.r2.buckets.create(/* ... */);
  return c.json(createSuccessResponse(response));
} catch (error) {
  if (error instanceof Cloudflare.APIError) {
    const { status, message } = handleCloudflareError(error);
    throw new HTTPException(status, { message });
  }
  throw new HTTPException(500, { message: 'Internal server error' });
}
```

### 4. File Operations
```typescript
const fileResponse = await aws.fetch(url, { method: 'GET' });

if (!fileResponse.ok) {
  logger.warn('File not found', { key, status: fileResponse.status });
  throw new HTTPException(404, { message: 'File not found' });
}
```

## Logging Best Practices

1. **Always log with context:**
```typescript
logger.error('Error creating bucket', error, {
  userId,
  bucketName: name,
  accountId: userConfig.cloudflareAccountId
});
```

2. **Use appropriate log levels:**
- `logger.error()` - For actual errors
- `logger.warn()` - For expected failures (404s, validation)
- `logger.info()` - For important operations

3. **Don't log sensitive data:**
- Never log passwords, tokens, or API keys
- Sanitize user input before logging

## Migration Checklist

When refactoring a route:

- [ ] Replace `zValidator` with `createValidator`
- [ ] Remove manual validation error handling
- [ ] Replace `return c.json({data: null, message})` with `throw new HTTPException(status, { message })`
- [ ] Replace `console.error` with `logger.error`
- [ ] Add try-catch only where needed
- [ ] Use `createSuccessResponse` for success returns
- [ ] Log errors with context before throwing

## Benefits

1. **Simplicity**: Using Hono's built-in HTTPException reduces complexity
2. **Consistency**: All errors follow the same format
3. **Debugging**: Centralized logging with context
4. **Maintainability**: Less custom code to maintain
5. **Best Practices**: Following Hono's official recommendations 