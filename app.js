const state = {
    lang: 'ko',
    chartReady: false,
    stockData: null,
    resizeTimer: null
};

const appBaseUrl = new URL('.', document.currentScript.src);

const translations = {
    ko: {
        title: '삼성전자 PSU 보상 계산기',
        targetDate: (date) => `약정 종료일: ${date}`,
        dDayFinished: '종료됨',
        basePriceLabel: '기준주가 (VWAP 평균)',
        increaseRatePrefix: (price) => `최초 기준가 (${formatNumber(price)}원) 대비 `,
        activeTierPrefix: '현재 적용 구간: ',
        rewardSection: '직급별 예상 보상',
        detailSection: '주가 데이터 상세',
        headerLevel: '직급',
        headerShares: '주식 수',
        headerReward: '예상 수령액 (세전)',
        labelCurrentPrice: '현재 주가',
        labelVwap1w: '1주일 가중평균',
        labelVwap1m: '1개월 가중평균',
        labelVwap2m: '2개월 가중평균',
        psuNote: [
            'PSU 보상은 주가 상승률 구간에 따라 고정된 주식 수가 지급됩니다. 예상 수령액은 [지급 주식 수 × 현재 주가]로 계산된 세전 금액입니다.',
            '데이터는 Yahoo Finance 기반으로 매일 오후 6시(KST)에 자동 업데이트됩니다. 비공식 참고용 계산기이며 실제 지급액 및 세금과 다를 수 있습니다.'
        ],
        summaryTitle: '삼성 PSU 제도 요약',
        summaryPurpose: '미래 장기 가치 상승에 연동된 주식 보상 (OPI와 별개)',
        summaryMethod: '3년 뒤 주가 상승폭에 따라 자사주 지급 (3년 분할)',
        summaryBasePrice: (price) => `2025년 10월 약정 기준 약 ${formatNumber(price)}원`,
        summaryTarget: '삼성전자 임직원 (CL1~CL4 직급별 차등)',
        condTitle: '지급 조건 (3년 뒤 주가 상승률)',
        btnShare: 'URL 공유하기',
        coffeeLabel: '커피 후원하기',
        shareSuccess: 'URL이 클립보드에 복사되었습니다.',
        lastUpdatePrefix: '최근 업데이트: ',
        won: ' 원',
        shares: ' 주',
        about: '약 ',
        loadingError: '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    },
    en: {
        title: 'Samsung PSU Calculator',
        targetDate: (date) => `Contract End Date: ${date}`,
        dDayFinished: 'Finished',
        basePriceLabel: 'Base Price (VWAP Avg)',
        increaseRatePrefix: (price) => `vs Initial Base (${formatNumber(price)} KRW): `,
        activeTierPrefix: 'Active tier: ',
        rewardSection: 'Estimated Reward',
        detailSection: 'Stock Data Details',
        headerLevel: 'Level',
        headerShares: 'Shares',
        headerReward: 'Reward (Pre-tax)',
        labelCurrentPrice: 'Current',
        labelVwap1w: '1-W VWAP',
        labelVwap1m: '1-M VWAP',
        labelVwap2m: '2-M VWAP',
        psuNote: [
            'Rewards are fixed shares based on stock price increase. Estimated rewards are [Shares × Current Price] before tax.',
            'Data is based on Yahoo Finance and updates daily at 18:00 KST. This is an unofficial reference calculator; actual payout and taxes may differ.'
        ],
        summaryTitle: 'Samsung PSU Summary',
        summaryPurpose: 'Stock reward linked to long-term value growth (separate from OPI)',
        summaryMethod: 'Stock payout based on 3-year price increase (3-year vesting)',
        summaryBasePrice: (price) => `Base Price: ~${formatNumber(price)} KRW (Set Oct 2025)`,
        summaryTarget: 'Eligible: Samsung employees (CL1~CL4 levels)',
        condTitle: 'Payout Conditions (3-year Stock Increase)',
        btnShare: 'Share URL',
        coffeeLabel: 'Support this tool',
        shareSuccess: 'URL copied to clipboard.',
        lastUpdatePrefix: 'Last Update: ',
        won: ' KRW',
        shares: ' Shrs',
        about: 'Approx. ',
        loadingError: 'Error loading data. Please try again later.'
    }
};

const elements = {};

function cacheElements() {
    [
        'title',
        'targetDateLabel',
        'dDay',
        'loading',
        'content',
        'basePriceLabel',
        'basePrice',
        'increaseRate',
        'activeTier',
        'rewardSectionTitle',
        'headerLevel',
        'headerShares',
        'headerReward',
        'detailSectionTitle',
        'labelCurrentPrice',
        'labelVwap1w',
        'labelVwap1m',
        'labelVwap2m',
        'currentPrice',
        'vwap1w',
        'vwap1m',
        'vwap2m',
        'lastUpdated',
        'positionList',
        'psuInfoNote',
        'summaryTitle',
        'summaryPurpose',
        'summaryMethod',
        'summaryBasePrice',
        'summaryTarget',
        'condTitle',
        'conditionGrid',
        'btnShare',
        'coffeeLabel',
        'langKor',
        'langEng',
        'chartContainer'
    ].forEach((id) => {
        elements[id] = document.getElementById(id);
    });
}

function formatNumber(value) {
    return Number(value).toLocaleString('ko-KR');
}

function formatMoney(value, suffix) {
    return `${formatNumber(Math.round(Number(value)))}${suffix}`;
}

function getTierLabel(tier) {
    if (!tier) return '';
    return state.lang === 'en' ? tier.label_en : tier.label_ko;
}

function setLanguage(lang, updateUrl = true) {
    state.lang = lang;
    document.documentElement.lang = lang;
    document.body.className = `lang-${lang}`;
    elements.langKor.classList.toggle('active', lang === 'ko');
    elements.langEng.classList.toggle('active', lang === 'en');

    if (updateUrl) {
        const url = new URL(window.location.href);
        if (url.protocol === 'file:') {
            if (lang === 'en') {
                url.searchParams.set('lang', 'en');
            } else {
                url.searchParams.delete('lang');
            }
            window.history.pushState({}, '', url);
        } else if (lang === 'en') {
            window.history.pushState({}, '', new URL('./en/', appBaseUrl));
        } else {
            window.history.pushState({}, '', appBaseUrl);
        }
    }

    if (state.stockData) renderData(state.stockData);
}

function updateDDay(targetDateStr) {
    const target = new Date(`${targetDateStr}T00:00:00+09:00`);
    const now = new Date();
    const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (days > 0) {
        elements.dDay.textContent = `D-${days}`;
    } else if (days === 0) {
        elements.dDay.textContent = 'D-Day';
    } else {
        elements.dDay.textContent = translations[state.lang].dDayFinished;
    }
}

async function copyURL() {
    try {
        await navigator.clipboard.writeText(window.location.href);
        alert(translations[state.lang].shareSuccess);
    } catch {
        window.prompt(translations[state.lang].btnShare, window.location.href);
    }
}

function drawChart(chartData) {
    if (!state.chartReady || !chartData || !elements.chartContainer) return;

    if (elements.chartContainer.clientWidth === 0) {
        window.setTimeout(() => drawChart(chartData), 100);
        return;
    }

    const data = google.visualization.arrayToDataTable(chartData, true);
    const isMobile = window.innerWidth <= 480;
    const options = {
        legend: 'none',
        candlestick: {
            fallingColor: { strokeWidth: 0, fill: '#0033ff' },
            risingColor: { strokeWidth: 0, fill: '#ed1c24' }
        },
        backgroundColor: '#ffffff',
        chartArea: {
            width: isMobile ? '82%' : '88%',
            height: '80%',
            left: isMobile ? 45 : 60,
            right: 10
        },
        hAxis: { textStyle: { fontSize: isMobile ? 9 : 10, color: '#888' } },
        vAxis: {
            textStyle: { fontSize: isMobile ? 9 : 10, color: '#888' },
            gridlines: { color: '#f0f0f0' },
            format: 'short'
        }
    };

    const chart = new google.visualization.CandlestickChart(elements.chartContainer);
    chart.draw(data, options);
}

function renderPsuNote(lines) {
    elements.psuInfoNote.replaceChildren();
    lines.forEach((line, index) => {
        if (index > 0) elements.psuInfoNote.appendChild(document.createElement('br'));
        elements.psuInfoNote.append(`※ ${line}`);
    });
}

function renderConditionGrid(tiers) {
    elements.conditionGrid.replaceChildren();

    const displayTiers = [...tiers].sort((a, b) => a.min_rate - b.min_rate);
    displayTiers.forEach((tier) => {
        const item = document.createElement('span');
        item.textContent = getTierLabel(tier);
        elements.conditionGrid.appendChild(item);
    });
}

function renderPositions(positions, t) {
    elements.positionList.replaceChildren();

    positions.forEach((pos) => {
        const row = document.createElement('div');
        row.className = 'pos-item';

        const name = document.createElement('span');
        name.className = 'pos-name';
        name.textContent = pos.name;

        const shares = document.createElement('span');
        shares.className = 'pos-shares';
        shares.textContent = `${formatNumber(pos.shares)}${t.shares}`;

        const reward = document.createElement('span');
        reward.className = 'pos-reward';
        reward.textContent = `${t.about}${formatMoney(pos.estimated_reward, t.won)}`;

        row.append(name, shares, reward);
        elements.positionList.appendChild(row);
    });
}

function renderData(data) {
    const t = translations[state.lang];

    elements.title.textContent = t.title;
    elements.targetDateLabel.textContent = t.targetDate(data.target_date);
    elements.basePriceLabel.textContent = t.basePriceLabel;
    elements.rewardSectionTitle.textContent = t.rewardSection;
    elements.headerLevel.textContent = t.headerLevel;
    elements.headerShares.textContent = t.headerShares;
    elements.headerReward.textContent = t.headerReward;
    elements.detailSectionTitle.textContent = t.detailSection;
    elements.labelCurrentPrice.textContent = t.labelCurrentPrice;
    elements.labelVwap1w.textContent = t.labelVwap1w;
    elements.labelVwap1m.textContent = t.labelVwap1m;
    elements.labelVwap2m.textContent = t.labelVwap2m;
    elements.summaryTitle.textContent = t.summaryTitle;
    elements.summaryPurpose.textContent = t.summaryPurpose;
    elements.summaryMethod.textContent = t.summaryMethod;
    elements.summaryBasePrice.textContent = t.summaryBasePrice(data.initial_base_price);
    elements.summaryTarget.textContent = t.summaryTarget;
    elements.condTitle.textContent = t.condTitle;
    elements.btnShare.textContent = t.btnShare;
    elements.coffeeLabel.textContent = t.coffeeLabel;

    elements.basePrice.textContent = formatMoney(data.base_price, t.won);
    const prefix = data.increase_rate >= 0 ? '+' : '';
    elements.increaseRate.textContent = `${t.increaseRatePrefix(data.initial_base_price)}${prefix}${data.increase_rate}%`;
    elements.increaseRate.style.color = data.increase_rate >= 0 ? '#ffcccc' : '#ccccff';
    elements.activeTier.textContent = `${t.activeTierPrefix}${getTierLabel(data.reward_tier)}`;

    elements.currentPrice.textContent = formatMoney(data.current_price, t.won);
    elements.vwap1w.textContent = formatMoney(data.vwap_1w, t.won);
    elements.vwap1m.textContent = formatMoney(data.vwap_1m, t.won);
    elements.vwap2m.textContent = formatMoney(data.vwap_2m, t.won);
    elements.lastUpdated.textContent = `${t.lastUpdatePrefix}${data.last_updated}`;

    renderPsuNote(t.psuNote);
    renderConditionGrid(data.reward_tiers);
    renderPositions(data.positions, t);
    updateDDay(data.target_date);
    drawChart(data.chart_data);
}

async function fetchData() {
    try {
        const dataUrl = new URL('data.json', appBaseUrl);
        dataUrl.searchParams.set('v', Date.now());
        const response = await fetch(dataUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        state.stockData = data;
        renderData(data);
        elements.loading.hidden = true;
        elements.content.hidden = false;
    } catch (error) {
        console.error('Error:', error);
        elements.loading.textContent = translations[state.lang].loadingError;
    }
}

function initChart() {
    if (!window.google?.charts) return;

    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
        state.chartReady = true;
        if (state.stockData) drawChart(state.stockData.chart_data);
    });
}

function initApp() {
    cacheElements();
    elements.langKor.addEventListener('click', () => setLanguage('ko'));
    elements.langEng.addEventListener('click', () => setLanguage('en'));
    elements.btnShare.addEventListener('click', copyURL);

    const params = new URLSearchParams(window.location.search);
    const pathLang = window.location.pathname.split('/').filter(Boolean).pop();
    const lang = params.get('lang') === 'en' || pathLang === 'en' ? 'en' : 'ko';
    setLanguage(lang, false);
    initChart();
    fetchData();

    window.addEventListener('resize', () => {
        window.clearTimeout(state.resizeTimer);
        state.resizeTimer = window.setTimeout(() => {
            if (state.stockData) drawChart(state.stockData.chart_data);
        }, 150);
    });
}

document.addEventListener('DOMContentLoaded', initApp);
