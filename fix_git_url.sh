#!/bin/bash

echo "Fixing Git URL format for GitHub authentication"

# The correct URL format for GitHub with Personal Access Token
# https://username:token@github.com/username/repository.git

# Fix the remote URL with correct format
git remote set-url origin https://thanasdinaku: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@github.com/thanasdinaku/ceshtje_ligjore.git

echo "Testing connection..."
git ls-remote origin

if [ $? -eq 0 ]; then
    echo "✅ Connection successful!"
    echo "You can now use git commands normally"
else
    echo "❌ Connection failed. Please check your token."
fi