# Nginx Multi‑Domain Hosting 

This guide explains how to host **multiple domains** on a single Nginx server using **separate server block files** (best practice). Each domain will have its own folder, logs, and server configuration.

---

##  **Step 1: Register Your Domain**

Buy a domain from any provider (Namecheap, GoDaddy, Hostinger, Cloudflare, etc.).

---

##  **Step 2: DNS Setup (A Record)**

In your domain DNS panel:

```
Type: A
Host: @
Value: <PUBLIC_IP_OF_SERVER>
TTL: Auto / Default
```

Also add the **www** record:

```
Type: A
Host: www
Value: <PUBLIC_IP_OF_SERVER>
```

This connects your domain → server.

---

##  **Step 3: Create Web Root Folders**

Each domain gets its own folder:

```bash
sudo mkdir -p /usr/share/nginx/html/example1.com
sudo mkdir -p /usr/share/nginx/html/example2.com
```

Place your `index.html` inside each folder.

---

##  **Step 4: Create Separate Server Block Files**

Best practice: Each domain has its own config file in `/etc/nginx/conf.d/`

---

### **🔹 example1.com → `/etc/nginx/conf.d/example1.conf`**

```nginx
server {
    listen 8080;

    server_name example1.com www.example1.com;
    root /usr/share/nginx/html/example1.com;
    index index.html;

    error_page 404 /404.html;

    access_log /var/log/nginx/example1.access.log;
    error_log  /var/log/nginx/example1.error.log;
}
```

---

### ** example2.com → `/etc/nginx/conf.d/example2.conf`**

```nginx
server {
    listen 80;

    server_name example2.com www.example2.com;
    root /usr/share/nginx/html/example2.com;
    index index.html;

    error_page 404 /404.html;

    location / {
        try_files $uri $uri/ =404;
    }

    access_log /var/log/nginx/example2.access.log;
    error_log  /var/log/nginx/example2.error.log;
}
```

---

##  **Step 5: Validate Nginx Config**

```bash
sudo nginx -t
```

If OK, restart:

```bash
sudo systemctl restart nginx
```

---

##  Important Notes

* `server_name` must match your domain
* Each domain gets **its own log files**
* Each domain file stays clean and separate
* Using `conf.d` is **production best practice**
* If using HTTPS, you will also add SSL blocks (certbot)

---

##  Completed!

Now both domains will open:

* [http://example1.com](http://example1.com) (8080 mapped via firewall or reverse proxy)
* [http://example2.com](http://example2.com) (normal port 80)

 