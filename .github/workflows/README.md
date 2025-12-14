# GitHub Actions Workflow Setup

## npm Publish Workflow

This repository includes a GitHub Actions workflow that automatically publishes the package to npm when a release is created.

### Setup

1. **Create an npm token:**
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token"
   - Select "Automation" token type
   - Copy the token (starts with `npm_`)

2. **Add the token to GitHub Secrets:**
   - Go to your repository: https://github.com/creasoftlb/keyclaim-nodejs
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

### How it works

The workflow triggers automatically when:
- A new GitHub release is created
- You manually trigger it from the Actions tab (workflow_dispatch)

### Workflow steps

1. **Build and Test:**
   - Checks out the code
   - Sets up Node.js 20
   - Installs dependencies
   - Builds the package
   - Verifies build output

2. **Publish to npm:**
   - Only runs if build succeeds
   - Publishes to npm registry with `@keyclaim` scope
   - Uses the `NPM_TOKEN` secret for authentication

### Manual trigger

You can manually trigger the workflow:
1. Go to Actions tab in GitHub
2. Select "Publish to npm" workflow
3. Click "Run workflow"
4. Optionally specify a version bump type (patch, minor, major)

### Requirements

- The `NPM_TOKEN` secret must be configured in GitHub repository settings
- Your npm account must have permission to publish to the `@keyclaim` scope
- The package version in `package.json` must be incremented before creating a release

