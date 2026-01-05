/**
 * Abu Dhabi 101 Do's - Application
 */

// Global variables
let allData = [];
let filteredData = [];
let currentCategory = 'all';
let currentScoreFilter = 'all'; // 'all' for 4+ stars, or specific score category
let currentSort = 'number'; // 'number' or 'appeal'
let currentLang = getLanguageFromURL(); // Get language from URL path
let map = null;
let markers = [];
let spotMap = null;
let spotMarkers = [];
let currentInfoWindow = null;
let currentGalleryImages = [];
let currentGalleryIndex = 0;
let currentValidImages = []; // Only images that actually exist

// Get language from URL path
function getLanguageFromURL() {
    const path = window.location.pathname;
    // Match language code at start or after project name (for GitHub Pages)
    const langMatch = path.match(/\/(kr|en|ar|ja|zh)(?:\/|$)/);
    if (langMatch) {
        return langMatch[1];
    }
    // Default to English if no language code in URL
    return 'en';
}

// Category configuration with icons and colors
const categoryConfig = {
    landmark: {
        icon: '🏛️',
        bg: '#e8f4f8',
        color: '#0277bd'
    },
    themepark: {
        icon: '🎢',
        bg: '#fce4ec',
        color: '#c2185b'
    },
    dining: {
        icon: '🍽️',
        bg: '#fff3e0',
        color: '#e65100'
    },
    beach: {
        icon: '🏖️',
        bg: '#e0f2f1',
        color: '#00695c'
    },
    culture: {
        icon: '🎨',
        bg: '#f3e5f5',
        color: '#6a1b9a'
    },
    adventure: {
        icon: '🏄',
        bg: '#fff8e1',
        color: '#f57c00'
    },
    shopping: {
        icon: '🛍️',
        bg: '#fce4ec',
        color: '#ad1457'
    },
    nature: {
        icon: '🦁',
        bg: '#e8f5e9',
        color: '#2e7d32'
    }
};

// Get category names based on current language
function getCategoryNames() {
    return {
        landmark: i18n[currentLang].landmark,
        themepark: i18n[currentLang].themepark,
        dining: i18n[currentLang].dining,
        beach: i18n[currentLang].beach,
        culture: i18n[currentLang].culture,
        adventure: i18n[currentLang].adventure,
        shopping: i18n[currentLang].shopping,
        nature: i18n[currentLang].nature
    };
}

// Score categories config - returns array with translated names
function getScoreCategories() {
    return [
        { key: "photo", icon: "📷", name: i18n[currentLang].scorePhoto },
        { key: "culture", icon: "🎭", name: i18n[currentLang].scoreCulture },
        { key: "activity", icon: "🎯", name: i18n[currentLang].scoreActivity },
        { key: "relaxation", icon: "🧘", name: i18n[currentLang].scoreRelaxation },
        { key: "peaceful", icon: "🌿", name: i18n[currentLang].scorePeaceful },
        { key: "couple", icon: "💑", name: i18n[currentLang].scoreCouple },
        { key: "family", icon: "👨‍👩‍👧", name: i18n[currentLang].scoreFamily },
        { key: "solo", icon: "🚶", name: i18n[currentLang].scoreSolo },
        { key: "tourist", icon: "🌍", name: i18n[currentLang].scoreTourist },
        { key: "accessibility", icon: "🚇", name: i18n[currentLang].scoreAccessibility }
    ];
}

// Dummy image placeholder
const dummyImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23cbd5e1' font-size='24'%3E📷%3C/text%3E%3C/svg%3E";

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await initData();
    initFilters();
    initScoreFilters();
    initSort();
    initViewTabs();
    initLangSelector();
    renderTable();
    updateCounts();

    // Resize listener removed - popularity text now always shows full text
});

// Initialize data
async function initData() {
    // Don't update URL on initial load, just use the language from URL
    await switchLanguage(currentLang, false);
}

// Update UI text based on current language
function updateUIText() {
    const categoryNames = getCategoryNames();

    // Update subtitle
    const subTitle = document.querySelector('.logo-sub');
    if (subTitle) subTitle.textContent = i18n[currentLang].subTitle;

    // Update view tabs
    const viewTabs = document.querySelectorAll('.view-tab');
    if (viewTabs[0]) viewTabs[0].textContent = i18n[currentLang].listView;
    if (viewTabs[1]) viewTabs[1].textContent = i18n[currentLang].mapView;

    // Update about section
    const aboutTitle = document.getElementById('aboutTitle');
    if (aboutTitle) {
        aboutTitle.textContent = i18n[currentLang].aboutTitle;
    }

    const aboutDesc = document.getElementById('aboutDesc');
    if (aboutDesc) {
        aboutDesc.textContent = i18n[currentLang].aboutDesc;
    }

    // Update filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns[0]) filterBtns[0].textContent = i18n[currentLang].categoryAll;
    if (filterBtns[1]) filterBtns[1].innerHTML = `${categoryConfig.landmark.icon} ${categoryNames.landmark}`;
    if (filterBtns[2]) filterBtns[2].innerHTML = `${categoryConfig.themepark.icon} ${categoryNames.themepark}`;
    if (filterBtns[3]) filterBtns[3].innerHTML = `${categoryConfig.dining.icon} ${categoryNames.dining}`;
    if (filterBtns[4]) filterBtns[4].innerHTML = `${categoryConfig.beach.icon} ${categoryNames.beach}`;
    if (filterBtns[5]) filterBtns[5].innerHTML = `${categoryConfig.culture.icon} ${categoryNames.culture}`;
    if (filterBtns[6]) filterBtns[6].innerHTML = `${categoryConfig.adventure.icon} ${categoryNames.adventure}`;
    if (filterBtns[7]) filterBtns[7].innerHTML = `${categoryConfig.shopping.icon} ${categoryNames.shopping}`;
    if (filterBtns[8]) filterBtns[8].innerHTML = `${categoryConfig.nature.icon} ${categoryNames.nature}`;

    // Update score filter buttons
    const scoreFilterBtns = document.querySelectorAll('.score-filter-btn');
    if (scoreFilterBtns[0]) scoreFilterBtns[0].textContent = i18n[currentLang].categoryAll;
    if (scoreFilterBtns[1]) scoreFilterBtns[1].textContent = `📷 ${i18n[currentLang].scorePhoto}`;
    if (scoreFilterBtns[2]) scoreFilterBtns[2].textContent = `🎭 ${i18n[currentLang].scoreCulture}`;
    if (scoreFilterBtns[3]) scoreFilterBtns[3].textContent = `🎯 ${i18n[currentLang].scoreActivity}`;
    if (scoreFilterBtns[4]) scoreFilterBtns[4].textContent = `🧘 ${i18n[currentLang].scoreRelaxation}`;
    if (scoreFilterBtns[5]) scoreFilterBtns[5].textContent = `🌿 ${i18n[currentLang].scorePeaceful}`;
    if (scoreFilterBtns[6]) scoreFilterBtns[6].textContent = `💑 ${i18n[currentLang].scoreCouple}`;
    if (scoreFilterBtns[7]) scoreFilterBtns[7].textContent = `👨‍👩‍👧 ${i18n[currentLang].scoreFamily}`;
    if (scoreFilterBtns[8]) scoreFilterBtns[8].textContent = `🚶 ${i18n[currentLang].scoreSolo}`;
    if (scoreFilterBtns[9]) scoreFilterBtns[9].textContent = `🌍 ${i18n[currentLang].scoreTourist}`;
    if (scoreFilterBtns[10]) scoreFilterBtns[10].textContent = `🚇 ${i18n[currentLang].scoreAccessibility}`;

    // Update sort buttons
    const sortBtns = document.querySelectorAll('.sort-btn');
    if (sortBtns[0]) sortBtns[0].textContent = i18n[currentLang].sortByNumber;
    if (sortBtns[1]) sortBtns[1].textContent = i18n[currentLang].sortByAppeal;

    // Update table headers
    const tableHeaders = document.querySelectorAll('.landmark-table th');
    const isMobile = window.innerWidth <= 650;

    if (tableHeaders[0]) tableHeaders[0].textContent = i18n[currentLang].colRank;
    // Photo column header intentionally left empty
    if (tableHeaders[2]) tableHeaders[2].textContent = i18n[currentLang].colName;
    if (tableHeaders[3]) tableHeaders[3].textContent = i18n[currentLang].colCategory;
    if (tableHeaders[4]) tableHeaders[4].textContent = i18n[currentLang].colLocation;
    if (tableHeaders[5]) tableHeaders[5].textContent = i18n[currentLang].colDuration;
    if (tableHeaders[6]) {
        tableHeaders[6].textContent = isMobile ? i18n[currentLang].colPopularityShort : i18n[currentLang].colPopularity;
    }

    // Update modal section headings
    const sectionIntroText = document.getElementById('sectionIntroText');
    if (sectionIntroText) sectionIntroText.textContent = i18n[currentLang].sectionIntro;

    const sectionPhotosText = document.getElementById('sectionPhotosText');
    if (sectionPhotosText) sectionPhotosText.textContent = i18n[currentLang].sectionPhotos;

    const sectionInfoText = document.getElementById('sectionInfoText');
    if (sectionInfoText) sectionInfoText.textContent = i18n[currentLang].sectionInfo;

    const sectionAddressText = document.getElementById('sectionAddressText');
    if (sectionAddressText) sectionAddressText.textContent = i18n[currentLang].sectionAddress;

    const sectionPopularityText = document.getElementById('sectionPopularityText');
    if (sectionPopularityText) sectionPopularityText.textContent = i18n[currentLang].sectionPopularity;

    const sectionDescriptionText = document.getElementById('sectionDescriptionText');
    if (sectionDescriptionText) sectionDescriptionText.textContent = i18n[currentLang].sectionDescription;

    const sectionVisitorTipsText = document.getElementById('sectionVisitorTipsText');
    if (sectionVisitorTipsText) sectionVisitorTipsText.textContent = i18n[currentLang].sectionVisitorTips;

    const sectionLocationText = document.getElementById('sectionLocationText');
    if (sectionLocationText) sectionLocationText.textContent = i18n[currentLang].sectionLocation;

    const sectionNearbyText = document.getElementById('sectionNearbyText');
    if (sectionNearbyText) sectionNearbyText.textContent = i18n[currentLang].sectionNearby;

    const scoreSummaryText = document.getElementById('scoreSummaryText');
    if (scoreSummaryText) scoreSummaryText.textContent = i18n[currentLang].scoreSummary;

    const detailedEvalText = document.getElementById('detailedEvalText');
    if (detailedEvalText) detailedEvalText.textContent = i18n[currentLang].detailedEval;

    // Update information labels
    const labelAdmission = document.getElementById('labelAdmission');
    if (labelAdmission) labelAdmission.textContent = i18n[currentLang].labelAdmission;

    const labelHours = document.getElementById('labelHours');
    if (labelHours) labelHours.textContent = i18n[currentLang].labelHours;

    const labelClosed = document.getElementById('labelClosed');
    if (labelClosed) labelClosed.textContent = i18n[currentLang].labelClosed;

    const labelDuration = document.getElementById('labelDuration');
    if (labelDuration) labelDuration.textContent = i18n[currentLang].labelDuration;

    const labelStation = document.getElementById('labelStation');
    if (labelStation) labelStation.textContent = i18n[currentLang].labelStation;

    // Update popularity labels
    const labelOverallRank = document.getElementById('labelOverallRank');
    if (labelOverallRank) labelOverallRank.textContent = i18n[currentLang].labelOverallRank;

    const labelGMapScore = document.getElementById('labelGMapScore');
    if (labelGMapScore) labelGMapScore.textContent = i18n[currentLang].labelGMapScore;

    const labelGMapReviews = document.getElementById('labelGMapReviews');
    if (labelGMapReviews) labelGMapReviews.textContent = i18n[currentLang].labelGMapReviews;

    const labelPopularity = document.getElementById('labelPopularity');
    if (labelPopularity) labelPopularity.textContent = i18n[currentLang].labelPopularity;

    const labelFame = document.getElementById('labelFame');
    if (labelFame) labelFame.textContent = i18n[currentLang].labelFame;

    const labelUniqueness = document.getElementById('labelUniqueness');
    if (labelUniqueness) labelUniqueness.textContent = i18n[currentLang].labelUniqueness;

    // Update category counts
    updateCategoryCounts();
}

// Update result count with language
function updateResultCount() {
    const countSpan = document.getElementById('filteredCount');
    if (countSpan) {
        countSpan.textContent = filteredData.length;
    }
}

// Switch language
async function switchLanguage(lang, updateURL = true) {
    currentLang = lang;

    // Update URL path if needed
    if (updateURL) {
        const newPath = lang === 'en' ? '/' : `/${lang}`;
        window.history.pushState({}, '', newPath);
    }

    // Load new data structure: items_base.json + lang/{lang}.json
    try {
        // Get base path (works for localhost, GitHub Pages, and custom domain)
        const isLocalhost = window.location.hostname === 'localhost';
        const isGitHubPages = window.location.hostname.includes('github.io');
        const basePath = isLocalhost ? '' : (isGitHubPages ? '/onlyinabudhabi' : '');

        // Load language-independent data
        const baseResponse = await fetch(`${basePath}/data/items_base.json`);
        const baseData = await baseResponse.json();

        // Load language-specific data
        const langResponse = await fetch(`${basePath}/data/lang/${lang}.json`);
        const langData = await langResponse.json();

        // Merge by ID
        allData = baseData.items.map(baseItem => {
            const langItem = langData.items.find(l => l.id === baseItem.id);
            if (langItem) {
                return {
                    ...baseItem,  // All language-independent data
                    ...langItem   // All language-specific text
                };
            }
            return baseItem;
        });

        console.log(`✅ Loaded ${allData.length} items for language: ${lang}`);
    } catch (error) {
        console.error('❌ Error loading data:', error);
        // Fallback to old data structure if new files not found
        console.warn('⚠️  Falling back to old data structure (db_*.js)');
        let rawData;
        switch(lang) {
            case 'ko':
                rawData = landmarkData_ko;
                break;
            case 'en':
                rawData = landmarkData_en;
                break;
            case 'ar':
                rawData = landmarkData_ar;
                break;
            case 'ja':
                rawData = landmarkData_ja;
                break;
            case 'zh':
                rawData = landmarkData_zh;
                break;
            default:
                rawData = landmarkData_en;
        }
        allData = rawData;
    }

    // Re-filter and render
    filteredData = [...allData].sort((a, b) => a.num - b.num);
    if (currentCategory !== 'all') {
        filteredData = filteredData.filter(item => item.category === currentCategory).sort((a, b) => a.num - b.num);
    }

    // Update UI text (after filteredData is set)
    updateUIText();
    updateResultCount();

    renderTable();
    if (map) updateMapMarkers();
}

// Initialize filters
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            filterData();
        });
    });
}

// Initialize sort buttons
function initSort() {
    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            sortBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.dataset.sort;
            filterData();
        });
    });
}

// Initialize score filter buttons
function initScoreFilters() {
    const scoreFilterBtns = document.querySelectorAll('.score-filter-btn');
    scoreFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            scoreFilterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentScoreFilter = this.dataset.score;
            filterData();
        });
    });
}

// Sort data based on currentSort
function sortData(data) {
    if (currentSort === 'appeal') {
        // Sort by appeal score (descending), then by ranking (ascending) as tiebreaker
        return [...data].sort((a, b) => {
            const aScore = a.recommendation_score || 0;
            const bScore = b.recommendation_score || 0;

            // If scores are equal, use overall_rank as tiebreaker (lower rank = higher priority)
            if (bScore === aScore) {
                const aRank = a.overall_rank || 999;
                const bRank = b.overall_rank || 999;
                return aRank - bRank;
            }

            return bScore - aScore;
        });
    } else {
        // Sort by number (ascending)
        return [...data].sort((a, b) => a.num - b.num);
    }
}

// Filter data
function filterData() {
    // Ensure currentCategory and currentScoreFilter have default values
    if (!currentCategory) currentCategory = 'all';
    if (!currentScoreFilter) currentScoreFilter = 'all';

    console.log(`🎯 filterData called: category=${currentCategory}, scoreFilter=${currentScoreFilter}`);
    console.log(`📦 allData length: ${allData.length}`);

    let data;
    if (currentCategory === 'all') {
        data = [...allData];
    } else {
        data = allData.filter(item => item.category === currentCategory);
    }

    console.log(`📦 After category filter: ${data.length} items`);

    // Apply score filter (only if not 'all')
    if (currentScoreFilter !== 'all') {
        console.log(`🔍 Filtering by score: ${currentScoreFilter}`);
        console.log(`📦 Data before score filter: ${data.length} items`);
        data = data.filter(item => {
            // Use scores directly from item data (already in db_ko.js, db_en.js, etc.)
            if (!item.scores || !item.scores[currentScoreFilter]) {
                console.log(`❌ No score for ${item.id} - ${currentScoreFilter}`);
                return false;
            }

            // Show items where specific score category >= 4
            const score = item.scores[currentScoreFilter];
            const numScore = parseFloat(score);
            const passes = !isNaN(numScore) && numScore >= 4;

            if (passes) {
                console.log(`✅ ${item.title}: ${currentScoreFilter} = ${numScore}`);
            } else {
                console.log(`❌ ${item.title}: ${currentScoreFilter} = ${numScore} (< 4)`);
            }

            return passes;
        });
        console.log(`📊 Filtered results: ${data.length} items`);
    }

    filteredData = sortData(data);
    renderTable();
    updateCounts();
    if (map) updateMapMarkers();
}

// Update counts
function updateCounts() {
    updateResultCount();
    updateCategoryCounts();
}

// Update category counts
function updateCategoryCounts() {
    const categoryCounts = {};
    const categoryNames = getCategoryNames();
    const unit = i18n[currentLang].countUnit || '곳';

    // Count items by category
    allData.forEach(item => {
        const cat = item.category;
        if (!categoryCounts[cat]) {
            categoryCounts[cat] = 0;
        }
        categoryCounts[cat]++;
    });

    // Build the category counts text
    const categoryOrder = ['landmark', 'themepark', 'dining', 'beach', 'culture', 'adventure', 'shopping', 'nature'];
    const categoryTexts = categoryOrder
        .filter(cat => categoryCounts[cat] > 0)
        .map(cat => {
            const icon = categoryConfig[cat]?.icon || '';
            const name = categoryNames[cat] || cat;
            const count = categoryCounts[cat];
            return `${icon} ${name} ${count}${unit}`;
        });

    const aboutCategories = document.getElementById('aboutCategories');
    if (aboutCategories) {
        aboutCategories.innerHTML = categoryTexts.join(', ');
    }
}

// Render table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    const categoryNames = getCategoryNames();

    filteredData.forEach((item) => {
        const config = categoryConfig[item.category] || {};

        // Get popularity score from item data
        const popularityScore = item.recommendation_score || '-';

        const tr = document.createElement('tr');
        tr.onclick = () => openModal(item.id);
        tr.innerHTML = `
            <td class="col-rank">${String(item.num).padStart(2, '0')}</td>
            <td class="col-photo">
                <img src="photos/${item.photo_folder || item.id}/01.jpg" onerror="this.src='${dummyImage}'" alt="${item.title}" class="list-photo">
            </td>
            <td class="col-name">
                <div class="name-cell">
                    <div class="name-title-row">
                        <div class="name-title">${item.title}</div>
                        <span class="category-badge-inline" style="background: ${config.bg}; color: ${config.color}">
                            ${config.icon} ${categoryNames[item.category] || item.category}
                        </span>
                    </div>
                    <div class="name-place">${item.place}</div>
                </div>
            </td>
            <td class="col-category">
                <span class="category-badge" style="background: ${config.bg}; color: ${config.color}">
                    ${config.icon} ${categoryNames[item.category] || item.category}
                </span>
            </td>
            <td class="col-location">${item.area}</td>
            <td class="col-duration">${item.duration || '-'}</td>
            <td class="col-popularity"><svg width="16" height="16" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:5px"><path d="M21 15H19L15.5 7L11 18L8 12L6 15H4" stroke="currentColor" stroke-width="1.2"/></svg>${popularityScore}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Initialize view tabs
function initViewTabs() {
    const tabs = document.querySelectorAll('.view-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.dataset.view;
            document.getElementById('listView').style.display = view === 'list' ? 'block' : 'none';
            document.getElementById('mapView').style.display = view === 'map' ? 'block' : 'none';
            
            if (view === 'map' && !map) {
                setTimeout(initGoogleMap, 100);
            }
        });
    });
}

// Initialize language selector
function initLangSelector() {
    const langBtns = document.querySelectorAll('.lang-btn');

    // Set active button based on current language
    langBtns.forEach(btn => {
        if (btn.getAttribute('data-lang') === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Add click handlers
    langBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            langBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            switchLanguage(lang, true);
        });
    });
}

// Initialize Google Map
function initGoogleMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || typeof google === 'undefined') return;

    map = new google.maps.Map(mapEl, {
        center: { lat: 24.4539, lng: 54.3773 },
        zoom: 12,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false
    });

    // Close info window when clicking on map (with delay to prevent conflict with marker clicks)
    let mapClickTimeout;
    map.addListener('click', () => {
        clearTimeout(mapClickTimeout);
        mapClickTimeout = setTimeout(() => {
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }
        }, 100);
    });

    // Re-position markers when zoom changes
    map.addListener('zoom_changed', () => {
        updateMapMarkers();
    });

    updateMapMarkers();
}
window.initGoogleMap = initGoogleMap;

// Create custom marker icon with category icon in circle
function createMarkerIcon(category) {
    const config = categoryConfig[category] || {};
    const svg = `
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="15" fill="${config.bg || '#f1f5f9'}" stroke="${config.color || '#64748b'}" stroke-width="2.5"/>
            <text x="18" y="19" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="${config.color || '#64748b'}">${config.icon || '📍'}</text>
        </svg>
    `;
    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(36, 36),
        anchor: new google.maps.Point(18, 18)
    };
}

// Create tooltip content for marker
function createTooltipContent(item) {
    const config = categoryConfig[item.category] || {};
    const categoryNames = getCategoryNames();
    const photoSrc = `photos/${item.photo_folder || item.id}/01.jpg`;

    // Get popularity score from item data
    let popularityScore = item.recommendation_score || '-';

    return `
        <div style="width: 210px; max-width: 90vw; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: visible; border-radius: 8px; padding: 0; margin: 0; box-sizing: border-box; background: white;">
            <img src="${photoSrc}" style="width: 100%; height: 120px; object-fit: cover; display: block; margin: 0; padding: 0; border-radius: 8px 8px 0 0; background: #f1f5f9;" onerror="this.src='https://via.placeholder.com/210x120/f1f5f9/94a3b8?text=No+Image';">
            <div style="padding: 12px 14px 14px 14px; background: white; margin: 0; box-sizing: border-box; border-radius: 0 0 8px 8px;">
                <div style="font-size: 13px; font-weight: 500; color: #2a2a2a; margin-bottom: 5px; line-height: 1.3;">${item.title}</div>
                <div style="font-size: 11px; color: #999; margin-bottom: 10px; line-height: 1.2;">${item.place}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="background: ${config.bg}; color: ${config.color}; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 500; display: inline-flex; align-items: center; gap: 3px;">
                        ${config.icon} ${categoryNames[item.category]}
                    </span>
                    <span style="color: #d4915d; font-weight: 600; font-size: 11px;">${i18n[currentLang].labelPopularity} ${popularityScore}</span>
                </div>
                <button onclick="openModalFromMap('${item.id}')" style="display: block; width: 100%; background: linear-gradient(135deg, #d4915d 0%, #c97d3d 100%); color: white; border: none; padding: 8px 12px; border-radius: 5px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(212,145,93,0.3);">
                    ${i18n[currentLang].viewDetails}
                </button>
            </div>
        </div>
    `;
}

// Create compact tooltip content for spot map (no photo, smaller size)
function createSpotTooltipContent(item) {
    const config = categoryConfig[item.category] || {};
    const categoryNames = getCategoryNames();

    // Get popularity score from item data
    let popularityScore = item.recommendation_score || '-';

    return `
        <div style="width: 160px; max-width: 90vw; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: visible !important; border-radius: 6px; padding: 0; margin: 0; box-sizing: border-box; background: white;">
            <div style="padding: 8px 10px; background: white; margin: 0; box-sizing: border-box; border-radius: 6px; overflow: visible !important;">
                <div style="font-size: 11px; font-weight: 600; color: #2a2a2a; margin-bottom: 2px; line-height: 1.2;">${item.title}</div>
                <div style="font-size: 9px; color: #999; margin-bottom: 5px; line-height: 1.2;">${item.place}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="background: ${config.bg}; color: ${config.color}; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 500; display: inline-flex; align-items: center; gap: 2px;">
                        ${config.icon} ${categoryNames[item.category]}
                    </span>
                    <span style="color: #d4915d; font-weight: 600; font-size: 9px;">${i18n[currentLang].labelPopularity} ${popularityScore}</span>
                </div>
                <button onclick="openModal('${item.id}')" style="display: block !important; width: 100%; background: linear-gradient(135deg, #d4915d 0%, #c97d3d 100%); color: white; border: none; padding: 5px 8px; border-radius: 4px; font-size: 9px; font-weight: 600; cursor: pointer; box-shadow: 0 1px 3px rgba(212,145,93,0.3);">
                    ${i18n[currentLang].viewDetails}
                </button>
            </div>
        </div>
    `;
}

// Helper function to offset overlapping markers with zoom-based distance
function getOffsetCoordinates(items, zoomLevel = 12) {
    // Group items by coordinates
    const coordGroups = {};

    items.forEach(item => {
        if (item.coordinates) {
            const key = `${item.coordinates.lat.toFixed(6)},${item.coordinates.lng.toFixed(6)}`;
            if (!coordGroups[key]) {
                coordGroups[key] = [];
            }
            coordGroups[key].push(item);
        }
    });

    // Create offset map
    const offsetMap = new Map();

    Object.values(coordGroups).forEach(group => {
        if (group.length === 1) {
            // Single marker, no offset needed
            offsetMap.set(group[0].id, group[0].coordinates);
        } else {
            // Multiple markers at same location - arrange in circle
            const baseCoords = group[0].coordinates;

            // Calculate dynamic offset based on zoom level and number of overlapping markers
            // Formula: metersPerPixel = 156543.03392 * cos(lat) / 2^zoom
            // Abu Dhabi latitude: 24.4539° ≈ 0.4267 radians, cos ≈ 0.909
            const ABU_DHABI_LAT_RADIANS = 0.4267;
            const EARTH_CIRCUMFERENCE = 156543.03392;

            // Adjust separation based on number of overlapping markers
            const markerCount = group.length;
            let separationPixels;
            if (markerCount <= 4) {
                separationPixels = 20; // 2-4 markers: standard spacing
            } else if (markerCount <= 6) {
                separationPixels = 30; // 5-6 markers: more spacing
            } else {
                separationPixels = 40; // 7+ markers: maximum spacing
            }

            // Calculate meters per pixel at current zoom
            const metersPerPixel = EARTH_CIRCUMFERENCE * Math.cos(ABU_DHABI_LAT_RADIANS) / Math.pow(2, zoomLevel);

            // Calculate offset in meters (separation in pixels * meters per pixel)
            const offsetMeters = separationPixels * metersPerPixel;

            // Convert meters to degrees (approximate: 1 degree latitude ≈ 111,320 meters)
            const offsetDistance = offsetMeters / 111320;

            group.forEach((item, index) => {
                const angle = (360 / group.length) * index * (Math.PI / 180);
                const offsetLat = baseCoords.lat + (offsetDistance * Math.cos(angle));
                const offsetLng = baseCoords.lng + (offsetDistance * Math.sin(angle));

                offsetMap.set(item.id, { lat: offsetLat, lng: offsetLng });
            });
        }
    });

    return offsetMap;
}

// Update map markers
function updateMapMarkers() {
    // Close any open info window
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }

    markers.forEach(m => m.setMap(null));
    markers = [];

    // Get current zoom level
    const currentZoom = map ? map.getZoom() : 12;

    // Get offset coordinates for overlapping markers based on zoom
    const offsetCoords = getOffsetCoordinates(filteredData, currentZoom);

    filteredData.forEach(item => {
        if (item.coordinates) {
            const position = offsetCoords.get(item.id) || item.coordinates;

            const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: item.title,
                icon: createMarkerIcon(item.category)
            });

            // Create InfoWindow with custom content (no close button)
            const infoWindow = new google.maps.InfoWindow({
                content: createTooltipContent(item),
                disableAutoPan: false,
                maxWidth: 0,
                pixelOffset: new google.maps.Size(0, 0)
            });

            // Add listener to remove padding after info window is added to DOM
            google.maps.event.addListener(infoWindow, 'domready', function() {
                const iwOuter = document.querySelector('.gm-style-iw-c');
                const iwContent = document.querySelector('.gm-style-iw-d');

                if (iwOuter) {
                    iwOuter.style.paddingTop = '13px';
                    iwOuter.style.paddingLeft = '0';
                    iwOuter.style.paddingRight = '0';
                    iwOuter.style.paddingBottom = '0';
                    iwOuter.style.margin = '0';
                    iwOuter.style.borderRadius = '8px';
                }
                if (iwContent) {
                    iwContent.style.padding = '0';
                    iwContent.style.margin = '0';
                    iwContent.style.overflow = 'hidden';
                    const innerDiv = iwContent.querySelector('div');
                    if (innerDiv) {
                        innerDiv.style.padding = '0';
                        innerDiv.style.margin = '0';
                    }
                }
            });

            // Add click listener to show tooltip
            marker.addListener('click', (e) => {
                // Prevent map click from closing this immediately
                if (e) {
                    e.stop();
                }

                // Close previous info window if open
                if (currentInfoWindow && currentInfoWindow !== infoWindow) {
                    currentInfoWindow.close();
                }

                infoWindow.open(map, marker);
                currentInfoWindow = infoWindow;
            });

            markers.push(marker);
        }
    });
}

// Translate info field text (admission, hours, closed, duration, station)
function translateInfoField(text) {
    if (!text || text === '-') return text;

    const translations = {
        ko: {},
        en: {
            '무료': 'Free',
            '연중무휴': 'Open year-round',
            '없음': 'None',
            '시간': 'hours',
            '1인': 'per person',
            '그린피': 'Green fee',
            '액티비티별': 'per activity',
            '월요일': 'Monday',
            '화요일': 'Tuesday',
            '수요일': 'Wednesday',
            '목요일': 'Thursday',
            '금요일': 'Friday',
            '토요일': 'Saturday',
            '일요일': 'Sunday'
        },
        ar: {
            '무료': 'مجاني',
            '연중무휴': 'مفتوح طوال العام',
            '없음': 'لا يوجد',
            '시간': 'ساعات',
            '1인': 'للشخص',
            '그린피': 'رسوم الملعب',
            '액티비티별': 'لكل نشاط',
            '월요일': 'الاثنين',
            '화요일': 'الثلاثاء',
            '수요일': 'الأربعاء',
            '목요일': 'الخميس',
            '금요일': 'الجمعة',
            '토요일': 'السبت',
            '일요일': 'الأحد'
        },
        ja: {
            '무료': '無料',
            '연중무휴': '年中無休',
            '없음': 'なし',
            '시간': '時間',
            '1인': '1名',
            '그린피': 'グリーンフィー',
            '액티비티별': '各アクティビティ',
            '월요일': '月曜日',
            '화요일': '火曜日',
            '수요일': '水曜日',
            '목요일': '木曜日',
            '금요일': '金曜日',
            '토요일': '土曜日',
            '일요일': '日曜日'
        },
        zh: {
            '무료': '免费',
            '연중무휴': '全年无休',
            '없음': '无',
            '시간': '小时',
            '1인': '每人',
            '그린피': '果岭费',
            '액티비티별': '每项活动',
            '월요일': '星期一',
            '화요일': '星期二',
            '수요일': '星期三',
            '목요일': '星期四',
            '금요일': '星期五',
            '토요일': '星期六',
            '일요일': '星期日'
        }
    };

    let result = text;
    const langMap = translations[currentLang] || {};

    // Replace each Korean term with its translation
    for (const [korean, translated] of Object.entries(langMap)) {
        result = result.replace(new RegExp(korean, 'g'), translated);
    }

    return result;
}

// Open modal from map tooltip
window.openModalFromMap = function(id) {
    // Close the info window
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }
    openModal(id);
};

// Open modal
function openModal(id) {
    const item = allData.find(d => d.id === id);
    if (!item) return;

    const config = categoryConfig[item.category] || {};
    const categoryNames = getCategoryNames();

    // Header - 제목 옆에 카테고리 태그
    document.getElementById('modalName').textContent = item.title;
    document.getElementById('modalPlaceName').textContent = item.place;
    document.getElementById('modalTag').innerHTML = `${config.icon} ${categoryNames[item.category]}`;
    document.getElementById('modalTag').style.background = config.bg;
    document.getElementById('modalTag').style.color = config.color;
    
    // Introduction
    document.getElementById('modalSummary').textContent = item.summary;
    
    // Photos - Generate from photo_folder (try 01.jpg to 30.jpg)
    const galleryGrid = document.getElementById('modalGallery');
    const photoFolder = item.photo_folder || item.id;

    // Generate photo paths (will try loading, use dummy on error)
    const maxPhotos = 30; // Try up to 30 photos
    const photos = [];
    for (let i = 1; i <= maxPhotos; i++) {
        const photoPath = `photos/${photoFolder}/${String(i).padStart(2, '0')}.jpg`;
        photos.push(photoPath);
    }

    currentGalleryImages = photos;

    // Display first 12 photos immediately (use onerror for missing images)
    galleryGrid.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const imgSrc = photos[i];
        const img = document.createElement('img');
        img.className = 'gallery-thumb';
        img.src = imgSrc;
        img.alt = `Photo ${i+1}`;
        img.loading = 'lazy';
        img.onerror = function() {
            this.src = dummyImage;
            this.onclick = null;
        };
        img.onclick = () => openGallery(i);
        galleryGrid.appendChild(img);
    }
    
    // Information
    document.getElementById('modalAdmission').textContent = translateInfoField(item.admission) || '-';
    document.getElementById('modalHours').textContent = translateInfoField(item.hours) || '-';
    document.getElementById('modalClosed').textContent = translateInfoField(item.closed) || '-';
    document.getElementById('modalDuration').textContent = translateInfoField(item.duration) || '-';
    document.getElementById('modalStation').textContent = translateInfoField(item.station) || '-';
    
    // Address - 단순화
    document.getElementById('modalAddress').textContent = item.address || `${item.place}, ${item.area}, Abu Dhabi, UAE`;
    
    // Google Maps link
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place + ' Abu Dhabi')}`;
    document.getElementById('modalGoogleMap').href = mapsUrl;
    
    // Description
    document.getElementById('modalDescription').textContent = item.description;
    
    // Tips
    const tipsList = document.getElementById('modalTips');
    if (item.tips && item.tips.length > 0) {
        tipsList.innerHTML = item.tips.map(tip => `<li>${tip}</li>`).join('');
    } else {
        tipsList.innerHTML = '<li>방문 팁 준비 중</li>';
    }

    // 6 Metrics display using data from item (already has all ranking info)
    try {
        const categoryNames = getCategoryNames();

        // Get elements
        const popularityEl = document.getElementById('popPopularity');
        const overallRankEl = document.getElementById('popOverallRank');
        const categoryLabelEl = document.getElementById('popCategoryLabel');
        const categoryRankEl = document.getElementById('popCategoryRank');
        const gmScoreEl = document.getElementById('popGmScore');
        const fameEl = document.getElementById('popFame');
        const uniquenessEl = document.getElementById('popUniqueness');

        // Update category label to show actual category name
        if (categoryLabelEl) {
            categoryLabelEl.textContent = categoryNames[item.category] || 'Category Rank';
        }

        // 1. 매력도 (Attractiveness Score) - 30-99 (no /99)
        if (popularityEl) {
            if (item.recommendation_score) {
                popularityEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:5px"><path d="M21 15H19L15.5 7L11 18L8 12L6 15H4" stroke="currentColor" stroke-width="1.2"/></svg>${item.recommendation_score}`;
            } else {
                popularityEl.textContent = '-';
            }
        }

        // 2. 전체순위 (Overall Rank) - #X /101 (with /101 smaller)
        if (overallRankEl) {
            if (item.overall_rank) {
                overallRankEl.innerHTML = `#${item.overall_rank} <span class="rank-denominator">/101</span>`;
            } else {
                overallRankEl.textContent = '-';
            }
        }

        // 3. 카테고리순위 (Category Rank) - #X /total (with /total smaller)
        if (categoryRankEl) {
            if (item.category_rank && item.category_total) {
                categoryRankEl.innerHTML = `#${item.category_rank} <span class="rank-denominator">/${item.category_total}</span>`;
            } else {
                categoryRankEl.textContent = '-';
            }
        }

        // 4. 구글맵 평점 (Google Rating) - ★ X.X (star before number)
        if (gmScoreEl) {
            if (item.gm_rating && item.gm_rating > 0) {
                gmScoreEl.textContent = `★ ${item.gm_rating.toFixed(1)}`;
            } else {
                gmScoreEl.textContent = '-';
            }
        }

        // 5. 유명세 (Fame) - Text label
        if (fameEl) {
            fameEl.textContent = getFameLabel(item.fame_stars, currentLang);
        }

        // 6. 독특함 (Uniqueness) - Text label
        if (uniquenessEl) {
            uniquenessEl.textContent = getUniquenessLabel(item.uniqueness, currentLang);
        }
    } catch (error) {
        console.error('Error displaying metrics:', error);
        // Set all to dash on error
        const ids = ['popPopularity', 'popOverallRank', 'popCategoryRank', 'popGmScore', 'popFame', 'popUniqueness'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '-';
        });
    }
    
    // Spot map
    const spotMapContainer = document.getElementById('spotMapContainer');
    if (item.coordinates && typeof google !== 'undefined') {
        spotMapContainer.innerHTML = '';

        // Initialize spot map
        spotMap = new google.maps.Map(spotMapContainer, {
            center: item.coordinates,
            zoom: 12,
            styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false
        });

        // Function to render spot markers
        function renderSpotMarkers(currentItemId) {
            // Clear previous markers
            spotMarkers.forEach(m => m.setMap(null));
            spotMarkers = [];

            // Get current zoom level
            const currentZoom = spotMap ? spotMap.getZoom() : 12;

            // Get offset coordinates for overlapping markers based on zoom
            const spotOffsetCoords = getOffsetCoordinates(allData, currentZoom);

            // Variable to store current marker's info window
            let currentSpotInfoWindow = null;

            // Add markers for all nearby locations
            allData.forEach(dataItem => {
            if (dataItem.coordinates) {
                const position = spotOffsetCoords.get(dataItem.id) || dataItem.coordinates;

                const marker = new google.maps.Marker({
                    position: position,
                    map: spotMap,
                    title: dataItem.title,
                    icon: createMarkerIcon(dataItem.category),
                    zIndex: dataItem.id === item.id ? 1000 : 1
                });

                // Add click listener to all markers to show tooltip
                marker.addListener('click', () => {
                    // Close previous info window
                    if (currentSpotInfoWindow) {
                        currentSpotInfoWindow.close();
                    }

                    // Create and open info window for clicked marker
                    currentSpotInfoWindow = new google.maps.InfoWindow({
                        content: createSpotTooltipContent(dataItem),
                        disableAutoPan: false,
                        maxWidth: 0,
                        pixelOffset: new google.maps.Size(0, -15)
                    });

                    // Style the info window
                    google.maps.event.addListener(currentSpotInfoWindow, 'domready', function() {
                        const iwOuter = document.querySelector('.gm-style-iw-c');
                        const iwContent = document.querySelector('.gm-style-iw-d');

                        if (iwOuter) {
                            iwOuter.style.padding = '0';
                            iwOuter.style.margin = '0';
                            iwOuter.style.borderRadius = '8px';
                            iwOuter.style.maxHeight = 'none';
                            iwOuter.style.height = 'auto';
                            iwOuter.style.overflow = 'visible';
                        }
                        if (iwContent) {
                            iwContent.style.padding = '0';
                            iwContent.style.margin = '0';
                            iwContent.style.overflow = 'visible';
                            iwContent.style.maxHeight = 'none';
                            iwContent.style.height = 'auto';
                            const innerDiv = iwContent.querySelector('div');
                            if (innerDiv) {
                                innerDiv.style.padding = '0';
                                innerDiv.style.margin = '0';
                                innerDiv.style.overflow = 'visible';
                            }
                        }
                    });

                    // Open the info window
                    currentSpotInfoWindow.open(spotMap, marker);
                });

                // Highlight current location marker and auto-open tooltip
                if (dataItem.id === currentItemId) {
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(() => marker.setAnimation(null), 2000);

                    // Auto-trigger click to show tooltip for current marker
                    google.maps.event.trigger(marker, 'click');
                }

                spotMarkers.push(marker);
            }
            });
        }

        // Initial render
        renderSpotMarkers(item.id);

        // Re-render markers when zoom changes
        spotMap.addListener('zoom_changed', () => {
            renderSpotMarkers(item.id);
        });

    } else if (item.coordinates) {
        // Fallback to iframe if Google Maps not loaded
        const embedUrl = `https://www.google.com/maps?q=${item.coordinates.lat},${item.coordinates.lng}&z=15&output=embed`;
        spotMapContainer.innerHTML = `
            <iframe width="100%" height="300" frameborder="0" style="border:0; border-radius: 8px;"
                src="${embedUrl}"
                loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
    } else {
        spotMapContainer.innerHTML = '<div style="padding: 60px; text-align: center; color: #94a3b8;">위치 정보 준비 중</div>';
    }
    
    // Nearby places
    updateNearbyPlaces(item);
    
    // Scores Summary - 10개
    const scoreSummaryGrid = document.getElementById('modalScoreSummary');
    const scoreCategories = getScoreCategories();
    scoreSummaryGrid.innerHTML = scoreCategories.map(cat => {
        const score = item.scores?.[cat.key];
        const stars = score
            ? `<span class="star-filled">${'★'.repeat(score)}</span><span class="star-empty">${'★'.repeat(5 - score)}</span>`
            : '-';
        return `
            <div class="score-item" onclick="scrollToDetailCard('detail-${cat.key}')">
                <span class="score-icon">${cat.icon}</span>
                <span class="score-name">${cat.name}</span>
                <span class="score-stars">${stars}</span>
            </div>
        `;
    }).join('');
    
    // Detailed Evaluation - 10개 카드
    const scoresListGrid = document.getElementById('modalScoresList');
    scoresListGrid.innerHTML = scoreCategories.map(cat => {
        const score = item.scores?.[cat.key];
        const stars = score
            ? `<span class="star-filled">${'★'.repeat(score)}</span><span class="star-empty">${'★'.repeat(5 - score)}</span>`
            : '-';
        const reasons = item.score_reasons?.[cat.key] || [i18n[currentLang].comingSoon];
        return `
            <div class="score-detail-card" id="detail-${cat.key}">
                <div class="score-detail-header">
                    <div class="score-detail-title">
                        <span class="score-detail-icon">${cat.icon}</span>
                        <span class="score-detail-name">${cat.name}</span>
                    </div>
                    <span class="score-detail-stars">${stars}</span>
                </div>
                <ul class="score-detail-reasons">
                    ${reasons.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
        `;
    }).join('');
    
    // Show modal
    document.getElementById('modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Update nearby places
function updateNearbyPlaces(currentItem) {
    const nearbyList = document.getElementById('modalNearby');
    
    if (!currentItem.coordinates) {
        nearbyList.innerHTML = '<li style="justify-content: center; color: #94a3b8;">위치 정보 없음</li>';
        return;
    }
    
    const nearby = allData
        .filter(item => item.id !== currentItem.id && item.coordinates)
        .map(item => ({
            ...item,
            distance: getDistance(currentItem.coordinates.lat, currentItem.coordinates.lng, item.coordinates.lat, item.coordinates.lng)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
    
    if (nearby.length === 0) {
        nearbyList.innerHTML = '<li style="justify-content: center; color: #94a3b8;">근처 장소 없음</li>';
        return;
    }
    
    nearbyList.innerHTML = nearby.map(item => {
        const config = categoryConfig[item.category] || {};
        const distText = item.distance < 1 ? Math.round(item.distance * 1000) + 'm' : item.distance.toFixed(1) + 'km';
        return `<li class="nearby-item">
            <div class="nearby-content">
                <div class="nearby-title">${config.icon} ${item.title}</div>
                <div class="nearby-bottom">
                    <span class="nearby-place">${item.place}</span>
                    <span class="nearby-distance">${distText}</span>
                </div>
            </div>
            <button class="nearby-detail-btn" onclick="openModal('${item.id}')">${i18n[currentLang].viewDetails}</button>
        </li>`;
    }).join('');
}

// Calculate distance (Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Scroll to detail card
function scrollToDetailCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        card.style.transform = 'scale(1.02)';
        card.style.boxShadow = '0 4px 12px rgba(212,145,93,0.3)';
        setTimeout(() => {
            card.style.transform = '';
            card.style.boxShadow = '';
        }, 800);
    }
}
window.scrollToDetailCard = scrollToDetailCard;

// Close modal
function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeGallery();
    }
});

// Copy address
function copyAddress() {
    const text = document.getElementById('modalAddress').textContent;
    navigator.clipboard.writeText(text).then(() => alert('주소가 복사되었습니다.'));
}

// Gallery functions
function openGallery(index) {
    // Use all images (browser will handle loading)
    currentValidImages = currentGalleryImages;
    currentGalleryIndex = index;

    // Set main image
    document.getElementById('galleryImage').src = currentValidImages[index];
    document.getElementById('galleryCounter').textContent = `${index + 1} / ${currentValidImages.length}`;

    // Populate thumbnails (max 12)
    const thumbnailsContainer = document.getElementById('galleryThumbnails');
    thumbnailsContainer.innerHTML = '';

    const maxThumbnails = Math.min(12, currentValidImages.length);
    currentValidImages.slice(0, maxThumbnails).forEach((src, thumbIndex) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.className = 'gallery-thumbnail' + (thumbIndex === index ? ' active' : '');
        thumb.loading = 'lazy';
        thumb.onerror = function() {
            this.src = dummyImage;
            this.style.opacity = '0.3';
        };
        thumb.onclick = () => {
            jumpToGalleryImage(thumbIndex);
        };
        thumbnailsContainer.appendChild(thumb);
    });

    document.getElementById('galleryModal').classList.add('active');
}

function closeGallery() {
    document.getElementById('galleryModal').classList.remove('active');
}

function navigateGallery(dir) {
    if (currentValidImages.length === 0) return;

    currentGalleryIndex = (currentGalleryIndex + dir + currentValidImages.length) % currentValidImages.length;
    document.getElementById('galleryImage').src = currentValidImages[currentGalleryIndex];
    document.getElementById('galleryCounter').textContent = `${currentGalleryIndex + 1} / ${currentValidImages.length}`;

    // Update active thumbnail
    updateActiveThumbnail();
}

function jumpToGalleryImage(validIndex) {
    if (validIndex < 0 || validIndex >= currentValidImages.length) return;

    currentGalleryIndex = validIndex;
    document.getElementById('galleryImage').src = currentValidImages[validIndex];
    document.getElementById('galleryCounter').textContent = `${validIndex + 1} / ${currentValidImages.length}`;

    // Update active thumbnail
    updateActiveThumbnail();
}

function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll('.gallery-thumbnail');
    if (currentGalleryIndex >= currentValidImages.length) return;

    const currentImageSrc = currentValidImages[currentGalleryIndex];

    thumbnails.forEach((thumb) => {
        if (thumb.src === currentImageSrc || thumb.src.endsWith(currentImageSrc)) {
            thumb.classList.add('active');
            // Scroll thumbnail into view
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            thumb.classList.remove('active');
        }
    });
}
