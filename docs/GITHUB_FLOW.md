# GitHub Flow

## 1. Create an Issue

```bash
[<type>]: <short-description>

# Examples
[FIX]: Fix auth flow
[FEAT]: Implement CV upload
```

## 2. Create a Branch

Branch names must follow this pattern:

```bash
<type>/<issue-number>/<short_description_using_underscore>
<type>/<short_description_using_underscore>

# Examples
fix/92/fix_auth_flow
feat/3/implement_cv_upload
docs/update_erd
```

Valid branch prefixes: `feat`, `fix`, `build`, `chore`, `refactor`, `docs`, `perf`, `test`, `ci`

```bash
# Check out the branch locally
git fetch origin
git checkout <branch-name>  # or: git switch <branch-name>
```

## 3. Commit Your Changes

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
<type>: <short description>

# Examples
feat: implement CV upload endpoint
fix: resolve OTP expiry race condition
docs: update ERD diagram
refactor: extract auth logic into service layer
```

Available commit types:

| Type       | When to use                                         |
| ---------- | --------------------------------------------------- |
| `feat`     | New feature                                         |
| `fix`      | Bug fix                                             |
| `docs`     | Documentation only                                  |
| `chore`    | Maintenance tasks (e.g. updating dependencies)      |
| `style`    | Code style changes (formatting, missing semicolons) |
| `refactor` | Code restructuring without changing behaviour       |
| `test`     | Adding or updating tests                            |
| `build`    | Changes to build scripts or dependencies            |
| `perf`     | Performance improvements                            |
| `ci`       | CI/CD configuration changes                         |
| `revert`   | Reverting a previous commit                         |

```bash
git add .
git commit -m "<type>: short description"
git push origin <your-branch-name>   # Never push directly to main
```

## 4. Create a Pull Request

PR titles must follow Conventional Commits format, same as commit messages:

```bash
feat: implement CV upload endpoint
fix: resolve login redirect bug
docs: add API usage examples
```

> ⚠️ The PR title is validated automatically by CI. A title like `feat/implement-cv-upload` (branch name format) will fail validation.

## 5. Code Review

Assign at least one reviewer before merging. Address all review comments before requesting a re-review.

## 6. Merge and Clean Up

Once approved, merge the PR, close the linked issue, and delete the branch.

```bash
# Clean up your local branch after merge
git checkout main       # or: git switch main
git fetch origin
git rebase origin/main
git branch -d <your-branch-name>
```
