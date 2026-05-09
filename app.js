const state = {
    lang: 'ko',
    chartReady: false,
    stockData: null,
    resizeTimer: null,
    taxRate: 35
};

const appBaseUrl = new URL('.', document.currentScript.src);
const taxRates = [24, 35, 38, 40, 42, 45];

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
        taxSection: '세후 체감액',
        taxBadge: '프로토타입',
        taxHelp: '내 과세표준의 마지막 구간에 붙는 한계세율을 선택하면, 지방소득세 10%를 포함한 단순 추정치를 보여줍니다.',
        taxDisclaimer: '정확한 신고용 계산이 아니라 PSU 수령 시 필요한 현금 규모를 가늠하기 위한 참고용입니다.',
        taxExplainerSummary: '과세표준과 한계세율이 뭐예요?',
        taxExplainerBody: [
            '과세표준은 총급여에서 근로소득공제, 인적공제, 보험료·카드·의료비 등 공제를 뺀 뒤 실제 세율을 적용하는 금액입니다.',
            '한계세율은 과세표준의 마지막 구간에 붙는 세율입니다. PSU가 들어오면 보통 기존 과세표준 위에 얹히므로, 추가 보상분은 이 한계세율에 가까운 세율로 과세될 수 있습니다.'
        ],
        taxBracketTableTitle: '과세표준별 기본 세율',
        taxBracketRangeLabel: '과세표준',
        taxBracketRateLabel: '세율',
        taxBrackets: [
            ['1,400만 원 이하', '6%'],
            ['1,400만~5,000만 원 이하', '15%'],
            ['5,000만~8,800만 원 이하', '24%'],
            ['8,800만~1.5억 원 이하', '35%'],
            ['1.5억~3억 원 이하', '38%'],
            ['3억~5억 원 이하', '40%'],
            ['5억~10억 원 이하', '42%'],
            ['10억 원 초과', '45%']
        ],
        taxRateLabel: (rate) => `한계세율 ${rate}%`,
        taxRateSubLabel: '지방소득세 포함',
        taxGrossLabel: '세전 보상',
        taxEstimatedLabel: '예상 세금',
        taxNetLabel: '세후 체감액',
        taxBracketHint: '세율 구간은 연봉이 아니라 공제 후 과세표준으로 정해집니다.',
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
        fxRate: (rate) => `USD/KRW ${formatNumber(rate)}`,
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
        taxSection: 'After-tax Feel',
        taxBadge: 'Prototype',
        taxHelp: 'Choose the marginal tax bracket applied to your last taxable-income band. Estimates include 10% local income tax.',
        taxDisclaimer: 'This is not a filing calculation. It is a rough guide to estimate the cash needed when PSU shares vest.',
        taxExplainerSummary: 'What are taxable income and marginal tax rate?',
        taxExplainerBody: [
            'Taxable income is the amount that remains after deductions from gross salary, such as employment-income deductions, personal deductions, insurance, card spending, and medical expenses.',
            'The marginal tax rate is the rate applied to your last taxable-income band. PSU value is usually added on top of existing taxable income, so the additional reward can be taxed close to that marginal rate.'
        ],
        taxBracketTableTitle: 'Basic tax rates by taxable income',
        taxBracketRangeLabel: 'Taxable income',
        taxBracketRateLabel: 'Rate',
        taxBrackets: [
            ['Up to KRW 14M', '6%'],
            ['KRW 14M~50M', '15%'],
            ['KRW 50M~88M', '24%'],
            ['KRW 88M~150M', '35%'],
            ['KRW 150M~300M', '38%'],
            ['KRW 300M~500M', '40%'],
            ['KRW 500M~1B', '42%'],
            ['Over KRW 1B', '45%']
        ],
        taxRateLabel: (rate) => `Marginal ${rate}%`,
        taxRateSubLabel: 'incl. local tax',
        taxGrossLabel: 'Pre-tax reward',
        taxEstimatedLabel: 'Estimated tax',
        taxNetLabel: 'After-tax feel',
        taxBracketHint: 'Tax brackets are based on taxable income after deductions, not gross salary.',
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
        fxRate: (rate) => `USD/KRW ${formatNumber(rate)}`,
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
        'taxSectionTitle',
        'taxBadge',
        'taxHelp',
        'taxExplainerSummary',
        'taxExplainerBody',
        'taxRateOptions',
        'taxResults',
        'taxDisclaimer',
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

function formatUsd(value) {
    return Number(value).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });
}

function formatDisplayMoney(value, t) {
    return state.lang === 'en' ? formatUsd(value) : formatMoney(value, t.won);
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
        if (state.lang === 'en' && pos.estimated_reward_usd) {
            reward.textContent = `${t.about}${formatUsd(pos.estimated_reward_usd)}`;
            reward.title = `${formatMoney(pos.estimated_reward, t.won)} / ${t.fxRate(state.stockData.usd_krw)}`;
        } else {
            reward.textContent = `${t.about}${formatMoney(pos.estimated_reward, t.won)}`;
        }

        row.append(name, shares, reward);
        elements.positionList.appendChild(row);
    });
}

function renderTaxRateOptions(t) {
    elements.taxRateOptions.replaceChildren();

    taxRates.forEach((rate) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tax-rate-btn';
        button.classList.toggle('active', rate === state.taxRate);
        button.textContent = `${rate}%`;
        button.setAttribute('aria-pressed', String(rate === state.taxRate));
        button.title = t.taxRateLabel(rate);
        button.addEventListener('click', () => {
            state.taxRate = rate;
            if (state.stockData) {
                renderTaxEstimator(state.stockData, translations[state.lang]);
            }
        });
        elements.taxRateOptions.appendChild(button);
    });
}

function renderTaxExplainer(t) {
    elements.taxExplainerSummary.textContent = t.taxExplainerSummary;
    elements.taxExplainerBody.replaceChildren();

    t.taxExplainerBody.forEach((text) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        elements.taxExplainerBody.appendChild(paragraph);
    });

    const tableTitle = document.createElement('div');
    tableTitle.className = 'tax-bracket-title';
    tableTitle.textContent = t.taxBracketTableTitle;

    const table = document.createElement('div');
    table.className = 'tax-bracket-table';

    const headerRange = document.createElement('strong');
    headerRange.textContent = t.taxBracketRangeLabel;
    const headerRate = document.createElement('strong');
    headerRate.textContent = t.taxBracketRateLabel;
    table.append(headerRange, headerRate);

    t.taxBrackets.forEach(([range, rate]) => {
        const rangeEl = document.createElement('span');
        rangeEl.textContent = range;
        const rateEl = document.createElement('span');
        rateEl.textContent = rate;
        table.append(rangeEl, rateEl);
    });

    elements.taxExplainerBody.append(tableTitle, table);
}

function getRewardAmountForDisplay(pos) {
    if (state.lang === 'en' && pos.estimated_reward_usd) {
        return pos.estimated_reward_usd;
    }
    return pos.estimated_reward;
}

function renderTaxEstimator(data, t) {
    renderTaxRateOptions(t);
    elements.taxResults.replaceChildren();

    const effectiveRate = state.taxRate * 1.1 / 100;

    data.positions.forEach((pos) => {
        const gross = getRewardAmountForDisplay(pos);
        const estimatedTax = gross * effectiveRate;
        const net = Math.max(gross - estimatedTax, 0);

        const card = document.createElement('div');
        card.className = 'tax-result-card';

        const heading = document.createElement('div');
        heading.className = 'tax-result-heading';
        heading.textContent = pos.name;

        const grid = document.createElement('div');
        grid.className = 'tax-result-grid';

        [
            [t.taxGrossLabel, formatDisplayMoney(gross, t)],
            [t.taxEstimatedLabel, formatDisplayMoney(estimatedTax, t)],
            [t.taxNetLabel, formatDisplayMoney(net, t)]
        ].forEach(([label, value]) => {
            const item = document.createElement('div');
            item.className = 'tax-result-item';

            const labelEl = document.createElement('span');
            labelEl.className = 'tax-result-label';
            labelEl.textContent = label;

            const valueEl = document.createElement('strong');
            valueEl.textContent = value;

            item.append(labelEl, valueEl);
            grid.appendChild(item);
        });

        card.append(heading, grid);
        elements.taxResults.appendChild(card);
    });
}

function renderData(data) {
    const t = translations[state.lang];

    elements.title.textContent = t.title;
    elements.targetDateLabel.textContent = t.targetDate(data.target_date);
    elements.basePriceLabel.textContent = t.basePriceLabel;
    elements.rewardSectionTitle.textContent = t.rewardSection;
    elements.taxSectionTitle.textContent = t.taxSection;
    elements.taxBadge.textContent = t.taxBadge;
    elements.taxHelp.textContent = t.taxHelp;
    elements.taxDisclaimer.textContent = `${t.taxDisclaimer} ${t.taxBracketHint}`;
    renderTaxExplainer(t);
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
    const fxText = data.usd_krw ? ` · ${t.fxRate(data.usd_krw)}` : '';
    elements.lastUpdated.textContent = `${t.lastUpdatePrefix}${data.last_updated}${fxText}`;

    renderPsuNote(t.psuNote);
    renderConditionGrid(data.reward_tiers);
    renderPositions(data.positions, t);
    renderTaxEstimator(data, t);
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
