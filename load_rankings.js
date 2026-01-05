/**
 * Load rankings data from items_with_rankings.json
 */
let rankingsData = null;
let rankingsById = {};
let scoresData = null;

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

        // Load scores data
        try {
            const scoresResponse = await fetch('all_score_reasons.json');
            scoresData = await scoresResponse.json();
            console.log(`✅ Loaded detailed scores for ${Object.keys(scoresData).length} items`);
        } catch (error) {
            console.warn('⚠️ Could not load detailed scores:', error);
        }

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

// Calculate score from reasons with advanced sentiment analysis
function calculateScoreFromReasons(reasons) {
    if (!reasons || !Array.isArray(reasons)) return 0;
    if (reasons.length === 0) return 0;

    // Strong negative indicators that make a reason clearly negative
    const strongNegativeKeywords = [
        'prevents', 'lacks', 'lacking', 'minimal', 'limited to', 'no opportunity',
        'not suitable', 'difficult', 'challenging for', 'inconvenient', 'poor',
        'disappointing', 'inadequate', 'insufficient', 'absent', 'missing',
        'very limited', 'extremely', 'very busy', 'very crowded', 'very noisy',
        'not recommended', 'avoid', 'not ideal', 'better elsewhere', 'may not',
        'rarely', 'seldom', 'unlikely'
    ];

    // Moderate negative indicators
    const moderateNegativeKeywords = [
        'can be busy', 'may be crowded', 'sometimes noisy', 'could be',
        'might be', 'potentially', 'limited', 'basic', 'modest'
    ];

    // Positive indicators
    const positiveKeywords = [
        'excellent', 'perfect', 'ideal', 'great', 'amazing', 'outstanding',
        'exceptional', 'beautiful', 'authentic', 'provides', 'offers',
        'allows', 'creates', 'ensures', 'features', 'includes', 'dedicated'
    ];

    let strongPositive = 0;
    let weakPositive = 0;
    let neutral = 0;
    let weakNegative = 0;
    let strongNegative = 0;

    reasons.forEach(reason => {
        const lowerReason = reason.toLowerCase();

        // Check for strong negative
        const hasStrongNegative = strongNegativeKeywords.some(keyword =>
            lowerReason.includes(keyword)
        );

        // Check for moderate negative
        const hasModerateNegative = moderateNegativeKeywords.some(keyword =>
            lowerReason.includes(keyword)
        );

        // Check for positive
        const hasPositive = positiveKeywords.some(keyword =>
            lowerReason.includes(keyword)
        );

        if (hasStrongNegative) {
            strongNegative++;
        } else if (hasModerateNegative) {
            weakNegative++;
        } else if (hasPositive) {
            strongPositive++;
        } else if (lowerReason.length > 100) { // Long detailed reasons tend to be positive
            weakPositive++;
        } else {
            neutral++;
        }
    });

    // Calculate weighted score
    const totalReasons = reasons.length;
    const weightedScore = (
        (strongPositive * 1.0) +
        (weakPositive * 0.7) +
        (neutral * 0.5) +
        (weakNegative * 0.2) +
        (strongNegative * 0)
    ) / totalReasons;

    // Convert to 1-5 scale with proper thresholds
    if (weightedScore >= 0.85) return 5;
    if (weightedScore >= 0.70) return 4.5;
    if (weightedScore >= 0.55) return 4;
    if (weightedScore >= 0.40) return 3.5;
    if (weightedScore >= 0.25) return 3;
    if (weightedScore >= 0.15) return 2;
    return 1;
}

// Get scores for an item
function getItemScores(itemId) {
    if (!scoresData) {
        console.warn('⚠️ scoresData not loaded yet');
        return {};
    }

    // If no scores data, return default moderate scores
    if (!scoresData[itemId]) {
        console.warn(`⚠️ No scores data for item: ${itemId}, using defaults`);
        return {
            photo: 3,
            culture: 3,
            activity: 3,
            relaxation: 3,
            peaceful: 3,
            couple: 3,
            family: 3,
            solo: 3,
            tourist: 3,
            accessibility: 3
        };
    }

    const itemReasons = scoresData[itemId];
    const scores = {
        photo: calculateScoreFromReasons(itemReasons.photo),
        culture: calculateScoreFromReasons(itemReasons.culture),
        activity: calculateScoreFromReasons(itemReasons.activity),
        relaxation: calculateScoreFromReasons(itemReasons.relaxation),
        peaceful: calculateScoreFromReasons(itemReasons.peaceful),
        couple: calculateScoreFromReasons(itemReasons.couple),
        family: calculateScoreFromReasons(itemReasons.family),
        solo: calculateScoreFromReasons(itemReasons.solo),
        tourist: calculateScoreFromReasons(itemReasons.tourist),
        accessibility: calculateScoreFromReasons(itemReasons.accessibility)
    };

    return scores;
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
            uniqueness: 0,
            scores: {}
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
        uniqueness: ranking.uniqueness,
        scores: getItemScores(itemId)
    };
}
