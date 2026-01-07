# Quick Fix: MongoDB Authentication Error

## Problem
```
MongoServerError: Authentication failed.
```

## Solution

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the root directory with:

```env
# MongoDB Connection
MONGODB_URI=mongodb://Toss:Toss%40123@103.14.120.163:27017/attendence?authSource=admin

# JWT / auth helpers
AUTH_SECRET=please-change-me
AUTH_TOKEN_EXPIRES_IN=7d
```

**Important Notes:**
- `%40` in password = `@` symbol (URL encoded)
- If your password is `Toss@123`, use `Toss%40123`
- Replace `Toss` and `Toss%40123` with your actual MongoDB username and password

### Step 2: Use Setup Script (Easier)

Run the PowerShell script:

```powershell
.\setup-env.ps1
```

This will ask you for MongoDB details and create the `.env.local` file automatically.

### Step 3: Restart Server

After creating `.env.local`, restart your dev server:

```powershell
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Connection

Try registering a user again:

```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456",
    "role": "admin",
    "department": "IT",
    "designation": "Developer"
  }'
```

## Common Issues

### 1. Wrong Password Encoding
- `@` symbol must be encoded as `%40`
- Example: `Password@123` → `Password%40123`

### 2. MongoDB Server Not Accessible
- Check if MongoDB server at `103.14.120.163:27017` is running
- Check firewall settings
- Verify network connectivity

### 3. Wrong Credentials
- Double-check username and password
- Verify `authSource=admin` is correct
- Check MongoDB user permissions

### 4. Database Name
- Default database name is `attendence`
- Make sure this database exists or MongoDB will create it

## Manual .env.local Creation

If you prefer to create manually:

1. Create file: `.env.local`
2. Add this content (replace with your actual credentials):

```env
MONGODB_URI=mongodb://USERNAME:PASSWORD@HOST:PORT/DATABASE?authSource=admin
AUTH_SECRET=your-secret-key-here
```

3. URL encode special characters in password:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`
   - `+` → `%2B`
   - `=` → `%3D`

## Test MongoDB Connection

You can test MongoDB connection using MongoDB Compass or mongo shell:

```bash
mongosh "mongodb://Toss:Toss%40123@103.14.120.163:27017/attendence?authSource=admin"
```

Or using connection string directly in MongoDB Compass.

## Still Having Issues?

1. **Check MongoDB logs** on the server
2. **Verify credentials** with MongoDB admin
3. **Test connection** from another machine
4. **Check network/firewall** settings
5. **Verify MongoDB is running** on the server

