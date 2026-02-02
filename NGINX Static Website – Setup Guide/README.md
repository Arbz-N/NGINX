**_NGINX Static Website – Setup Guide_**

    This tiny project demonstrates how to host a simple static website (HTML & CSS pages) using NGINX on a Linux machine. 
    It guides you through the basics of:
    Creating a document root for your website Configuring NGINX with a custom server block Serving your page on a custom port (8080) Verifying the setup
    This is a beginner-friendly project to understand how NGINX handles static content.

**_Prerequisites_**

Make sure you have:

    A Linux machine (for example, an EC2 Ubuntu instance)
    sudo privileges NGINX installed Verify installation: which nginx
    
    If blank → install NGINX:
    
    sudo apt install nginx -y # For Ubuntu/Debian
    OR
    sudo yum install nginx -y # For CentOS/RHEL

Step 1 — Create Website Directory

    Create a directory for your website inside NGINX’s default web root:
    
    sudo mkdir -p /usr/share/nginx/html/example.com
    
    Here example.com is used as an example folder name.

Step 2 — Add HTML & CSS Files

    Create the main homepage:
    
    sudo vim /usr/share/nginx/html/example.com/index.html (there is a index.html page in repository to practice)
    
    Paste your HTML code, save, and exit.
    
    Then create your CSS file:
    
    sudo vim /usr/share/nginx/html/example.com/styles.css (there is a styles.css page in repository to practice)
    
    Paste your CSS code, save, and exit.

Step 3 — Configure nginx.conf

    NGINX’s main configuration file is nginx.conf. Add the following block inside the http {} section:

    events {}
    
    http { include mime.types; # Required for proper linking of CSS
    
      # SERVER BLOCK FOR STATIC WEBSITE
      server {
          listen 8080;  # You can use any port; default is 80
          root /usr/share/nginx/html/example.com/;
          index index.html;
    
          # If file not found → return 404
          location / {
              try_files $uri $uri/ =404;  # Check requested file, then directory; else return 404
          }
      }
    }
Step 4 — Restart NGINX

    Apply the configuration changes:
    sudo systemctl restart nginx
    Check NGINX status:
    sudo systemctl status nginx

Step 5 — Test Your Website

Open a browser: http://:8080

    Or use curl: curl http://localhost:8080
    
    You should see your static page displayed.
    
    Congratulations! You have successfully hosted a static page using NGINX on your machine. Note: Read each file carefully before executing any command. This project is for learning and practice purposes. Remove test files when done:
    
    sudo rm -rf /usr/share/nginx/html/example.com
