#!/bin/bash

echo "=================================="
echo "Attachment Window Update Deployment"
echo "=================================="

# Navigate to project directory
cd /opt/ceshtje-ligjore || exit 1

# Backup current files
echo "📦 Creating backup..."
mkdir -p backups
cp client/src/components/case-entry-form.tsx backups/case-entry-form.tsx.backup.$(date +%Y%m%d_%H%M%S)
cp client/src/components/case-edit-form.tsx backups/case-edit-form.tsx.backup.$(date +%Y%m%d_%H%M%S)

# Update case-entry-form.tsx - Fix attachment window position
echo "📝 Updating case-entry-form.tsx..."
sed -i '527,596s/.*//' client/src/components/case-entry-form.tsx

# Insert the new attachment section at line 527
sed -i '527a\
              {/* Document Attachments */}\
              <div className="space-y-6">\
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dokumente të Bashkangjitura</h3>\
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">\
                  {/* Left side: Square upload area */}\
                  <div className="md:col-span-1">\
                    <div className="aspect-square">\
                      <DocumentUploader\
                        maxNumberOfFiles={5}\
                        maxFileSize={10485760}\
                        onComplete={handleUploadComplete}\
                      />\
                    </div>\
                    <p className="text-xs text-gray-500 mt-2 text-center">\
                      Mund të bashkangjitnit dokumente PDF ose Word që lidhen me çështjen ligjore\
                    </p>\
                  </div>\
                  \
                  {/* Right side: Display uploaded attachments */}\
                  <div className="md:col-span-2">\
                    {attachments.length > 0 ? (\
                      <div className="space-y-3">\
                        <h4 className="text-sm font-medium text-gray-700">\
                          Dokumente të Ngarkuara ({attachments.length})\
                        </h4>\
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\
                          {attachments.map((attachment, index) => (\
                            <div\
                              key={index}\
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"\
                            >\
                              <div className="flex items-center space-x-2 min-w-0">\
                                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />\
                                <span className="text-sm text-gray-700 truncate" title={attachment.name}>\
                                  {attachment.name}\
                                </span>\
                              </div>\
                              <div className="flex items-center space-x-1">\
                                <Button\
                                  type="button"\
                                  variant="ghost"\
                                  size="sm"\
                                  onClick={() => window.open(attachment.path, '"'"'_blank'"'"')}\
                                  className="h-8 w-8 p-0"\
                                  data-testid={`download-attachment-${index}`}\
                                >\
                                  <Download className="h-3 w-3" />\
                                </Button>\
                                <Button\
                                  type="button"\
                                  variant="ghost"\
                                  size="sm"\
                                  onClick={() => removeAttachment(index)}\
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"\
                                  data-testid={`remove-attachment-${index}`}\
                                >\
                                  <Trash2 className="h-3 w-3" />\
                                </Button>\
                              </div>\
                            </div>\
                          ))}\
                        </div>\
                      </div>\
                    ) : (\
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">\
                        Asnjë dokument i ngarkuar ende\
                      </div>\
                    )}\
                  </div>\
                </div>\
              </div>' client/src/components/case-entry-form.tsx

echo "✅ case-entry-form.tsx updated using sed"

# Update case-edit-form.tsx using sed for attachment section
echo "📝 Updating case-edit-form.tsx..."
# Find and replace the attachment section (approximately lines 290-360)
sed -i '/Document Attachments/,/^              <\/div>$/c\
              {/* Document Attachments */}\
              <div className="space-y-6">\
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dokumente të Bashkangjitura</h3>\
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">\
                  {/* Left side: Square upload area */}\
                  <div className="md:col-span-1">\
                    <div className="aspect-square">\
                      <DocumentUploader\
                        maxNumberOfFiles={5}\
                        maxFileSize={10485760}\
                        onComplete={handleUploadComplete}\
                      />\
                    </div>\
                    <p className="text-xs text-gray-500 mt-2 text-center">\
                      Mund të bashkangjitnit dokumente PDF ose Word që lidhen me çështjen ligjore\
                    </p>\
                  </div>\
\
                  {/* Right side: Display uploaded attachments */}\
                  <div className="md:col-span-2">\
                    {attachments.length > 0 ? (\
                      <div className="space-y-3">\
                        <h4 className="text-sm font-medium text-gray-700">\
                          Dokumente të Ngarkuara ({attachments.length})\
                        </h4>\
                        <div className="space-y-2">\
                          {attachments.map((attachment, index) => (\
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">\
                              <div className="flex items-center space-x-2">\
                              <FileText className="h-4 w-4 text-blue-600" />\
                              <span className="text-sm text-gray-700">{attachment.name}</span>\
                            </div>\
                            <div className="flex items-center space-x-2">\
                              <Button\
                                type="button"\
                                variant="ghost"\
                                size="sm"\
                                onClick={() => window.open(attachment.path, '"'"'_blank'"'"')}\
                                className="h-8 w-8 p-0"\
                                data-testid={`download-attachment-${index}`}\
                              >\
                                <Download className="h-3 w-3" />\
                              </Button>\
                              <Button\
                                type="button"\
                                variant="ghost"\
                                size="sm"\
                                onClick={() => removeAttachment(index)}\
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"\
                                data-testid={`remove-attachment-${index}`}\
                              >\
                                <Trash2 className="h-3 w-3" />\
                              </Button>\
                            </div>\
                          </div>\
                        ))}\
                      </div>\
                    </div>\
                    ) : (\
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">\
                        Asnjë dokument i ngarkuar ende\
                      </div>\
                    )}\
                  </div>\
                </div>\
              </div>' client/src/components/case-edit-form.tsx

echo "✅ case-edit-form.tsx updated using sed"

# Rebuild the application
echo "🔨 Rebuilding application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build completed successfully"

# Restart PM2 with all environment variables
echo "🔄 Restarting PM2..."
pm2 delete albpetrol-legal 2>/dev/null || true

NODE_ENV=production \
PORT=5000 \
DATABASE_URL="postgresql://albpetrol_user:SecurePass2025@localhost:5432/albpetrol_legal_db" \
SMTP_HOST="smtp-mail.outlook.com" \
SMTP_PORT=587 \
SMTP_USER="it.system@albpetrol.al" \
SMTP_PASS="Albpetrol2025" \
SMTP_FROM="it.system@albpetrol.al" \
EMAIL_FROM="it.system@albpetrol.al" \
TZ="Europe/Tirane" \
pm2 start dist/index.js --name albpetrol-legal

if [ $? -ne 0 ]; then
  echo "❌ PM2 start failed!"
  exit 1
fi

# Save PM2 configuration
pm2 save

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Changes applied:"
echo "  ✅ Attachment window moved to LEFT side"
echo "  ✅ Square shape with aspect-square CSS"
echo "  ✅ Files display on RIGHT side"
echo "  ✅ Inside scrollable form area"
echo ""
echo "Application running at: https://legal.albpetrol.al"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
