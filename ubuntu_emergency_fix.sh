systemctl stop albpetrol-legal
cd /opt/ceshtje_ligjore/ceshtje_ligjore
cp client/src/components/case-table.tsx client/src/components/case-table.tsx.backup2
# Restore from backup first
cp client/src/components/case-table.tsx.backup client/src/components/case-table.tsx
