#!/bin/bash

# Simple Blog Post Generator for Younker Studio
# This script generates blog posts only on days when you work on the website

echo "🎯 Younker Studio - Blog Post Generator"
echo "========================================"

# Get today's date
TODAY=$(date +%Y-%m-%d)
TODAY_READABLE=$(date '+%A, %B %d, %Y')

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this script from your website directory."
    exit 1
fi

# Check for today's git activity
echo "📝 Checking for today's work activity..."
TODAY_COMMITS=$(git log --since="$TODAY" --pretty=format:"%h|%s|%an|%ad" --date=short 2>/dev/null | wc -l)

if [ "$TODAY_COMMITS" -eq 0 ]; then
    echo "❌ No work activity detected for today ($TODAY). Skipping blog post generation..."
    echo "💡 Make some commits first, then run this script again!"
    exit 0
fi

# Create blog-posts directory if it doesn't exist
mkdir -p blog-posts

# Check if blog post already exists for today
if [ -f "blog-posts/blog-post-$TODAY.html" ]; then
    echo "📝 Blog post for $TODAY already exists. Skipping..."
    exit 0
fi

# Get today's commits
COMMITS=$(git log --since="$TODAY" --pretty=format:"%h|%s|%an|%ad" --date=short 2>/dev/null)

# Generate the blog post content
cat > "blog-posts/blog-post-$TODAY.html" << EOF
<!DOCTYPE HTML>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Website Development Progress - $TODAY - Younker Studio</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Daily progress update on website development and new features added to Younker Studio portfolio." />
    <meta name="keywords" content="web development, portfolio, progress, Netanel Younker, Younker Studio" />
    <meta name="author" content="Netanel Moshe Younker" />

    <link href="https://fonts.googleapis.com/css?family=Oxygen:300,400" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600,700" rel="stylesheet">
    
    <link rel="stylesheet" href="../css/animate.css">
    <link rel="stylesheet" href="../css/icomoon.css">
    <link rel="stylesheet" href="../css/bootstrap.css">
    <link rel="stylesheet" href="../css/magnific-popup.css">
    <link rel="stylesheet" href="../css/flexslider.css">
    <link rel="stylesheet" href="../css/style.css">

    <style>
        .progress-timeline {
            border-left: 3px solid #2c98f0;
            padding-left: 20px;
            margin: 20px 0;
        }
        .progress-item {
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .commit-list {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .feature-card {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            background: white;
        }
        .tech-tag {
            display: inline-block;
            background: #2c98f0;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin: 2px;
        }
        .commit-item {
            margin-bottom: 10px;
            padding: 8px;
            background: white;
            border-radius: 4px;
            border-left: 3px solid #2c98f0;
        }
    </style>
</head>
<body>
    <div class="container-wrap">
        <nav class="fh5co-nav" role="navigation">
            <div class="container">
                <div class="row">
                    <div class="col-xs-2">
                        <div id="fh5co-logo"><a href="../index.html">Younker Studio</a></div>
                    </div>
                    <div class="col-xs-10 text-right menu-1">
                        <ul>
                            <li><a href="../index.html">Home</a></li>
                            <li><a href="../drums.html">Drums</a></li>
                            <li><a href="../blog.html">Blog</a></li>
                            <li><a href="../about.html">About</a></li>
                            <li><a href="../resume.html">Resume</a></li>
                            <li><a href="../contact.html">Contact</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>

        <div class="container">
            <div class="row">
                <div class="col-md-8 col-md-offset-2">
                    <div class="blog-post">
                        <h1>Website Development Progress - $TODAY</h1>
                        <p class="meta">Development Update | $TODAY_READABLE</p>
                        
                        <div class="progress-summary">
                            <h2>Today's Development Summary</h2>
                            <p>Another productive day working on the Younker Studio website. Here's what was accomplished:</p>
                        </div>

                        <div class="git-activity">
                            <h3>Git Activity ($TODAY_COMMITS commits)</h3>
                            <div class="commit-list">
EOF

# Add commit details
while IFS='|' read -r hash message author date; do
    if [ ! -z "$hash" ]; then
        cat >> "blog-posts/blog-post-$TODAY.html" << EOF
                                <div class="commit-item">
                                    <strong>$(echo "$message" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')</strong><br>
                                    <small>Commit: ${hash:0:7} | $date</small>
                                </div>
EOF
    fi
done <<< "$COMMITS"

# Continue with the rest of the HTML
cat >> "blog-posts/blog-post-$TODAY.html" << EOF
                            </div>
                        </div>

                        <div class="features-overview">
                            <h3>Current Project Features</h3>
                            <div class="feature-card">
                                <h4>Drum Notation Generator</h4>
                                <p>Interactive tool for converting drum notation to professional sheet music</p>
                                <div class="tech-stack">
                                    <span class="tech-tag">HTML5</span>
                                    <span class="tech-tag">CSS3</span>
                                    <span class="tech-tag">JavaScript</span>
                                    <span class="tech-tag">VexFlow.js</span>
                                    <span class="tech-tag">SVG</span>
                                </div>
                                <p><strong>Status:</strong> Complete</p>
                            </div>
                            
                            <div class="feature-card">
                                <h4>Clean URL System</h4>
                                <p>Professional URL structure without file extensions</p>
                                <div class="tech-stack">
                                    <span class="tech-tag">Jekyll</span>
                                    <span class="tech-tag">GitHub Pages</span>
                                    <span class="tech-tag">Custom Domain</span>
                                </div>
                                <p><strong>Status:</strong> Complete</p>
                            </div>
                            
                            <div class="feature-card">
                                <h4>Responsive Design</h4>
                                <p>Mobile-friendly layout and navigation</p>
                                <div class="tech-stack">
                                    <span class="tech-tag">Bootstrap</span>
                                    <span class="tech-tag">CSS3</span>
                                    <span class="tech-tag">Flexbox</span>
                                </div>
                                <p><strong>Status:</strong> Complete</p>
                            </div>
                            
                            <div class="feature-card">
                                <h4>Portfolio Pages</h4>
                                <p>Individual project showcase pages</p>
                                <div class="tech-stack">
                                    <span class="tech-tag">HTML5</span>
                                    <span class="tech-tag">CSS3</span>
                                    <span class="tech-tag">JavaScript</span>
                                </div>
                                <p><strong>Status:</strong> Complete</p>
                            </div>
                        </div>

                        <div class="next-steps">
                            <h3>Next Steps</h3>
                            <ul>
                                <li>Continue improving the drum notation tool</li>
                                <li>Add more interactive features</li>
                                <li>Optimize performance and loading times</li>
                                <li>Add analytics and user feedback</li>
                            </ul>
                        </div>

                        <div class="blog-navigation">
                            <a href="../blog.html" class="btn btn-primary">← Back to Blog</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="../js/jquery.min.js"></script>
    <script src="../js/jquery.easing.1.3.js"></script>
    <script src="../js/bootstrap.min.js"></script>
    <script src="../js/jquery.waypoints.min.js"></script>
    <script src="../js/jquery.flexslider-min.js"></script>
    <script src="../js/jquery.magnific-popup.min.js"></script>
    <script src="../js/magnific-popup-options.js"></script>
    <script src="../js/jquery.countTo.js"></script>
    <script src="../js/main.js"></script>
</body>
</html>
EOF

echo "✅ Blog post generated: blog-posts/blog-post-$TODAY.html"
echo ""
echo "🎉 Blog post generated successfully!"
echo "💡 Remember to:"
echo "   1. Review the generated blog post"
echo "   2. Add it to your blog index if needed"
echo "   3. Commit and push your changes"
echo ""
echo "📝 You can run this script after each work session to automatically document your progress."
