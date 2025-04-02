import git
from datetime import datetime
import os

# Default ignore patterns - you can customize this list
DEFAULT_IGNORE_PATTERNS = {
    # Directories
    "node_modules/",
    "venv/",
    ".git/",
    "__pycache__/",
    "build/",
    "dist/",
    ".idea/",
    ".vscode/",
    # Files
    "*.pyc",
    "*.pyo",
    "*.pyd",
    ".DS_Store",
    "*.log",
    "package-lock.json",
    "yarn.lock",
    "*.min.js",
    "*.css",
}


def should_ignore_file(file_path, ignore_patterns):

    file_path = file_path.replace("\\", "/")

    for pattern in ignore_patterns:
        if pattern.endswith("/"):
            if any(part.startswith(".") for part in file_path.split("/")):
                return True
            if any(part == pattern[:-1] for part in file_path.split("/")):
                return True
        elif pattern.startswith("*."):
            if file_path.endswith(pattern[1:]):
                return True
        elif file_path == pattern:
            return True
    return False


def analyze_commits(repo_path, ignore_patterns=None):
    if ignore_patterns is None:
        ignore_patterns = DEFAULT_IGNORE_PATTERNS

    repo = git.Repo(repo_path)
    commits = list(repo.iter_commits())

    total_insertions = 0
    total_deletions = 0
    total_files_changed = 0

    print("Commit History Analysis:")
    print("=" * 50)

    for commit in commits:
        filtered_stats = {"files": 0, "insertions": 0, "deletions": 0}

        for file_path, file_stats in commit.stats.files.items():
            if not should_ignore_file(file_path, ignore_patterns):
                filtered_stats["files"] += 1
                filtered_stats["insertions"] += file_stats["insertions"]
                filtered_stats["deletions"] += file_stats["deletions"]

        total_insertions += filtered_stats["insertions"]
        total_deletions += filtered_stats["deletions"]
        total_files_changed += filtered_stats["files"]

        print(f"Commit: {commit.hexsha[:7]}")
        print(f"Author: {commit.author}")
        print(
            f"Date: {datetime.fromtimestamp(commit.authored_date).strftime('%Y-%m-%d %H:%M:%S')}"
        )
        print(f"Message: {commit.message.strip()}")
        print(f"Files changed: {filtered_stats['files']}")
        print(f"Insertions: +{filtered_stats['insertions']}")
        print(f"Deletions: -{filtered_stats['deletions']}")
        print("-" * 50)

    # Summary statistics
    print("\nRepository Summary (excluding ignored files):")
    print("=" * 50)
    print(f"Total number of commits: {len(commits)}")
    print(f"Total files changed: {total_files_changed}")
    print(f"Total lines added: +{total_insertions}")
    print(f"Total lines removed: -{total_deletions}")
    print(f"Net line changes: {total_insertions - total_deletions}")
    print(f"Total lines modified: {total_insertions + total_deletions}")


if __name__ == "__main__":
    # Use default ignore patterns
    analyze_commits(".")

    # Or specify your own ignore patterns
    # custom_ignore = {
    #     'node_modules/',
    #     'dist/',
    #     '*.log',
    #     'specific_file.txt'
    # }
    # analyze_commits(".", custom_ignore)
