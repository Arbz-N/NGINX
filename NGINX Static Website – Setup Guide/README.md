Nginx Static Website Deployment Project
📌 Project Overview

This project demonstrates how to deploy a static website on an Nginx web server using a structured and automated approach. It includes:

A sample static website (HTML + CSS)

Custom Nginx server configuration

A deployment automation script

Proper Linux directory structure and permissions

The goal of this project is to provide a hands-on DevOps learning example for understanding:

Web server configuration

Static website hosting

Linux file permissions

Nginx site enabling

Basic deployment automation

📂 Project Structure
NGINX Static Website - Setup Guide/
└── example-project/
    ├── css/
    ├── index.html
    ├── config-file
    ├── deploy.sh
    └── README.md

📁 File & Folder Explanation
1️⃣ css/

Contains the website styling files.

styles.css → Controls layout, colors, and design of the website.

2️⃣ index.html

Main webpage file served by Nginx.

It includes:

Page structure

Content

Link to the CSS stylesheet

3️⃣ config-file

Custom Nginx server block configuration.

This file:

Defines server port (8080)

Sets website root directory (/var/www/example-project)

Handles static file serving

Configures access and error logs

It is copied to:

/etc/nginx/sites-available/


and then enabled in:

/etc/nginx/sites-enabled/

4️⃣ deploy.sh

Automation script to deploy the website.

The script performs:

System update

Nginx installation

Application file deployment

Permission configuration

Nginx config setup

Service restart and validation

Run with:

sudo bash deploy.sh

5️⃣ README.md

Project documentation file explaining setup and structure.

⚙️ How Deployment Works

Website files are copied to:

/var/www/example-project


Nginx configuration is activated.

Nginx service reloads.

The website becomes accessible at:

http://localhost:8080

🎯 Learning Outcomes

After completing this project, you will understand:

How Nginx serves static content

Difference between sites-available and sites-enabled

How deployment scripts automate infrastructure tasks

Proper Linux permission management

Web server directory structure