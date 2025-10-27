---
description: Implement a GitHub issue from start to finish
argument-hint: [issue-number]
allowed-tools: Bash(gh:*), Bash(git:*)
model: claude-sonnet-4-5-20250929
---

# Implement GitHub Issue

You are tasked with implementing GitHub issue #$ARGUMENTS from start to finish.

## Workflow

### 1. Fetch Issue Details

- Use `gh issue view $ARGUMENTS --json title,body,labels,assignees` to get issue information
- Parse and understand the requirements
- Identify any linked issues or dependencies

### 2. Analyze Requirements

- Break down the issue into concrete, actionable tasks
- Identify files that need to be modified or created
- Consider edge cases and potential challenges
- Determine if tests are needed

### 3. Create Implementation Plan

Present a structured plan showing:

- Files to modify/create
- Key changes needed
- Testing strategy
- Estimated complexity

Ask for approval before proceeding.

### 4. Implement Changes

- Follow the project's coding standards (check CLAUDE.md if available)
- Write clean, well-documented code
- Include comments explaining complex logic
- Ensure code is production-ready

### 5. Testing

- Write or update tests to cover the new functionality
- Run existing tests to ensure nothing breaks
- Test edge cases identified earlier

### 6. Create Commit

- Stage all changes with `git add`
- Create a descriptive commit message following this format:

```
feat: implement feature X (#$ARGUMENTS)

Added functionality Y
Updated component Z
Added tests for edge cases

Closes #$ARGUMENTS
```

- Use conventional commit format (feat/fix/docs/refactor/test/chore)

### 7. Summary

Provide a summary including:

- What was implemented
- Files changed
- Any decisions made
- Suggestions for next steps

## Guidelines

- **Ask questions** if requirements are unclear
- **Follow project conventions** for code style, testing, and commits
- **Be thorough** - don't cut corners on code quality
- **Document decisions** - explain any non-obvious choices
- **Test thoroughly** - ensure the implementation is robust
- **Ensure** CI tests passing by runnung `task check`

## Important Notes

- This command assumes you have GitHub CLI (`gh`) installed and authenticated
- Make sure you're on the correct branch before running
- The commit will reference and close the issue automatically
- Review the changes before pushing to remote
