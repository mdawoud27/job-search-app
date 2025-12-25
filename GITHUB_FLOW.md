# Github Flow

## 1. Create an Issue

```bash
[<type>]: <short-description>

# Examples
[FIX]: Fix auth flow
[FEATURE]: Implement views using EJS
```

## 2. Create a Branch

```bash
<type>/<issue-number>/<short_description_using_underscore>

# Examples
fix/92/fix_auth_flow
feature/3/implement_views_using_ejs

# Go to local repo
git fetch origin
git checkout <branch-name> # or git switch <branch-name>
```

## 3. Commit Your Changes

After finish your task you should commit your changes.. use descriptive messages

```bash
# Examples
docs: create API docs
feat: implement signup function
```

- `feat`: For new features.
- `fix`: For bug fixes.
- `docs`: For documentation updates.
- `chore`: For maintenance tasks like updating dependencies.
- `style`: For code style changes (e.g., formatting, missing semi-colons).
- `refactor`: For code restructuring without changing functionality.
- `test`: For adding or updating tests.
- `build`: For changes to build scripts or dependencies.
- `perf`: For performance improvements.
- `ci`: For CI/CD changes.
- `revert`: For reverting a previous commit.

```bash
git add .
git commit -m "<type>: short-description"
git push origin <your-branch-name> # DONT push to main branch
```

## 4. Create a Pull Request

Use a clear title that reflects the branch name

```bash
feature/implement-views-using-ejs
fix/login-function
docs/create-api-docs
```

## 5. Code Review

Assign one reviewer to check the code before merging.

## 6. Merge and Clean Up

Merge the PR, close the issue, and delete the branch.

```bash
# Delete the local branch
git checkout main # or git switch main
git pull origin main
git branch -d <your-branch-name>
```
