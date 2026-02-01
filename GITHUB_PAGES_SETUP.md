# GitHub Pages Setup Guide

## The Problem

GitHub Pages serves your site from different URLs depending on your repository name:

1. **Root site** (`username.github.io` repo): `https://username.github.io/`
2. **Subdirectory** (any other repo): `https://username.github.io/repo-name/`

The blog uses absolute paths like `/styles/main.css` which work for root sites but break for subdirectory deployments.

## Solution

### Step 1: Determine Your Deployment Type

Check your GitHub repository name:
- If it's exactly `yourusername.github.io` → **Root deployment**
- If it's anything else (e.g., `my-blog`) → **Subdirectory deployment**

### Step 2: Update build.js

Edit `build.js` and set the correct `basePath`:

```javascript
const CONFIG = {
  // ... other config ...
  
  // For root deployment (username.github.io repo):
  basePath: '',
  
  // For subdirectory deployment (username.github.io/repo-name):
  // basePath: '/your-repo-name',
  
  // ... rest of config ...
};
```

### Step 3: Rebuild

```bash
npm run build
```

### Step 4: Deploy to GitHub Pages

#### Option A: Deploy from `/dist` folder (Recommended)

1. Push your code to GitHub
2. Go to **Settings** → **Pages**
3. Set **Source** to "Deploy from a branch"
4. Select your branch (e.g., `main`)
5. Select `/ (root)` folder
6. Click **Save**

#### Option B: Deploy only the dist folder

If you want to deploy only the built files:

```bash
# Install gh-pages if not already installed
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

## Troubleshooting

### CSS/JS not loading (404 errors)

**Symptom**: Page shows raw HTML without styling

**Cause**: Incorrect `basePath` setting

**Fix**: 
1. Check your GitHub Pages URL
2. If it's `username.github.io/repo-name/`, set `basePath: '/repo-name'`
3. Rebuild and redeploy

### Check browser console

Open your site in Chrome/Firefox and press F12 → Console. Look for 404 errors like:
```
GET https://username.github.io/styles/main.css 404
```

This confirms the path issue. The URL should be:
```
https://username.github.io/repo-name/styles/main.css
```

### Verify paths in generated HTML

Check `dist/index.html` to see the actual paths:

```bash
# For root deployment
grep "stylesheet" dist/index.html
# Should show: href="/styles/main.css"

# For subdirectory deployment (basePath: '/my-blog')
grep "stylesheet" dist/index.html
# Should show: href="/my-blog/styles/main.css"
```

## Quick Reference

| Your Repo Name | Your GitHub Pages URL | basePath Setting |
|----------------|----------------------|------------------|
| `john.github.io` | `https://john.github.io/` | `''` (empty) |
| `my-blog` | `https://john.github.io/my-blog/` | `'/my-blog'` |
| `portfolio` | `https://john.github.io/portfolio/` | `'/portfolio'` |

## Example Configurations

### Root Deployment (username.github.io)

```javascript
const CONFIG = {
  basePath: '',
  siteUrl: 'https://john.github.io',
  siteName: 'My Blog',
  // ...
};
```

### Subdirectory Deployment (username.github.io/blog)

```javascript
const CONFIG = {
  basePath: '/blog',
  siteUrl: 'https://john.github.io',
  siteName: 'My Blog',
  // ...
};
```

## Need Help?

1. Check your actual GitHub Pages URL in browser
2. Look at the 404 errors in browser console (F12)
3. Match your `basePath` to your repository name
4. Rebuild and redeploy
