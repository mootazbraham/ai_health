const fs = require('fs');
const path = require('path');

// Common TypeScript fixes
const fixes = [
  // Fix request.ip references
  {
    search: /request\.ip \|\|/g,
    replace: 'request.headers.get(\'x-forwarded-for\') ||'
  },
  // Fix error handling
  {
    search: /catch \(error\) \{[\s\S]*?error\.message/g,
    replace: (match) => match.replace('error.message', 'error instanceof Error ? error.message : \'Unknown error\'')
  },
  // Fix userId string to number conversions
  {
    search: /where: \{ userId \}/g,
    replace: 'where: { userId: parseInt(userId) }'
  },
  // Fix createdAt to recordedAt for body composition
  {
    search: /orderBy: \{ createdAt: 'desc' \}/g,
    replace: 'orderBy: { recordedAt: \'desc\' }'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.search, fix.replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixFile(filePath);
    }
  });
}

// Fix all TypeScript files in app/api
walkDir('./app/api');
console.log('TypeScript fixes completed!');