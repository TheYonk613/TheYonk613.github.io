#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BlogPostGenerator {
    constructor() {
        this.blogDir = './blog-posts';
        this.templateDir = './blog-templates';
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.blogDir)) {
            fs.mkdirSync(this.blogDir, { recursive: true });
        }
        if (!fs.existsSync(this.templateDir)) {
            fs.mkdirSync(this.templateDir, { recursive: true });
        }
    }

    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    getLastBlogDate() {
        const blogFiles = fs.readdirSync(this.blogDir).filter(file => file.endsWith('.html'));
        if (blogFiles.length === 0) return null;
        
        // Sort by date and get the most recent
        const dates = blogFiles.map(file => {
            const match = file.match(/(\d{4}-\d{2}-\d{2})/);
            return match ? match[1] : null;
        }).filter(date => date);
        
        return dates.length > 0 ? dates.sort().pop() : null;
    }

    getGitActivity() {
        try {
            const today = this.getTodayDate();
            // Use a more flexible date range to account for timezone differences
            const commits = execSync(`git log --since="${today} 00:00" --until="${today} 23:59" --pretty=format:"%h|%s|%an|%ad" --date=short`, { encoding: 'utf8' });
            return commits.trim().split('\n').filter(line => line.length > 0);
        } catch (error) {
            console.log('No git activity found for today');
            return [];
        }
    }

    hasWorkActivity() {
        const commits = this.getGitActivity();
        return commits.length > 0;
    }

    getProjectFeatures() {
        const features = {
            'drum-notation-tool': {
                name: 'Drum Notation Generator',
                description: 'Interactive tool for converting drum notation to professional sheet music',
                tech: ['HTML5', 'CSS3', 'JavaScript', 'VexFlow.js', 'SVG'],
                status: 'Complete'
            },
            'clean-urls': {
                name: 'Clean URL System',
                description: 'Professional URL structure without file extensions',
                tech: ['Jekyll', 'GitHub Pages', 'Custom Domain'],
                status: 'Complete'
            },
            'responsive-design': {
                name: 'Responsive Design',
                description: 'Mobile-friendly layout and navigation',
                tech: ['Bootstrap', 'CSS3', 'Flexbox'],
                status: 'Complete'
            },
            'portfolio-pages': {
                name: 'Portfolio Pages',
                description: 'Individual project showcase pages',
                tech: ['HTML5', 'CSS3', 'JavaScript'],
                status: 'Complete'
            }
        };
        return features;
    }

    generateBlogContent() {
        const today = this.getTodayDate();
        const commits = this.getGitActivity();
        const features = this.getProjectFeatures();
        
        let content = `<!DOCTYPE HTML>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Website Development Progress - ${today} - Younker Studio</title>
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
                        <h1>Website Development Progress - ${today}</h1>
                        <p class="meta">Development Update | ${new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        
                        <div class="progress-summary">
                            <h2>Today's Development Summary</h2>
                            <p>Another productive day working on the Younker Studio website. Here's what was accomplished:</p>
                        </div>

                        <div class="git-activity">
                            <h3>Git Activity (${commits.length} commits)</h3>
                            <div class="commit-list">
                                ${commits.map(commit => {
                                    const [hash, message, author, date] = commit.split('|');
                                    return `<div class="commit-item">
                                        <strong>${message}</strong><br>
                                        <small>Commit: ${hash.substring(0, 7)} | ${date}</small>
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>

                        <div class="features-overview">
                            <h3>Current Project Features</h3>
                            ${Object.entries(features).map(([key, feature]) => `
                                <div class="feature-card">
                                    <h4>${feature.name}</h4>
                                    <p>${feature.description}</p>
                                    <div class="tech-stack">
                                        ${feature.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                                    </div>
                                    <p><strong>Status:</strong> ${feature.status}</p>
                                </div>
                            `).join('')}
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
</html>`;

        return content;
    }

    generateBlogPost() {
        const today = this.getTodayDate();
        const lastBlogDate = this.getLastBlogDate();
        
        // Check if we already have a blog post for today
        if (lastBlogDate === today) {
            console.log(`Blog post for ${today} already exists. Skipping...`);
            return false;
        }
        
        // Check if there was any work activity today
        if (!this.hasWorkActivity()) {
            console.log(`No work activity detected for ${today}. Skipping blog post generation...`);
            return false;
        }
        
        // Generate the blog post
        const content = this.generateBlogContent();
        const filename = `blog-post-${today}.html`;
        const filepath = path.join(this.blogDir, filename);
        
        fs.writeFileSync(filepath, content);
        console.log(`✅ Blog post generated: ${filename}`);
        
        // Update the main blog page to include the new post
        this.updateBlogIndex(filename, today);
        
        return true;
    }

    generateBlogPostForDate(targetDate) {
        // Check if we already have a blog post for this date
        const existingBlogPost = path.join(this.blogDir, `blog-post-${targetDate}.html`);
        if (fs.existsSync(existingBlogPost)) {
            console.log(`Blog post for ${targetDate} already exists. Skipping...`);
            return false;
        }
        
        // Check if there was any work activity on this date
        if (!this.hasWorkActivityForDate(targetDate)) {
            console.log(`No work activity detected for ${targetDate}. Skipping blog post generation...`);
            return false;
        }
        
        // Generate the blog post for the specific date
        const content = this.generateBlogContentForDate(targetDate);
        const filename = `blog-post-${targetDate}.html`;
        const filepath = path.join(this.blogDir, filename);
        
        fs.writeFileSync(filepath, content);
        console.log(`✅ Blog post generated for ${targetDate}: ${filename}`);
        
        return true;
    }

    hasWorkActivityForDate(date) {
        try {
            const commits = execSync(`git log --since="${date} 00:00" --until="${date} 23:59" --pretty=format:"%h|%s|%an|%ad" --date=short`, { encoding: 'utf8' });
            return commits.trim().split('\n').filter(line => line.length > 0).length > 0;
        } catch (error) {
            return false;
        }
    }

    generateBlogContentForDate(date) {
        const commits = this.getGitActivityForDate(date);
        const features = this.getProjectFeatures();
        
        let content = `<!DOCTYPE HTML>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Website Development Progress - ${date} - Younker Studio</title>
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
                        <h1>Website Development Progress - ${date}</h1>
                        <p class="meta">Development Update | ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        
                        <div class="progress-summary">
                            <h2>Development Summary for ${date}</h2>
                            <p>Progress made on the Younker Studio website. Here's what was accomplished:</p>
                        </div>

                        <div class="git-activity">
                            <h3>Git Activity (${commits.length} commits)</h3>
                            <div class="commit-list">
                                ${commits.map(commit => {
                                    const [hash, message, author, commitDate] = commit.split('|');
                                    return `<div class="commit-item">
                                        <strong>${message}</strong><br>
                                        <small>Commit: ${hash.substring(0, 7)} | ${commitDate}</small>
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>

                        <div class="features-overview">
                            <h3>Current Project Features</h3>
                            ${Object.entries(features).map(([key, feature]) => `
                                <div class="feature-card">
                                    <h4>${feature.name}</h4>
                                    <p>${feature.description}</p>
                                    <div class="tech-stack">
                                        ${feature.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                                    </div>
                                    <p><strong>Status:</strong> ${feature.status}</p>
                                </div>
                            `).join('')}
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
</html>`;

        return content;
    }

    getGitActivityForDate(date) {
        try {
            const commits = execSync(`git log --since="${date} 00:00" --until="${date} 23:59" --pretty=format:"%h|%s|%an|%ad" --date=short`, { encoding: 'utf8' });
            return commits.trim().split('\n').filter(line => line.length > 0);
        } catch (error) {
            return [];
        }
    }

    updateBlogIndex(newPostFile, date) {
        const blogIndexPath = './blog.html';
        if (!fs.existsSync(blogIndexPath)) {
            console.log('Blog index not found. Creating new blog posts will be added manually.');
            return;
        }
        
        // Read the current blog index
        let blogContent = fs.readFileSync(blogIndexPath, 'utf8');
        
        // Add the new blog post to the list (this would need to be customized based on your blog structure)
        console.log(`📝 New blog post ${newPostFile} created. Please add it to your blog index manually.`);
    }
}

// Main execution
if (require.main === module) {
    const generator = new BlogPostGenerator();
    
    // Generate blog post for today
    const todayGenerated = generator.generateBlogPost();
    
    // Generate blog post for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayGenerated = generator.generateBlogPostForDate(yesterdayDate);
    
    if (todayGenerated || yesterdayGenerated) {
        console.log('🎉 Blog post(s) generated successfully!');
        console.log('💡 Tip: You can run this script after each work session to automatically document your progress.');
    } else {
        console.log('📝 No blog posts generated (no work activity or already exists)');
    }
}

module.exports = BlogPostGenerator;
