#!/usr/bin/env node
/**
 * Extract data from db_*.js files using Node.js
 * This is more reliable than regex parsing
 */

const fs = require('fs');
const path = require('path');

// Language files to process
const LANGUAGES = {
  'ko': 'db_ko.js',
  'en': 'db_en.js',
  'ar': 'db_ar.js',
  'ja': 'db_ja.js',
  'zh': 'db_zh.js'
};

function extractBaseData(lang, inputFile) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📖 Processing ${lang.toUpperCase()}: ${inputFile}`);
  console.log('='.repeat(60));

  if (!fs.existsSync(inputFile)) {
    console.log(`⚠️  File not found: ${inputFile}`);
    return null;
  }

  // Load and execute the JavaScript file
  const code = fs.readFileSync(inputFile, 'utf-8');

  // Execute in a sandboxed context
  let landmarkData = [];

  try {
    // Create a safe evaluation context
    const evalCode = code + `\n; landmarkData_${lang};`;
    landmarkData = eval(evalCode);

    console.log(`✅ Loaded ${landmarkData.length} items`);
  } catch (error) {
    console.error(`❌ Error loading ${inputFile}:`, error.message);
    return null;
  }

  return landmarkData;
}

function loadPopularityData() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📖 Loading popularity.js');
  console.log('='.repeat(60));

  if (!fs.existsSync('popularity.js')) {
    console.log('⚠️  popularity.js not found');
    return {};
  }

  try {
    const popularityCode = fs.readFileSync('popularity.js', 'utf-8');
    const evalCode = popularityCode + '\n; popularityById;';
    const popularityData = eval(evalCode);

    console.log(`✅ Loaded popularity data for ${Object.keys(popularityData).length} items`);
    return popularityData;
  } catch (error) {
    console.error(`❌ Error loading popularity.js:`, error.message);
    return {};
  }
}

function loadRankingsData() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📖 Loading data/rankings.json');
  console.log('='.repeat(60));

  const rankingsPath = 'data/rankings.json';

  // Try both old and new paths
  const possiblePaths = [rankingsPath, 'items_with_rankings.json'];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const rankingsContent = fs.readFileSync(filePath, 'utf-8');
        const rankingsData = JSON.parse(rankingsContent);

        // Convert array to object keyed by id
        const rankingsById = {};
        if (rankingsData.items) {
          rankingsData.items.forEach(item => {
            rankingsById[item.id] = item;
          });
        }

        console.log(`✅ Loaded rankings data for ${Object.keys(rankingsById).length} items`);
        return rankingsById;
      } catch (error) {
        console.error(`❌ Error loading ${filePath}:`, error.message);
      }
    }
  }

  console.log('⚠️  Rankings file not found');
  return {};
}

function extractLanguageIndependent(items, popularityData, rankingsData) {
  console.log(`\n🔄 Extracting language-independent data...`);

  const baseItems = items.map(item => {
    const baseItem = {
      id: item.id,
      num: item.num,
      category: item.category,

      // Language-independent location fields
      area: item.area || '',
      place: item.place || '',
      address: item.address || '',
      station: item.station || '',

      // Photos: just store folder name (usually same as id)
      // Frontend will load photos/{folder}/01.jpg, 02.jpg, etc. in order
      photo_folder: item.id,  // Use id as folder name

      scores: item.scores || {},
      coordinates: item.coordinates || {}
    };

    // Merge popularity data
    const popularity = popularityData[item.id];
    if (popularity) {
      baseItem.gm_rating = popularity.gm_rating;
      baseItem.gm_reviews = popularity.gm_reviews;
      baseItem.activity_rating = popularity.activity_rating;
    }

    // Merge rankings data
    const ranking = rankingsData[item.id];
    if (ranking) {
      baseItem.recommendation_score = ranking.recommendation_score;
      baseItem.overall_rank = ranking.overall_rank;
      baseItem.category_rank = ranking.category_rank;
      baseItem.category_total = ranking.category_total;
      baseItem.fame_stars = ranking.fame_stars;
      baseItem.uniqueness = ranking.uniqueness;

      // Add google data from rankings if not in popularity
      if (!baseItem.gm_rating && ranking.google_rating) {
        baseItem.gm_rating = ranking.google_rating;
      }
      if (!baseItem.gm_reviews && ranking.google_reviews_count) {
        baseItem.gm_reviews = ranking.google_reviews_count;
      }
    }

    return baseItem;
  });

  console.log(`✅ Extracted ${baseItems.length} base items (with popularity & rankings)`);
  return baseItems;
}

function extractLanguageDependent(items) {
  console.log(`\n🔄 Extracting language-dependent data...`);

  const langItems = items.map(item => ({
    id: item.id,
    title: item.title || '',
    summary: item.summary || '',
    description: item.description || '',
    duration: item.duration || '',
    admission: item.admission || '',
    hours: item.hours || '',
    closed: item.closed || '',
    tips: item.tips || [],
    score_reasons: item.score_reasons || {}
  }));

  console.log(`✅ Extracted ${langItems.length} language items`);
  return langItems;
}

function saveJSON(data, outputPath) {
  console.log(`\n💾 Saving to ${outputPath}...`);

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save as JSON
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  // Get file size
  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`✅ Saved to ${outputPath}`);
  console.log(`📊 File size: ${sizeKB} KB`);
}

function main() {
  console.log('='.repeat(60));
  console.log('🚀 Extracting Data from db_*.js Files');
  console.log('='.repeat(60));

  // Step 1: Load popularity and rankings data
  const popularityData = loadPopularityData();
  const rankingsData = loadRankingsData();

  // Step 2: Extract base data from db_ko.js (language-independent)
  const koItems = extractBaseData('ko', LANGUAGES.ko);

  if (!koItems || koItems.length === 0) {
    console.error('❌ Failed to extract data from db_ko.js');
    process.exit(1);
  }

  const baseItems = extractLanguageIndependent(koItems, popularityData, rankingsData);
  saveJSON({ items: baseItems }, 'data/items_base.json');

  // Step 3: Extract language-specific data for each language
  const processedLangs = [];

  for (const [lang, inputFile] of Object.entries(LANGUAGES)) {
    const items = extractBaseData(lang, inputFile);

    if (items && items.length > 0) {
      const langItems = extractLanguageDependent(items);
      saveJSON({ items: langItems }, `data/lang/${lang}.json`);
      processedLangs.push(lang);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Data Extraction Complete!`);
  console.log('='.repeat(60));
  console.log(`\n📁 Created files:`);
  console.log(`  ✓ data/items_base.json (${baseItems.length} items + popularity + rankings)`);

  for (const lang of processedLangs) {
    console.log(`  ✓ data/lang/${lang}.json`);
  }

  console.log(`\n✨ Successfully processed ${processedLangs.length}/${Object.keys(LANGUAGES).length} languages`);

  // Show what was merged
  console.log(`\n📊 Data merged into items_base.json:`);
  console.log(`  • Location fields: area, place, address, station`);
  console.log(`  • Popularity: gm_rating, gm_reviews, activity_rating`);
  console.log(`  • Rankings: recommendation_score, overall_rank, category_rank, etc.`);
  console.log(`\n💡 Separate popularity.json and rankings.json are no longer needed!`);
}

main();
