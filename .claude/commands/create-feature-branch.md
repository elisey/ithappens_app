---
description: Create a feature branch for a GitHub issue
argument-hint: [issue-number]
allowed-tools: Bash(gh:*), Bash(git:*)
model: claude-sonnet-4-5-20250929
---

# Create Feature Branch for GitHub Issue

Create a new feature branch for GitHub issue #$ARGUMENTS following best practices.

## Workflow

### 1. Check Current Git State

- Run `git status` to verify the working directory is clean
- If there are uncommitted changes, alert the user and stop
- Show current branch with `git branch --show-current`

### 2. Fetch Issue Information

- Run `gh issue view $ARGUMENTS --json number,title` to get issue details
- Parse the issue title to create a meaningful branch name
- Sanitize the title (lowercase, replace spaces with hyphens, remove special characters)

### 3. Identify Main Branch

- Detect the default branch name:
  - Run `git remote show origin | grep "HEAD branch"` to find default branch
  - Common names: `main`, `master`, `develop`
- Confirm the detected branch with the user

### 4. Fetch Latest Changes

- Run `git fetch origin` to get the latest remote changes
- Show a summary of what was fetched

### 5. Verify Base Branch Status

- Run `git branch -r` to confirm remote branch exists
- Check if local main/master is up to date with remote:
  - `git rev-parse HEAD` vs `git rev-parse origin/main`
  - If behind, recommend pulling first

### 6. Create Branch Name

Generate branch name using this format:

- `feature/issue-{number}-{sanitized-title}`
- Example: `feature/issue-123-add-user-authentication`

### 7. Create the Branch

- Run `git checkout -b {branch-name} origin/{main-branch}`
- This creates a new branch from the latest remote main/master
- Confirm the branch was created successfully
- Show the current branch

### 8. Verify Setup

- Run `git status` to show clean state
- Run `git log --oneline -3` to show recent commits
- Display branch tracking info with `git branch -vv`

### 9. Summary

Provide a clear summary:

```
✓ Created branch: feature/issue-123-add-user-authentication
✓ Based on: origin/main (commit abc1234)
✓ Issue: #123 - Add user authentication
✓ Ready for implementation
```

## Branch Naming Guidelines

Follow the project's branch naming convention if defined in CLAUDE.md.

Default format: `feature/issue-{number}-{sanitized-title}`

Keep branch names:

- Under 50 characters when possible
- Lowercase only
- Use hyphens, not underscores or spaces
- Descriptive but concise

## Error Handling

### Uncommitted Changes

If working directory is dirty:

```
❌ Cannot create branch: You have uncommitted changes
Please commit or stash your changes first:
  git stash
  # or
  git add . && git commit -m "your message"
```

### Branch Already Exists

If branch name already exists - use a different name

### Not on Main Branch

If currently on a feature branch:

```
⚠️  Warning: You're on branch 'feature/issue-456-other-work'
Recommended: Switch to main first
  git checkout main
  git pull origin main
Then try again.
```

### Issue Not Found

If GitHub issue doesn't exist:

```
❌ Issue #$ARGUMENTS not found
Please verify:
  - Issue number is correct
  - You have access to the repository
  - GitHub CLI is authenticated: gh auth status
```

## Important Notes

- **Always check working directory is clean** before creating branches
- **Fetch before creating** to ensure you have latest changes
- **Create from remote** (e.g., `origin/main`) not local branch
- **Never create branches with uncommitted work**
- **Use descriptive names** that include the issue number

## Assumptions

- GitHub CLI (`gh`) is installed and authenticated
- Git is configured properly
- You have access to the repository
- Issue number provided is valid
