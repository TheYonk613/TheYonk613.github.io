#!/bin/bash

# Blog Post Generator Script for Younker Studio
# Run this after you finish working on your website to automatically generate a progress blog post

echo "🎯 Younker Studio - Blog Post Generator"
echo "========================================"

# Load nvm and Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Installing now..."
    nvm install node
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this script from your website directory."
    exit 1
fi

# Run the blog post generator
echo "📝 Checking for today's work activity..."
node generate-blog-post.js

echo ""
echo "✨ Done! Check the blog-posts directory for your new blog post."
echo "💡 Remember to commit and push your changes to include the new blog post."
