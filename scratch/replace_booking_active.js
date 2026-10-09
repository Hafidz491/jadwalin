const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (filePath.endsWith('page.tsx')) {
    // Add imports
    if (content.includes('formatDateIndo,')) {
      content = content.replace(
        'formatDateIndo,\n} from \'@/lib/utils\';',
        'formatDateIndo,\n  isBookingActive,\n} from \'@/lib/utils\';'
      );
    }
    
    content = content.replace(/b\.bookingStatus !== 'CANCELLED'/g, 'isBookingActive(b)');
    content = content.replace(/book\.bookingStatus !== 'CANCELLED'/g, 'isBookingActive(book)');
  }
  
  if (filePath.endsWith('data.ts')) {
    if (!content.includes('isBookingActive')) {
      content = content.replace(
        'export async function saveTenantData(tenant: Tenant): Promise<void> {',
        "import { isBookingActive } from './utils';\n\nexport async function saveTenantData(tenant: Tenant): Promise<void> {"
      );
    }
    content = content.replace(/b\.bookingStatus !== 'CANCELLED'/g, 'isBookingActive(b)');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', filePath);
}

replaceInFile(path.join(__dirname, '../src/app/admin/page.tsx'));
replaceInFile(path.join(__dirname, '../src/lib/data.ts'));
