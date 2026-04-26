const fs = require('fs');

let content = fs.readFileSync('features/story/StoryReader.tsx', 'utf8');

const regex = /(const scrollToChapter = React\.useCallback\(\(id: string\) => \{[^]*?\}\), \[\]\);)/;

const match = content.match(regex);
if (match) {
   content = content.replace(match[1], ''); // remove from original place
   
   // insert right above `// Scroll to initial chapter if provided`
   content = content.replace('// Scroll to initial chapter if provided', match[1] + '\n\n  // Scroll to initial chapter if provided');
   fs.writeFileSync('features/story/StoryReader.tsx', content);
   console.log('Moved scrollToChapter');
} else {
   console.log('Pattern not found');
}
