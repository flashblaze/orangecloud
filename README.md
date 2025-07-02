# ⛅ OrangeCloud

> **An open source alternative UI for your Cloudflare R2 buckets**

OrangeCloud transforms your Cloudflare R2 storage experience with an intuitive web interface featuring file preview, upload progress tracking, sharing capabilities, and much more.

🌟 **[Live Demo](https://slice.orangecloud.app)** | 🏠 **[Website](https://orangecloud.app)**

## ✨ Features

### 📁 **File Management**
- **Multipart uploads**
- **Create and manage folders**
- **File preview**
- **Syntax highlighting**

### 🔗 **Sharing & Access**
- **Presigned URL generation** with configurable expiration (1 second to 7 days)
- **Domain-based sharing** with custom domain support

## 🚀 Quick Start

### Prerequisites

- **Bun** (latest version)
- **Cloudflare account** with R2 enabled
- **Node.js 22+**

### 1. Clone and Install

```bash
git clone https://github.com/flashblaze/orangecloud.git
cd orangecloud
bun install
```

### 2. Configure Environment Variables

#### API Configuration (`apps/api/.dev.vars`)
```bash
# Copy the example file
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

Fill in your values:
```env
ENVIRONMENT=local
BETTER_AUTH_SECRET=your-super-secret-key-here

# Development URLs
ORIGIN_URLS=http://localhost:5173
BASE_URL=http://localhost:8787

# Optional: Cloudflare Turnstile (for CAPTCHA)
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
TURNSTILE_SITE_KEY=your-turnstile-site-key

# Optional: OAuth Providers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Web Configuration (`apps/web/.dev.vars`)
```bash
cp apps/web/.dev.vars.example apps/web/.dev.vars
```

```env
API_URL=http://localhost:8787
ENVIRONMENT=local
BASE_URL=http://localhost:5173
```

### 3. Database Setup

```bash
# Navigate to API directory
cd apps/api

# Run database migrations
bun run db:migrate
```

### 4. Start Development

```bash
# From the root directory
bun run dev
```

This starts:
- **Web app**: http://localhost:5173
- **API**: http://localhost:8787  
- **Landing page**: http://localhost:4321

### 🛠️ **Tech Stack**

#### **Frontend (`apps/web`)**
- **React Router 7** 
- **Mantine**
- **Tailwind CSS**
- **React Hook Form**
- **TanStack Query**
- **Zod**
- **React PDF**
- **React Shiki**
- **Framer Motion**

#### **Backend (`apps/api`)**
- **Hono**
- **Better Auth**
- **Drizzle ORM**
- **Cloudflare D1**
- **Cloudflare R2**
- **AWS4Fetch**
- **Rate limiting**

#### **Landing Page (`apps/www`)**
- **Astro**
- **Tailwind CSS**

## 🚀 Deployment

### GitHub Actions Setup

1. Fork the repository or set up your own
2. Configure Cloudflare secrets in your repository settings:

```
# This should have edit Workers permissions
CLOUDFLARE_API_TOKEN=your-api-token-with-workers-permissions 
# You can find this in the Cloudflare dashboard
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id 
# This should have edit D1 permissions
CLOUDFLARE_D1_TOKEN=your-api-token-with-d1-permissions 
```

3. Push to main branch

### Production Environment Variables

Update the `wrangler.jsonc` files in each app with your production values:

- **Custom domains** (replace `orangecloud.app` with your domain)
- **Database IDs** (your Cloudflare D1 database)
- **API tokens and secrets**

## 🔧 Configuration Guide

### Setting Up Cloudflare R2

1. **Create an R2 bucket** in your Cloudflare dashboard
2. **Generate API tokens**:
   - Account ID: Found in Cloudflare dashboard
   - API Token: Create with Workers and R2 permissions
   - R2 Access Keys: Create in R2 settings

3. **Configure in OrangeCloud**:
   - Navigate to Settings after logging in
   - Enter your Cloudflare credentials
   - Validate and save configuration

### OAuth Setup (Optional)

#### GitHub OAuth
1. Create a GitHub OAuth app
2. Set authorization callback URL: `https://your-domain.com/auth/github`
3. Add client ID and secret to environment variables

#### Google OAuth  
1. Create a Google OAuth 2.0 client
2. Set authorized redirect URI: `https://your-domain.com/auth/google`
3. Add client ID and secret to environment variables

### Turnstile Setup (Optional)
1. Create a Turnstile site in Cloudflare dashboard
2. Add site key and secret key to environment variables
3. Turnstile will protect signup forms from abuse