#!/bin/bash
# Script de vérification DB — exécuter avec : bash server/scripts/db-check.sh
sudo -u postgres psql -d ccadb -c "SELECT slug, title FROM wiki_pages WHERE category_slug = 'guide-fertilisation' ORDER BY created_at;"
sudo -u postgres psql -d ccadb -c "SELECT COUNT(*) as total_users FROM users;"
sudo -u postgres psql -d ccadb -c "\dt user_*"
