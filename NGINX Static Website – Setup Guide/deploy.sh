#!/bin/bash

#==============================================================
#  Complete setup to host a website on nginx server script
#===============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

project="example-project"
config_file="config-file"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} COMPLETE SETUP TO HOST A WEBSITE ON NGINX${NC}"
echo -e "${BLUE}============================================${NC}"

if [[ $EUID -ne 0 ]]; then
  echo -e "${RED}[!] This script must be run as a root${NC}"
  exit 1
fi

if [[ ! -d $project ]]; then
  echo -e "${RED}[!] Project folder not found in the current directory${NC}"
  exit 1
fi

echo -e "${YELLOW}[*]PHASE 1: Updating System Package....${NC}"
apt-get update


echo -e "${YELLOW}[*]PHASE 2: Installing Packages....${NC}"
apt-get install nginx -y

echo  -e "${YELLOW}[*]PHASE 3: APPLICATION DEPLOYMENT${NC}"
echo ""

echo -e "${YELLOW}[*] Creating directories...${NC}"
mkdir -p /var/www/$project

echo -e "${YELLOW}[*] Copying application...${NC}"

cp -r $project/* /var/www/$project/

echo -e "${YELLOW}[*] Setting permissions...${NC}"
mkdir -p /var/www/$project/logs
chown -R www-data:www-data /var/www/$project
chmod -R 755 /var/www/$project

echo -e "${GREEN}[+] Application deployment completed${NC}"
echo ""

echo  -e "${YELLOW}[*]PHASE 4: NGINX DEPLOYMENT${NC}"
echo ""

echo  -e "${YELLOW}[*] Copying nginx.config file...${NC}"

if [[ ! -f $config_file ]]; then
  echo -e "${RED}[!] Nginx config file not found${NC}"
  exit 1
fi

cp $config_file /etc/nginx/sites-available/


echo  -e "${YELLOW}[*] Enabling site...${NC}"

rm /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/$config_file /etc/nginx/sites-enabled/
nginx -t

echo  -e "${YELLOW}[*] Reloading and Restarting nginx...${NC}"

systemctl reload nginx
sudo systemctl restart nginx
sudo systemctl status nginx

echo -e "${GREEN}[+] service started and enabled${NC}"

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}VERIFICATION & SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Service Status:${NC}"
echo "NGINX:  $(systemctl is-active nginx)"
echo -e "${YELLOW}Checking Port Status:${NC}"
ss -tulnp | grep :80


echo -e "${BLUE}Access Application:${NC}"
echo "Access your app at: http://localhost:80"

