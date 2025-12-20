const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, 'gaka_feature_mapping.csv');

const PLATFORMS = {
  WEB: { root: path.join(ROOT_DIR, 'app'), tag: 'Web' },
  MOBILE: { root: path.join(ROOT_DIR, 'mobile', 'app'), tag: 'Mobile' },
  WINDOWS: { root: path.join(ROOT_DIR, 'desktop'), tag: 'Windows' },
};

const ROUTES_TO_SKIP = ['_layout.tsx', '+html.tsx', '+not-found.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx', 'global-error.tsx', 'route.ts', 'default.tsx'];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function humanize(text) {
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\[.*?\]/g, '') // remove dynamic params like [id]
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
}

function getSampleUtterances(name) {
  return [
    `Go to ${name}`,
    `Open ${name}`,
    `Take me to ${name}`,
    `Show me ${name}`,
    `I want to see ${name}`
  ].join('|');
}

function scanDirectory(dir, basePath, platformTag) {
  let features = [];
  if (!fs.existsSync(dir)) return features;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively scan
      // For Next.js/Expo, directories usually represent route segments
      features = features.concat(scanDirectory(fullPath, path.join(basePath, file), platformTag));
    } else {
      // Check for page files
      if (
        (file === 'page.tsx' || file === 'page.js' || file === 'index.tsx' || file.endsWith('.tsx')) &&
        !ROUTES_TO_SKIP.includes(file) &&
        !file.startsWith('_')
      ) {
         // Determine URL Path
         let routePath = basePath;
         if (file !== 'page.tsx' && file !== 'index.tsx') {
             // If it's a named file like 'profile.tsx', append to path
             const name = path.basename(file, path.extname(file));
             if (!name.startsWith('index')) {
                 routePath = path.join(basePath, name);
             }
         }
         
         // Normalize path
         let urlPath = '/' + routePath.replace(/\\/g, '/');
         urlPath = urlPath.replace(/\/+/g, '/'); // remove double slashes
         if (urlPath === '/.') urlPath = '/';
         
         // Generate Meta
         const name = humanize(path.basename(routePath) || 'Home');
         const id = slugify(`${platformTag}-${name}`);
         
         features.push({
             id,
             name,
             working_description: `Navigates to the ${name} page on ${platformTag}.`,
             url_path: urlPath,
             sample_utterances: getSampleUtterances(name),
             platform_tags: platformTag
         });
      }
    }
  }
  return features;
}

function main() {
  console.log('Scanning repositories...');
  let allFeatures = [];

  // Web
  console.log('Scanning Web...');
  allFeatures = allFeatures.concat(scanDirectory(PLATFORMS.WEB.root, '', PLATFORMS.WEB.tag));

  // Mobile
  console.log('Scanning Mobile...');
  allFeatures = allFeatures.concat(scanDirectory(PLATFORMS.MOBILE.root, '', PLATFORMS.MOBILE.tag));

  // Windows (Desktop) - Simple check as structure might vary
  console.log('Scanning Windows...');
  // Validating if desktop has a structure we can map or just add a generic "Home"
  if (fs.existsSync(PLATFORMS.WINDOWS.root)) {
       allFeatures.push({
           id: 'windows-home',
           name: 'Windows Home',
           working_description: 'Opens the main window of the desktop application.',
           url_path: '/',
           sample_utterances: getSampleUtterances('Windows Home'),
           platform_tags: 'Windows'
       });
  }

  // Generate CSV Content
  const header = 'id,name,working_description,url_path,sample_utterances,platform_tags';
  const rows = allFeatures.map(f => 
    `${f.id},"${f.name}","${f.working_description}","${f.url_path}","${f.sample_utterances}","${f.platform_tags}"`
  );
  
  const csvContent = [header, ...rows].join('\n');

  fs.writeFileSync(OUTPUT_FILE, csvContent);
  console.log(`Success! Generated ${allFeatures.length} features in ${OUTPUT_FILE}`);
}

main();
