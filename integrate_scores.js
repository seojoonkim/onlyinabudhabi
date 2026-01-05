const fs = require('fs');

// Read db_en.js
let dbContent = fs.readFileSync('db_en.js', 'utf8');

// Load all score_reasons
const allScoreReasons = JSON.parse(fs.readFileSync('all_score_reasons.json', 'utf8'));

// ID mapping for mismatches
const idMapping = {
  'nat-geo': 'natgeo',
  'prison-island': 'prison',
  'xtreme-zone': 'xtreme',
  'waterworld-1': 'yas-water-1',
  'waterworld-2': 'yas-water-2',
  'waterworld-3': 'yas-water-3',
  'waterworld-4': 'yas-water-4',
  'wb-1': 'warner-1',
  'wb-2': 'warner-2'
};

// Extract the array
const arrayMatch = dbContent.match(/const landmarkData_en = (\[[\s\S]*\]);/);
const landmarkData = eval(arrayMatch[1]);

console.log('Processing', landmarkData.length, 'items...\n');

let added = 0;
let skipped = 0;
let mapped = 0;

// Process each item
landmarkData.forEach(item => {
  // Skip if already has score_reasons (emirati-house, golf-club)
  if (item.score_reasons) {
    console.log('✓ Skipped', item.id, '- already has score_reasons');
    skipped++;
    return;
  }

  // Map ID if needed
  const scoreReasonId = idMapping[item.id] || item.id;

  if (allScoreReasons[scoreReasonId]) {
    item.score_reasons = allScoreReasons[scoreReasonId];
    if (idMapping[item.id]) {
      console.log('✓ Mapped', item.id, '→', scoreReasonId);
      mapped++;
    } else {
      added++;
    }
  } else {
    console.log('✗ Missing score_reasons for:', item.id);
  }
});

console.log('\n=== Summary ===');
console.log('Added:', added);
console.log('Mapped (ID mismatch):', mapped);
console.log('Skipped (existing):', skipped);
console.log('Total processed:', added + mapped + skipped);

// Convert back to string format - properly handle the object notation
function stringifyLandmarkData(data) {
  let str = JSON.stringify(data, null, 4);

  // Convert double quotes to no quotes for property keys
  str = str.replace(/"(\w+)":/g, '$1:');

  return str;
}

const newContent = `const landmarkData_en = ${stringifyLandmarkData(landmarkData)};`;

// Write back to file
fs.writeFileSync('db_en.js', newContent);
console.log('\n✅ Updated db_en.js successfully!');
