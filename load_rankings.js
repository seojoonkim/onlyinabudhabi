/**
 * Load rankings data from items_with_rankings.json
 */
let rankingsData = null;
let rankingsById = {};

// Load rankings data
async function loadRankingsData() {
    try {
        const response = await fetch('items_with_rankings.json');
        rankingsData = await response.json();
        
        // Create lookup by ID
        rankingsData.items.forEach(item => {
            rankingsById[item.id] = item;
        });
        
        console.log(`✅ Loaded ${rankingsData.items.length} items with rankings`);
        return true;
    } catch (error) {
        console.error('❌ Failed to load rankings data:', error);
        return false;
    }
}

// Get fame text label (language-aware)
function getFameLabel(stars, lang = 'ko') {
    const key = `fame${stars}`;
    return i18n[lang]?.[key] || '-';
}

// Get uniqueness text label (language-aware)
function getUniquenessLabel(stars, lang = 'ko') {
    const key = `unique${stars}`;
    return i18n[lang]?.[key] || '-';
}

// Get ranking info for an item
function getRankingInfo(itemId) {
    const ranking = rankingsById[itemId];
    if (!ranking) {
        return {
            recommendation_score: '-',
            overall_rank: '-',
            category_rank: '-',
            category_total: '-',
            google_rating: '-',
            fame_stars: 0,
            uniqueness: 0
        };
    }
    
    return {
        recommendation_score: ranking.recommendation_score,
        overall_rank: ranking.overall_rank,
        category_rank: ranking.category_rank,
        category_total: ranking.category_total,
        google_rating: ranking.google_rating,
        google_reviews_count: ranking.google_reviews_count,
        fame_stars: ranking.fame_stars,
        uniqueness: ranking.uniqueness
    };
}
