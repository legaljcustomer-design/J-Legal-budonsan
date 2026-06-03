import { useMemo, useState, type CSSProperties } from 'react';

declare global {
  interface Window {
    pdfjsLib?: any;
    Tesseract?: any;
  }
}

type ParsedCondition = {
  label: string;
  reason: string;
};

type ParsedCustomerRequest = {
  customerName: string;
  genderMemo: string;
  visaStatus: string;
  areaMemo: string;
  excludedAreas: string[];
  preferredAreas: string[];
  maxTotalRent: number | null;
  layouts: string[];
  minFloor: number | null;
  minTatami: number | null;
  maxWalkMinutes: number | null;
  mustConditions: ParsedCondition[];
  preferredConditions: ParsedCondition[];
  ngConditions: ParsedCondition[];
  checkNeededConditions: ParsedCondition[];
  japaneseSearchKeywords: string[];
  excludedJapaneseKeywords: string[];
  internalMemo: string[];
};

type YesNoUnknown = 'yes' | 'no' | 'unknown';
type MatchRank = 'A추천' | 'B후보' | 'C확인필요' | '탈락';

type CandidateProperty = {
  id: string;
  buildingName: string;
  roomNo: string;
  address: string;
  lineName: string;
  nearestStation: string;
  walkMinutes: number | null;
  structure: string;
  builtYear: string;
  totalFloors: number | null;
  buildingEquipment: string;
  status: string;
  moveIn: string;
  layout: string;
  areaSqm: number | null;
  rent: number | null;
  managementFee: number | null;
  floor: number | null;
  facing: string;
  gasType: string;
  autoLock: YesNoUnknown;
  deliveryBox: YesNoUnknown;
  trashAnytime: YesNoUnknown;
  stoveIncluded: YesNoUnknown;
  stoveBurners: string;
  foreignContract: YesNoUnknown;
  guarantorNotRequired: YesNoUnknown;
  memo: string;
  rawText: string;
};

type MatchResult = {
  property: CandidateProperty;
  totalCost: number | null;
  score: number;
  rank: MatchRank;
  hardFailReasons: string[];
  strengths: string[];
  cautions: string[];
  checkNeeded: string[];
};

const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js';

const sampleInquiry = `이름 : 이기현 (남성추정)

재류자격 : 워킹홀리데이 1년

지역 : 오사카 (구체적인 동네를 희망하는 것은 아니지만, 신이마미야역 근처로는 절대 XXX , 그 위쪽동네로 희망)

월세 + 관리비 상한선 : 7만 엔 초~중반까지 OK

1. 1R 또는 1K 타입 맨션 (7조 정도)

2. 3층 이상 희망

3. 집에 벌레 많이 안나오길 희망

4. 분리수거 24시간 가능한 곳

5. 1층 공동현관문이 오토록이어야함

6. 무인택배함 있는 곳이어야함

7. 철근콘크리트로 된 건물

8. 방음이 잘됐음 좋겠음

9. 겨울에도 따뜻한 방이면 좋겠음

10. 가스레인지가 기본옵션에 있길 희망하고, 있다면 2구 화구 희망

11. 치안이 괜찮은 동네

12. 집에서 → 역까지 도보 5~10분 이내

13. 주변에 전철 선로가 없고, 집앞에 고층건물이 있어서 시야가 차단되는 곳은 OUT

14. 북향집 절대 XXX

15. 집근처에 편의점 , 마트 , 약국이 있으면 감사합니다.

16. 프로판가스 XXX / 도시가스 희망

※ 17. 최대한 많은 매물 리스트를 희망한다고 합니다.`;

const areaDictionary: Record<string, string[]> = {
  오사카: ['大阪', '大阪市'],
  신이마미야: ['新今宮', '動物園前', '萩之茶屋', '西成'],
  난바: ['難波', 'なんば', '日本橋'],
  우메다: ['梅田', '大阪駅', '北区'],
  혼마치: ['本町', '堺筋本町'],
  텐노지: ['天王寺', '阿倍野'],
  츠루하시: ['鶴橋', '桃谷'],
};

function normalizeText(text: string) {
  return text
    .replace(/[：]/g, ':')
    .replace(/[，]/g, ',')
    .replace(/[〜～]/g, '~')
    .replace(/[㎥㎡]/g, '㎡')
    .toLowerCase();
}

function addUnique(target: string[], value: string) {
  const trimmed = value.trim();
  if (trimmed && !target.includes(trimmed)) {
    target.push(trimmed);
  }
}

function addCondition(target: ParsedCondition[], label: string, reason: string) {
  if (!target.some((item) => item.label === label)) {
    target.push({ label, reason });
  }
}

function extractLineValue(text: string, labels: string[]) {
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    for (const label of labels) {
      const regex = new RegExp(`${label}\\s*[:：]\\s*(.+)`, 'i');
      const match = trimmed.match(regex);

      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  return '';
}

function parseMoneyValue(value: string | undefined) {
  if (!value) return null;
  const normalized = value.replace(/[^\d]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBudget(text: string) {
  const normalized = normalizeText(text);

  const directRangeMatch = normalized.match(/(\d{2,3})[,，]?(\d{3})\s*[~-]\s*(\d{2,3})[,，]?(\d{3})\s*엔?/);
  if (directRangeMatch) {
    return Number(`${directRangeMatch[3]}${directRangeMatch[4]}`);
  }

  const directYenMatch = normalized.match(/(\d{2,3})[,，]?(\d{3})\s*엔?/);
  if (directYenMatch) {
    return Number(`${directYenMatch[1]}${directYenMatch[2]}`);
  }

  const rangeManMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:만\s*)?[~-]\s*(\d+(?:\.\d+)?)\s*만\s*엔?/);
  if (rangeManMatch?.[2]) {
    return Math.round(Number(rangeManMatch[2]) * 10000);
  }

  const manMatch = normalized.match(/(\d+(?:\.\d+)?)\s*만\s*엔?/);
  if (!manMatch) return null;

  const base = Number(manMatch[1]) * 10000;

  if (normalized.includes('초~중반') || normalized.includes('초중반')) return base + 5000;
  if (normalized.includes('중반')) return base + 5000;
  if (normalized.includes('후반')) return base + 8000;
  if (normalized.includes('초반')) return base + 3000;

  return base;
}

function parseLayouts(text: string) {
  const layouts: string[] = [];
  const candidates = ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK'];

  candidates.forEach((layout) => {
    const regex = new RegExp(layout, 'i');
    if (regex.test(text)) addUnique(layouts, layout);
  });

  if (normalizeText(text).includes('원룸') || normalizeText(text).includes('ワンルーム')) {
    addUnique(layouts, '1R');
  }

  return layouts;
}

function parseMinFloor(text: string) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+)\s*(층|階)\s*이상/);
  return match?.[1] ? Number(match[1]) : null;
}

function parseMinTatami(text: string) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(조|帖|畳)/);
  return match?.[1] ? Number(match[1]) : null;
}

function parseMaxWalkMinutes(text: string) {
  const normalized = normalizeText(text);

  const rangeMatch = normalized.match(/도보\s*(\d+)\s*~\s*(\d+)\s*분/);
  if (rangeMatch?.[2]) return Number(rangeMatch[2]);

  const stationWalkRangeMatch = normalized.match(/역까지\s*도보\s*(\d+)\s*~\s*(\d+)\s*분/);
  if (stationWalkRangeMatch?.[2]) return Number(stationWalkRangeMatch[2]);

  const withinMatch = normalized.match(/도보\s*(\d+)\s*분\s*이내/);
  if (withinMatch?.[1]) return Number(withinMatch[1]);

  const stationWalkWithinMatch = normalized.match(/역까지\s*도보\s*(\d+)\s*분\s*이내/);
  if (stationWalkWithinMatch?.[1]) return Number(stationWalkWithinMatch[1]);

  return null;
}

function detectExcludedAreas(text: string) {
  const normalized = normalizeText(text);
  const excludedAreas: string[] = [];
  const excludedJapaneseKeywords: string[] = [];

  Object.entries(areaDictionary).forEach(([koreanArea, japaneseKeywords]) => {
    const areaLower = koreanArea.toLowerCase();
    const appears =
      normalized.includes(areaLower) ||
      japaneseKeywords.some((word) => normalized.includes(word.toLowerCase()));

    const negativeNearby =
      normalized.includes(`${areaLower}역 근처로는 절대`) ||
      normalized.includes(`${areaLower} 근처는 절대`) ||
      normalized.includes(`${areaLower} 절대`) ||
      normalized.includes(`${areaLower} 제외`) ||
      normalized.includes(`${areaLower} 싫`) ||
      normalized.includes(`${areaLower} xxx`) ||
      normalized.includes(`${areaLower} out`);

    if (appears && negativeNearby) {
      addUnique(excludedAreas, koreanArea);
      japaneseKeywords.forEach((word) => addUnique(excludedJapaneseKeywords, word));
    }
  });

  if (
    normalized.includes('신이마미야') &&
    (normalized.includes('절대') || normalized.includes('xxx') || normalized.includes('out'))
  ) {
    addUnique(excludedAreas, '신이마미야 주변');
    ['新今宮', '動物園前', '萩之茶屋', '西成'].forEach((word) => {
      addUnique(excludedJapaneseKeywords, word);
    });
  }

  return { excludedAreas, excludedJapaneseKeywords };
}

function detectPreferredAreas(text: string) {
  const normalized = normalizeText(text);
  const preferredAreas: string[] = [];

  if (normalized.includes('오사카')) addUnique(preferredAreas, '오사카');
  if (normalized.includes('위쪽동네') || normalized.includes('위쪽 동네')) {
    addUnique(preferredAreas, '제외 지역보다 북쪽 생활권');
  }

  return preferredAreas;
}

function parseCustomerRequest(rawText: string): ParsedCustomerRequest {
  const normalized = normalizeText(rawText);

  const customerName = extractLineValue(rawText, ['이름', '성함', '고객명'])
    .replace(/\(.+\)/g, '')
    .trim();

  const genderMemo = rawText.includes('남성')
    ? '남성 추정'
    : rawText.includes('여성')
      ? '여성 추정'
      : '미입력';

  let visaStatus = extractLineValue(rawText, ['재류자격', '비자', '체류자격']);

  if (!visaStatus) {
    if (normalized.includes('워킹홀리데이') || normalized.includes('워홀')) {
      visaStatus = '워킹홀리데이';
    } else if (normalized.includes('유학')) {
      visaStatus = '유학';
    } else if (normalized.includes('취업비자')) {
      visaStatus = '취업비자';
    } else if (normalized.includes('배우자비자')) {
      visaStatus = '배우자비자';
    } else {
      visaStatus = '미입력';
    }
  }

  const areaMemo = extractLineValue(rawText, ['지역', '희망지역', '희망 지역']) || '미입력';
  const maxTotalRent = parseBudget(rawText);
  const layouts = parseLayouts(rawText);
  const minFloor = parseMinFloor(rawText);
  const minTatami = parseMinTatami(rawText);
  const maxWalkMinutes = parseMaxWalkMinutes(rawText);
  const { excludedAreas, excludedJapaneseKeywords } = detectExcludedAreas(rawText);
  const preferredAreas = detectPreferredAreas(rawText);

  const mustConditions: ParsedCondition[] = [];
  const preferredConditions: ParsedCondition[] = [];
  const ngConditions: ParsedCondition[] = [];
  const checkNeededConditions: ParsedCondition[] = [];
  const internalMemo: string[] = [];

  if (maxTotalRent) {
    addCondition(
      mustConditions,
      `월세+관리비 ${maxTotalRent.toLocaleString()}엔 이하`,
      '예산 상한이 명확하게 입력되어 있어 1차 필터 조건으로 사용합니다.',
    );
  }

  if (layouts.length > 0) {
    addCondition(
      mustConditions,
      `${layouts.join(' / ')} 타입`,
      '희망 간取り가 명확하므로 검색 조건으로 사용합니다.',
    );
  }

  if (minFloor) {
    addCondition(
      mustConditions,
      `${minFloor}층 이상`,
      '층수 희망이 명확하므로 필수 조건으로 분류합니다.',
    );
  }

  if (minTatami) {
    addCondition(
      preferredConditions,
      `${minTatami}조 이상 또는 그에 가까운 방`,
      '조수는 도면 표기 차이가 있어 선호 조건으로 두고 확인합니다.',
    );
  }

  if (maxWalkMinutes) {
    addCondition(
      mustConditions,
      `역 도보 ${maxWalkMinutes}분 이내`,
      '역거리 희망이 명확하므로 검색 조건으로 사용합니다.',
    );
  }

  if (normalized.includes('오토록') || normalized.includes('オートロック')) {
    addCondition(mustConditions, '오토록', '공동현관 오토록을 요구하고 있어 필수 설비로 분류합니다.');
  }

  if (
    normalized.includes('무인택배') ||
    normalized.includes('택배함') ||
    normalized.includes('宅配box') ||
    normalized.includes('宅配ボックス')
  ) {
    addCondition(mustConditions, '무인택배함 / 宅配BOX', '무인택배함을 요구하고 있어 필수 설비로 분류합니다.');
  }

  if (
    normalized.includes('철근콘크리트') ||
    normalized.includes('rc') ||
    normalized.includes('src') ||
    normalized.includes('鉄筋')
  ) {
    addCondition(mustConditions, 'RC / SRC / 철근콘크리트 구조', '구조 조건이 명확하고 방음·단열 희망과도 연결됩니다.');
  }

  if (normalized.includes('도시가스') || normalized.includes('都市ガス')) {
    addCondition(mustConditions, '도시가스', '도시가스 희망이 명확하므로 필수 조건으로 분류합니다.');
  }

  if (normalized.includes('프로판') || normalized.includes('プロパン')) {
    addCondition(ngConditions, '프로판가스', '프로판가스 제외 요청이 있어 탈락 조건으로 분류합니다.');
  }

  if (normalized.includes('북향') || normalized.includes('北向')) {
    addCondition(ngConditions, '북향', '북향 절대 제외 요청이 있어 탈락 조건으로 분류합니다.');
  }

  excludedAreas.forEach((area) => {
    addCondition(ngConditions, area, '고객이 명확히 제외한 지역 또는 생활권입니다.');
  });

  if (normalized.includes('선로') || normalized.includes('전철')) {
    addCondition(ngConditions, '전철 선로 인접', '소음 우려가 있어 제외 조건으로 분류합니다.');
    addCondition(checkNeededConditions, '지도상 선로 인접 여부', 'PDF만으로는 판단이 어려워 지도 확인이 필요합니다.');
  }

  if (normalized.includes('시야') || normalized.includes('고층건물') || normalized.includes('차단')) {
    addCondition(ngConditions, '창밖 시야 차단 심한 매물', '고객이 OUT 조건으로 언급했습니다.');
    addCondition(checkNeededConditions, '창밖 시야 / 맞은편 고층건물 여부', '사진, 스트리트뷰, 내견으로 확인해야 합니다.');
  }

  if (normalized.includes('24시간') && (normalized.includes('분리수거') || normalized.includes('쓰레기'))) {
    addCondition(preferredConditions, '24시간 쓰레기 배출 / 분리수거 가능', '설비나 관리규약 확인이 필요한 항목입니다.');
    addCondition(checkNeededConditions, '24시간 쓰레기 배출 가능 여부', '물건 정보에 없으면 관리회사 확인이 필요합니다.');
  }

  if (normalized.includes('벌레')) {
    addCondition(preferredConditions, '벌레 리스크가 낮은 건물', '고층, RC, 주변 음식점 여부, 쓰레기장 위치 등을 함께 봐야 합니다.');
    addCondition(checkNeededConditions, '벌레 발생 리스크', '완전 보장은 어렵고, 층수·주변 환경·건물 관리상태 확인이 필요합니다.');
  }

  if (normalized.includes('방음')) {
    addCondition(preferredConditions, '방음이 비교적 좋은 매물', 'RC/SRC, 선로·대로변 인접 여부, 벽 두께 등으로 추정합니다.');
    addCondition(checkNeededConditions, '방음 수준', '구조만으로 확정할 수 없어 내견 및 주변 환경 확인이 필요합니다.');
  }

  if (normalized.includes('따뜻')) {
    addCondition(preferredConditions, '겨울에 비교적 따뜻한 방', '향, 층수, 각방 여부, 단열, 창 상태를 함께 봐야 합니다.');
    addCondition(checkNeededConditions, '겨울철 단열/채광', '내견, 향, 창, 층수, 주변 건물 상태 확인이 필요합니다.');
  }

  if (normalized.includes('가스레인지') || normalized.includes('화구') || normalized.includes('コンロ')) {
    addCondition(preferredConditions, '가스레인지 기본 옵션 / 가능하면 2구', '설비란에 없으면 관리회사 확인이 필요합니다.');
    addCondition(checkNeededConditions, '가스레인지 기본 옵션 및 2구 여부', '도면·설비 정보·관리회사 확인이 필요합니다.');
  }

  if (normalized.includes('치안')) {
    addCondition(preferredConditions, '치안이 괜찮은 생활권', '지역 특성과 야간 동선 확인이 필요한 조건입니다.');
    addCondition(checkNeededConditions, '치안 및 야간 귀가 동선', '직원 경험, 지도, 역 주변 분위기 확인이 필요합니다.');
  }

  if (normalized.includes('편의점') || normalized.includes('마트') || normalized.includes('약국')) {
    addCondition(preferredConditions, '편의점 / 마트 / 약국 근처', '생활 편의시설 접근성을 선호 조건으로 분류합니다.');
    addCondition(checkNeededConditions, '주변 편의시설', '지도상 편의점, 슈퍼, 드럭스토어 위치 확인이 필요합니다.');
  }

  if (normalized.includes('많은 매물') || normalized.includes('최대한 많은')) {
    internalMemo.push('고객이 많은 후보를 원하므로, A추천뿐 아니라 B후보까지 함께 제안하는 방식이 적합합니다.');
  }

  if (visaStatus.includes('워킹') || visaStatus.includes('워홀') || visaStatus.includes('워킹홀리데이')) {
    internalMemo.push('워킹홀리데이 1년 체류이므로 외국인 계약 가능 여부, 단기 체류 심사 가능 여부, 보증회사 조건 확인이 필요합니다.');
    addCondition(
      checkNeededConditions,
      '외국인 계약 가능 여부 / 워홀 심사 가능 여부',
      '재류자격과 체류기간에 따라 보증회사 심사 조건이 달라질 수 있습니다.',
    );
  }

  const japaneseSearchKeywords: string[] = [];
  [...mustConditions, ...preferredConditions].forEach((condition) => {
    if (condition.label.includes('오토록')) addUnique(japaneseSearchKeywords, 'オートロック');
    if (condition.label.includes('택배')) addUnique(japaneseSearchKeywords, '宅配BOX');
    if (condition.label.includes('도시가스')) addUnique(japaneseSearchKeywords, '都市ガス');
    if (condition.label.includes('RC')) {
      addUnique(japaneseSearchKeywords, 'RC');
      addUnique(japaneseSearchKeywords, '鉄筋コンクリート');
    }
    if (condition.label.includes('24시간')) addUnique(japaneseSearchKeywords, '24時間ゴミ出し');
    if (condition.label.includes('가스레인지')) addUnique(japaneseSearchKeywords, 'ガスコンロ');
    if (condition.label.includes('편의점')) addUnique(japaneseSearchKeywords, 'スーパー');
  });

  return {
    customerName: customerName || '미입력',
    genderMemo,
    visaStatus,
    areaMemo,
    excludedAreas,
    preferredAreas,
    maxTotalRent,
    layouts,
    minFloor,
    minTatami,
    maxWalkMinutes,
    mustConditions,
    preferredConditions,
    ngConditions,
    checkNeededConditions,
    japaneseSearchKeywords,
    excludedJapaneseKeywords,
    internalMemo,
  };
}

function buildCustomerSummary(parsed: ParsedCustomerRequest) {
  const lines: string[] = [];

  lines.push(`${parsed.customerName} 고객님 조건을 아래와 같이 정리했습니다.`);
  lines.push('');
  lines.push('[필수 조건]');
  lines.push(...(parsed.mustConditions.length ? parsed.mustConditions.map((condition) => `- ${condition.label}`) : ['- 별도 필수 조건 확인 필요']));
  lines.push('');
  lines.push('[선호 조건]');
  lines.push(...(parsed.preferredConditions.length ? parsed.preferredConditions.map((condition) => `- ${condition.label}`) : ['- 별도 선호 조건 확인 필요']));
  lines.push('');
  lines.push('[제외 조건]');
  lines.push(...(parsed.ngConditions.length ? parsed.ngConditions.map((condition) => `- ${condition.label}`) : ['- 별도 제외 조건 확인 필요']));
  lines.push('');
  lines.push('[확인 필요]');
  lines.push(...(parsed.checkNeededConditions.length ? parsed.checkNeededConditions.map((condition) => `- ${condition.label}`) : ['- 별도 확인 필요 항목 없음']));
  lines.push('');
  lines.push('위 조건 기준으로 PDF 매물 리스트를 분석하고, 조건이 맞는 후보부터 우선 안내드리겠습니다.');

  return lines.join('\n');
}

function buildApiJson(parsed: ParsedCustomerRequest) {
  return JSON.stringify(
    {
      customer: {
        name: parsed.customerName,
        genderMemo: parsed.genderMemo,
        visaStatus: parsed.visaStatus,
      },
      search: {
        areaMemo: parsed.areaMemo,
        preferredAreas: parsed.preferredAreas,
        excludedAreas: parsed.excludedAreas,
        excludedJapaneseKeywords: parsed.excludedJapaneseKeywords,
        maxTotalRent: parsed.maxTotalRent,
        layouts: parsed.layouts,
        minFloor: parsed.minFloor,
        minTatami: parsed.minTatami,
        maxWalkMinutes: parsed.maxWalkMinutes,
        japaneseSearchKeywords: parsed.japaneseSearchKeywords,
      },
      conditions: {
        must: parsed.mustConditions.map((condition) => condition.label),
        preferred: parsed.preferredConditions.map((condition) => condition.label),
        ng: parsed.ngConditions.map((condition) => condition.label),
        checkNeeded: parsed.checkNeededConditions.map((condition) => condition.label),
      },
    },
    null,
    2,
  );
}

function buildRealnetMemo(parsed: ParsedCustomerRequest) {
  const lines: string[] = [];

  lines.push('RealnetPro PDF 출력 전 검색 조건 후보');
  lines.push('');
  lines.push(`고객명: ${parsed.customerName}`);
  lines.push(`재류자격: ${parsed.visaStatus}`);
  lines.push(`희망지역: ${parsed.preferredAreas.length ? parsed.preferredAreas.join(' / ') : parsed.areaMemo}`);

  if (parsed.maxTotalRent) {
    lines.push(`賃料+共益費 기준 희망 상한: ${parsed.maxTotalRent.toLocaleString()}円以下`);
    lines.push('주의: RealnetPro에서 賃料 조건만 넣으면 共益費 포함 총액 초과 매물이 섞일 수 있습니다.');
  }

  if (parsed.layouts.length) lines.push(`間取り: ${parsed.layouts.join(' / ')}`);
  if (parsed.minFloor) lines.push(`所在階: ${parsed.minFloor}階以上`);
  if (parsed.maxWalkMinutes) lines.push(`駅徒歩: ${parsed.maxWalkMinutes}分以内`);
  if (parsed.japaneseSearchKeywords.length) lines.push(`設備キーワード: ${parsed.japaneseSearchKeywords.join(', ')}`);
  if (parsed.excludedJapaneseKeywords.length) lines.push(`除外候補: ${parsed.excludedJapaneseKeywords.join(', ')}`);

  return lines.join('\n');
}

function loadPdfJs() {
  return new Promise<any>((resolve, reject) => {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      resolve(window.pdfjsLib);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-pdfjs="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js 로드에 실패했습니다.'));
        }
      });
      existingScript.addEventListener('error', () => reject(new Error('PDF.js 로드에 실패했습니다.')));
      return;
    }

    const script = document.createElement('script');
    script.src = PDFJS_SRC;
    script.async = true;
    script.dataset.pdfjs = 'true';

    script.onload = () => {
      if (!window.pdfjsLib) {
        reject(new Error('PDF.js를 사용할 수 없습니다.'));
        return;
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
      resolve(window.pdfjsLib);
    };

    script.onerror = () => {
      reject(new Error('PDF.js 파일을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.'));
    };

    document.body.appendChild(script);
  });
}



function loadTesseractJs() {
  return new Promise<any>((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-tesseract="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error('OCR 엔진 로드에 실패했습니다.'));
      });
      existingScript.addEventListener('error', () => reject(new Error('OCR 엔진 로드에 실패했습니다.')));
      return;
    }

    const script = document.createElement('script');
    script.src = TESSERACT_SRC;
    script.async = true;
    script.dataset.tesseract = 'true';

    script.onload = () => {
      if (!window.Tesseract) {
        reject(new Error('OCR 엔진을 사용할 수 없습니다.'));
        return;
      }
      resolve(window.Tesseract);
    };

    script.onerror = () => {
      reject(new Error('OCR 엔진을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.'));
    };

    document.body.appendChild(script);
  });
}

async function renderPdfPageToCanvas(page: any) {
  const viewport = page.getViewport({ scale: 2.35 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('PDF 페이지 렌더링용 캔버스를 만들 수 없습니다.');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

async function createOcrWorker(onStatus: (message: string) => void) {
  const Tesseract = await loadTesseractJs();
  const worker = await Tesseract.createWorker({
    logger: (message: any) => {
      if (message?.status) {
        const progress = typeof message.progress === 'number' ? ` ${Math.round(message.progress * 100)}%` : '';
        onStatus(`OCR 준비/분석 중: ${message.status}${progress}`);
      }
    },
  });

  await worker.loadLanguage('jpn+eng');
  await worker.initialize('jpn+eng');
  return worker;
}

async function recognizePageWithOcr(page: any, worker: any) {
  const canvas = await renderPdfPageToCanvas(page);
  const result = await worker.recognize(canvas);
  return String(result?.data?.text || '').trim();
}
function buildPageTextFromPdfItems(items: any[]) {
  const textItems = items
    .map((item: any) => {
      const text = String(item.str || '').trim();
      const transform = Array.isArray(item.transform) ? item.transform : [];

      return {
        text,
        x: Number(transform[4] || 0),
        y: Number(transform[5] || 0),
      };
    })
    .filter((item) => item.text);

  const lineGroups: Array<{ y: number; items: Array<{ text: string; x: number; y: number }> }> = [];
  const yTolerance = 3;

  textItems.forEach((item) => {
    const existingGroup = lineGroups.find((group) => Math.abs(group.y - item.y) <= yTolerance);

    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.y = (existingGroup.y + item.y) / 2;
    } else {
      lineGroups.push({ y: item.y, items: [item] });
    }
  });

  return lineGroups
    .sort((a, b) => b.y - a.y)
    .map((group) =>
      group.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*／\s*/g, ' ／ ')
        .replace(/「\s+/g, '「')
        .replace(/\s+」/g, '」')
        .replace(/徒歩\s+(\d+)\s+分/g, '徒歩$1分')
        .trim(),
    )
    .filter(Boolean)
    .join('\n');
}

async function extractTextFromPdfFile(
  file: File,
  onProgress: (page: number, total: number, status?: string) => void,
) {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  let ocrWorker: any = null;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress(pageNumber, pdf.numPages, 'PDF 텍스트 추출 중');
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      let pageText = buildPageTextFromPdfItems(textContent.items || []);

      if (pageText.trim().length < 30) {
        if (!ocrWorker) {
          onProgress(pageNumber, pdf.numPages, 'PDF가 이미지형이라 OCR 엔진을 준비 중');
          ocrWorker = await createOcrWorker((message) => {
            onProgress(pageNumber, pdf.numPages, message);
          });
        }

        onProgress(pageNumber, pdf.numPages, '이미지형 PDF OCR 분석 중');
        pageText = await recognizePageWithOcr(page, ocrWorker);
      }

      pages.push(pageText);
    }
  } finally {
    if (ocrWorker) {
      await ocrWorker.terminate();
    }
  }

  return pages.join('\n\n---PAGE---\n\n');
}

function cleanPdfLines(text: string) {
  return text
    .replace(/\r/g, '\n')
    .replace(/\u3000/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function isAddressTransitLine(line: string) {
  const compact = line.replace(/\s+/g, '');
  return compact.includes('／') && /[都道府県市区町村]/.test(compact) && /「.+?」徒歩\d+分/.test(compact);
}

function preparePdfLinesForParsing(text: string) {
  const rawLines = cleanPdfLines(text);
  const mergedLines: string[] = [];

  for (let index = 0; index < rawLines.length; index += 1) {
    let combined = rawLines[index];
    let consumed = 0;

    for (let offset = 1; offset <= 5 && index + offset < rawLines.length; offset += 1) {
      const candidate = `${combined} ${rawLines[index + offset]}`.replace(/\s+/g, ' ').trim();

      if (isAddressTransitLine(candidate)) {
        combined = candidate;
        consumed = offset;
        break;
      }

      const compactCandidate = candidate.replace(/\s+/g, '');
      const mayBeSplitAddress =
        compactCandidate.includes('／') ||
        (/[都道府県市区町村]/.test(compactCandidate) && /丁目|番|号|-/.test(compactCandidate));
      const mayBeTransitTail =
        compactCandidate.includes('「') || compactCandidate.includes('徒歩') || /\d+分/.test(compactCandidate);

      if (mayBeSplitAddress && mayBeTransitTail) {
        combined = candidate;
        consumed = offset;
      }
    }

    mergedLines.push(combined);
    index += consumed;
  }

  return mergedLines;
}

function isMetadataLine(line: string) {
  return (
    line.includes('リアプロ') ||
    line.includes('realnetpro') ||
    line.includes('現在') ||
    line.includes('頁') ||
    line.includes('株式会社') ||
    line.includes('TEL') ||
    line.includes('FAX') ||
    line.includes('大阪府') ||
    line.includes('兵庫県') ||
    line.includes('京都府') ||
    line.includes('号室名') ||
    line.includes('状態・入居時期') ||
    line.includes('本体設備')
  );
}

function extractRoomNumber(line: string) {
  return line.trim().match(/^([A-Za-z]?\d{3,5}[A-Za-z]?)(?:\s|$|（)/)?.[1] || '';
}

function isRoomNumber(line: string) {
  return Boolean(extractRoomNumber(line));
}

function looksLikeRoomStart(lines: string[], index: number) {
  if (!extractRoomNumber(lines[index])) return false;
  const nextText = lines.slice(index, index + 18).join(' ');
  return /（\d+階部分）/.test(nextText) && /円/.test(nextText) && /(㎡|1K|1R|1DK|1LDK|ワンルーム)/.test(nextText);
}

function findBuildingName(lines: string[], addressLineIndex: number) {
  for (let index = addressLineIndex - 1; index >= Math.max(0, addressLineIndex - 10); index -= 1) {
    const line = lines[index];
    if (!line || isMetadataLine(line)) continue;
    if (/^\d+$/.test(line)) continue;
    if (line.includes('／')) continue;
    return line;
  }

  return '매물명 확인 필요';
}

function parseAddressAndTransit(line: string) {
  const normalizedLine = line.replace(/\s+/g, ' ').trim();
  const [addressPart, transitPart = ''] = normalizedLine.split('／').map((part) => part.trim());
  const compactTransit = transitPart.replace(/\s+/g, '');
  const stationMatch = compactTransit.match(/(.+?)「(.+?)」徒歩(\d+)分/);

  return {
    address: addressPart || '',
    lineName: stationMatch?.[1]?.trim() || '',
    nearestStation: stationMatch?.[2]?.trim() || '',
    walkMinutes: stationMatch?.[3] ? Number(stationMatch[3]) : null,
  };
}

function parseStructureAndBuiltYear(lines: string[]) {
  const joined = lines.join(' ');
  const totalFloorsMatch = joined.match(/地上(\d+)階/);
  const builtYearMatch = joined.match(/(\d{4}年\d{1,2}月築|\d{4}年築)/);

  let structure = '';

  if (joined.includes('鉄骨鉄筋コンクリート造')) {
    structure = '鉄骨鉄筋コンクリート造';
  } else if (joined.includes('鉄筋コンクリート造')) {
    structure = '鉄筋コンクリート造';
  } else if (joined.includes('木造')) {
    structure = '木造';
  } else if (joined.includes('鉄骨造')) {
    structure = '鉄骨造';
  }

  return {
    structure,
    builtYear: builtYearMatch?.[1] || '',
    totalFloors: totalFloorsMatch?.[1] ? Number(totalFloorsMatch[1]) : null,
  };
}

function parseBuildingEquipment(lines: string[]) {
  const equipmentLineIndex = lines.findIndex((line) => line.startsWith('本体設備'));
  if (equipmentLineIndex === -1) return '';

  const equipmentLines = [lines[equipmentLineIndex]];

  for (let index = equipmentLineIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes('号室名') || isRoomNumber(line)) break;
    equipmentLines.push(line);
  }

  return equipmentLines.join(' ');
}

function normalizeLayout(layout: string) {
  if (layout.includes('ワンルーム')) return '1R';
  return layout;
}

function parseFacing(text: string) {
  const facingMatch = text.match(/●(北向|南向|東向|西向|東南向|南東向|南西向|西南向|西北向|北西向|東北向|北東向)/);
  return facingMatch?.[1] || '';
}

function parseYesNoByKeyword(text: string, yesKeywords: string[], noKeywords: string[] = []): YesNoUnknown {
  if (noKeywords.some((keyword) => text.includes(keyword))) return 'no';
  if (yesKeywords.some((keyword) => text.includes(keyword))) return 'yes';
  return 'unknown';
}

function parseRoomChunk(
  chunkLines: string[],
  base: {
    buildingName: string;
    address: string;
    lineName: string;
    nearestStation: string;
    walkMinutes: number | null;
    structure: string;
    builtYear: string;
    totalFloors: number | null;
    buildingEquipment: string;
  },
) {
  const chunkText = chunkLines.join(' ');
  const roomNo = extractRoomNumber(chunkLines[0] || '') || chunkLines[0] || '';
  const floorMatch = chunkText.match(/（(\d+)階部分）/);
  const layoutMatch = chunkText.match(/(ワンルーム|1R|1K|1DK|1LDK|2K|2DK|2LDK|3K|3DK|3LDK)/);
  const areaMatch = chunkText.match(/(\d+(?:\.\d+)?)㎡/);
  const moneyMatches = Array.from(chunkText.matchAll(/(\d{1,3}(?:,\d{3})*)円/g)).map((match) => match[1]);
  const statusMatch = chunkText.match(/(空室|退去予定|申込中|商談中)/);
  const moveInMatch = chunkText.match(/(即入|相談|\d{2}月(?:上旬|中旬|下旬|\d{1,2}日)?|\d{4}年\d{2}月(?:上旬|中旬|下旬|\d{1,2}日)?)/);
  const combinedEquipment = `${base.buildingEquipment} ${chunkText}`;
  const gasType = combinedEquipment.includes('都市ガス')
    ? '都市ガス'
    : combinedEquipment.includes('プロパン')
      ? 'プロパンガス'
      : combinedEquipment.includes('ガス')
        ? 'ガス種別確認'
        : '';

  const stoveIncluded = parseYesNoByKeyword(combinedEquipment, [
    'ガスコンロ',
    'ＩＨクッキングヒーター',
    'IHクッキングヒーター',
    'システムキッチン',
  ]);

  const stoveBurners =
    combinedEquipment.includes('２口') || combinedEquipment.includes('2口')
      ? '2口'
      : combinedEquipment.includes('１口') || combinedEquipment.includes('1口')
        ? '1口'
        : '확인 필요';

  return {
    id: `${base.buildingName}-${roomNo}-${Math.random().toString(36).slice(2, 9)}`,
    buildingName: base.buildingName,
    roomNo,
    address: base.address,
    lineName: base.lineName,
    nearestStation: base.nearestStation,
    walkMinutes: base.walkMinutes,
    structure: base.structure,
    builtYear: base.builtYear,
    totalFloors: base.totalFloors,
    buildingEquipment: base.buildingEquipment,
    status: statusMatch?.[1] || '확인 필요',
    moveIn: moveInMatch?.[1] || '확인 필요',
    layout: normalizeLayout(layoutMatch?.[1] || ''),
    areaSqm: areaMatch?.[1] ? Number(areaMatch[1]) : null,
    rent: parseMoneyValue(moneyMatches[0]),
    managementFee: parseMoneyValue(moneyMatches[1]) ?? 0,
    floor: floorMatch?.[1] ? Number(floorMatch[1]) : null,
    facing: parseFacing(chunkText),
    gasType,
    autoLock: parseYesNoByKeyword(base.buildingEquipment, ['オートロック']),
    deliveryBox: parseYesNoByKeyword(base.buildingEquipment, ['宅配ＢＯＸ', '宅配BOX', '宅配ボックス']),
    trashAnytime: parseYesNoByKeyword(combinedEquipment, ['24時間ゴミ', '24時間ごみ', '24時間ゴミ出し', '24時間ごみ出し']),
    stoveIncluded,
    stoveBurners,
    foreignContract: parseYesNoByKeyword(chunkText, ['外国人契約可能', '外国籍契約可能', '外国人可']),
    guarantorNotRequired: parseYesNoByKeyword(chunkText, ['保証人不要']),
    memo: chunkText.slice(0, 900),
    rawText: [base.buildingName, base.address, base.buildingEquipment, ...chunkLines].join('\n'),
  };
}

function parseRealnetPdfText(text: string) {
  const lines = preparePdfLinesForParsing(text);
  const addressLineIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isAddressTransitLine(line))
    .map(({ index }) => index);

  const properties: CandidateProperty[] = [];

  addressLineIndexes.forEach((addressLineIndex, segmentIndex) => {
    const nextAddressIndex = addressLineIndexes[segmentIndex + 1] ?? lines.length;
    const segment = lines.slice(addressLineIndex, nextAddressIndex);
    const headerTail = lines.slice(addressLineIndex, Math.min(addressLineIndex + 10, nextAddressIndex));
    const buildingName = findBuildingName(lines, addressLineIndex);
    const transit = parseAddressAndTransit(lines[addressLineIndex]);
    const structureMeta = parseStructureAndBuiltYear(headerTail);
    const buildingEquipment = parseBuildingEquipment(segment);

    const base = {
      buildingName,
      address: transit.address,
      lineName: transit.lineName,
      nearestStation: transit.nearestStation,
      walkMinutes: transit.walkMinutes,
      structure: structureMeta.structure,
      builtYear: structureMeta.builtYear,
      totalFloors: structureMeta.totalFloors,
      buildingEquipment,
    };

    const roomStarts = segment
      .map((line, index) => ({ line, index }))
      .filter((_, index) => looksLikeRoomStart(segment, index))
      .map(({ index }) => index);

    roomStarts.forEach((roomStartIndex, roomIndex) => {
      const nextRoomStartIndex = roomStarts[roomIndex + 1] ?? segment.length;
      const chunkLines = segment.slice(roomStartIndex, nextRoomStartIndex);
      const property = parseRoomChunk(chunkLines, base);

      if (property.rent || property.layout || property.areaSqm) {
        properties.push(property);
      }
    });
  });

  const unique = new Map<string, CandidateProperty>();

  properties.forEach((property) => {
    const key = [
      property.buildingName,
      property.roomNo,
      property.address,
      property.rent,
      property.managementFee,
    ].join('|');

    if (!unique.has(key)) unique.set(key, property);
  });

  return Array.from(unique.values());
}

function customerHasCondition(parsed: ParsedCustomerRequest, keyword: string) {
  const allLabels = [
    ...parsed.mustConditions,
    ...parsed.preferredConditions,
    ...parsed.ngConditions,
    ...parsed.checkNeededConditions,
  ].map((condition) => condition.label);

  return allLabels.some((label) => label.includes(keyword));
}

function analyzePropertyMatch(parsed: ParsedCustomerRequest, property: CandidateProperty): MatchResult {
  const hardFailReasons: string[] = [];
  const strengths: string[] = [];
  const cautions: string[] = [];
  const checkNeeded: string[] = [];
  let score = 0;

  const totalCost =
    property.rent !== null && property.managementFee !== null
      ? property.rent + property.managementFee
      : null;

  const locationText = [
    property.buildingName,
    property.address,
    property.lineName,
    property.nearestStation,
    property.memo,
  ].join(' ');

  if (parsed.excludedJapaneseKeywords.some((keyword) => locationText.includes(keyword))) {
    hardFailReasons.push('고객이 제외한 지역/역 키워드에 해당할 가능성이 있습니다.');
  }

  if (parsed.maxTotalRent) {
    if (totalCost === null) {
      checkNeeded.push('월세+관리비 총액 확인이 필요합니다.');
    } else if (totalCost > parsed.maxTotalRent) {
      hardFailReasons.push(`월세+관리비 총액 ${totalCost.toLocaleString()}엔으로 상한 ${parsed.maxTotalRent.toLocaleString()}엔을 초과합니다.`);
    } else {
      score += 16;
      strengths.push(`월세+관리비 총액 ${totalCost.toLocaleString()}엔으로 예산 안에 들어옵니다.`);
    }
  }

  if (parsed.layouts.length > 0) {
    if (!property.layout) {
      checkNeeded.push('간取り 확인이 필요합니다.');
    } else if (!parsed.layouts.includes(property.layout)) {
      hardFailReasons.push(`희망 타입(${parsed.layouts.join(' / ')})과 다릅니다. 현재 ${property.layout || '확인 필요'}입니다.`);
    } else {
      score += 9;
      strengths.push(`${property.layout} 타입으로 희망 조건에 맞습니다.`);
    }
  }

  if (parsed.minFloor) {
    if (property.floor === null) {
      checkNeeded.push('층수 확인이 필요합니다.');
    } else if (property.floor < parsed.minFloor) {
      hardFailReasons.push(`${property.floor}층으로 ${parsed.minFloor}층 이상 조건에 맞지 않습니다.`);
    } else {
      score += 9;
      strengths.push(`${property.floor}층으로 희망 층수 조건을 충족합니다.`);
    }
  }

  if (parsed.minTatami) {
    if ((property.areaSqm && property.areaSqm >= 20) || property.memo.includes(`${parsed.minTatami}`)) {
      score += 4;
      strengths.push('방 크기가 고객 희망 조건에 가까울 가능성이 있습니다.');
    } else {
      cautions.push('방 조수/크기는 도면 또는 상세자료 확인이 필요합니다.');
    }
  }

  if (parsed.maxWalkMinutes) {
    if (property.walkMinutes === null) {
      checkNeeded.push('역 도보 분수 확인이 필요합니다.');
    } else if (property.walkMinutes > parsed.maxWalkMinutes) {
      hardFailReasons.push(`역 도보 ${property.walkMinutes}분으로 희망 조건을 초과합니다.`);
    } else {
      score += 9;
      strengths.push(`역 도보 ${property.walkMinutes}분으로 접근성이 좋습니다.`);
    }
  }

  if (customerHasCondition(parsed, 'RC') || customerHasCondition(parsed, '철근콘크리트')) {
    const structureText = property.structure;
    const isRc =
      structureText.includes('鉄筋コンクリート') ||
      structureText.includes('鉄骨鉄筋コンクリート') ||
      structureText.toUpperCase().includes('RC') ||
      structureText.toUpperCase().includes('SRC');

    if (structureText.includes('木造')) {
      hardFailReasons.push('목조 매물로 철근콘크리트 희망 조건에 맞지 않습니다.');
    } else if (isRc) {
      score += 11;
      strengths.push('철근콘크리트 계열 구조로 방음·단열 면에서 비교적 유리합니다.');
    } else {
      checkNeeded.push('건물 구조가 RC/SRC인지 확인이 필요합니다.');
    }
  }

  if (customerHasCondition(parsed, '오토록')) {
    if (property.autoLock === 'yes') {
      score += 8;
      strengths.push('오토록 조건을 충족합니다.');
    } else {
      checkNeeded.push('오토록 유무 확인이 필요합니다.');
    }
  }

  if (customerHasCondition(parsed, '택배') || customerHasCondition(parsed, '宅配')) {
    if (property.deliveryBox === 'yes') {
      score += 8;
      strengths.push('무인택배함/宅配BOX 조건을 충족합니다.');
    } else {
      checkNeeded.push('무인택배함/宅配BOX 유무 확인이 필요합니다.');
    }
  }

  if (customerHasCondition(parsed, '도시가스')) {
    if (property.gasType.includes('都市ガス')) {
      score += 8;
      strengths.push('도시가스 조건을 충족합니다.');
    } else if (property.gasType.includes('プロパン')) {
      hardFailReasons.push('프로판가스 매물입니다.');
    } else {
      checkNeeded.push('도시가스 여부 확인이 필요합니다.');
    }
  }

  if (customerHasCondition(parsed, '프로판') && property.gasType.includes('プロパン')) {
    hardFailReasons.push('프로판가스 제외 조건에 해당합니다.');
  }

  if (customerHasCondition(parsed, '북향')) {
    if (property.facing.includes('北')) {
      hardFailReasons.push(`방향이 ${property.facing}으로 북향 제외 조건에 걸립니다.`);
    } else if (property.facing) {
      score += 7;
      strengths.push(`${property.facing}으로 북향 제외 조건에 걸리지 않습니다.`);
    } else {
      checkNeeded.push('방향 확인이 필요합니다.');
    }
  }

  if (property.foreignContract === 'yes') {
    score += 7;
    strengths.push('外国人契約可能으로 표기되어 있습니다.');
  } else {
    checkNeeded.push('외국인 계약 가능 여부 확인이 필요합니다.');
  }

  if (property.guarantorNotRequired === 'yes') {
    score += 3;
    strengths.push('保証人不要로 표기되어 있습니다.');
  }

  if (customerHasCondition(parsed, '24시간')) {
    if (property.trashAnytime === 'yes') {
      score += 5;
      strengths.push('24시간 쓰레기 배출 가능 조건에 맞을 가능성이 있습니다.');
    } else if (property.buildingEquipment.includes('専用ごみ置場')) {
      checkNeeded.push('전용 쓰레기장은 있으나 24시간 배출 가능 여부는 확인이 필요합니다.');
    } else {
      checkNeeded.push('24시간 쓰레기 배출 가능 여부 확인이 필요합니다.');
    }
  }

  if (customerHasCondition(parsed, '가스레인지') || customerHasCondition(parsed, '2구')) {
    if (property.stoveIncluded === 'yes' && property.stoveBurners === '2口') {
      score += 5;
      strengths.push('2구 레인지/콘로 조건에 가깝습니다.');
    } else if (property.stoveIncluded === 'yes') {
      cautions.push('레인지 설비는 있으나 2구 여부는 확인이 필요합니다.');
    } else {
      checkNeeded.push('가스레인지 기본 옵션 여부 확인이 필요합니다.');
    }
  }

  if (customerHasCondition(parsed, '선로')) checkNeeded.push('전철 선로 인접 여부는 지도 확인이 필요합니다.');
  if (customerHasCondition(parsed, '시야')) checkNeeded.push('창밖 시야 차단 여부는 사진/스트리트뷰/내견 확인이 필요합니다.');
  if (customerHasCondition(parsed, '벌레')) checkNeeded.push('벌레 리스크는 주변 음식점, 쓰레기장 위치, 건물 관리상태 확인이 필요합니다.');
  if (customerHasCondition(parsed, '방음')) checkNeeded.push('방음은 구조와 주변 환경으로 추정만 가능하며 내견 확인이 필요합니다.');
  if (customerHasCondition(parsed, '따뜻')) checkNeeded.push('겨울철 단열/채광은 향, 창, 층수, 내견으로 확인이 필요합니다.');
  if (customerHasCondition(parsed, '편의점')) checkNeeded.push('편의점/마트/약국 접근성은 지도 확인이 필요합니다.');

  let rank: MatchRank = 'C확인필요';

  if (hardFailReasons.length > 0) {
    rank = '탈락';
  } else if (score >= 78) {
    rank = 'A추천';
  } else if (score >= 58) {
    rank = 'B후보';
  } else {
    rank = 'C확인필요';
  }

  return {
    property,
    totalCost,
    score,
    rank,
    hardFailReasons,
    strengths,
    cautions,
    checkNeeded,
  };
}

function sortResults(results: MatchResult[]) {
  const rankWeight: Record<MatchRank, number> = {
    A추천: 4,
    B후보: 3,
    C확인필요: 2,
    탈락: 1,
  };

  return [...results].sort((a, b) => {
    const rankDiff = rankWeight[b.rank] - rankWeight[a.rank];
    if (rankDiff !== 0) return rankDiff;
    return b.score - a.score;
  });
}

function buildRecommendationMessage(parsed: ParsedCustomerRequest, results: MatchResult[]) {
  const candidates = sortResults(results)
    .filter((result) => result.rank !== '탈락')
    .slice(0, 12);

  const lines: string[] = [];

  lines.push(`${parsed.customerName} 고객님 조건 기준으로 PDF 매물 리스트를 분석했습니다.`);
  lines.push('');

  if (candidates.length === 0) {
    lines.push('현재 PDF 안에서 바로 추천 가능한 매물은 확인되지 않았습니다.');
    lines.push('예산, 층수, 구조, 방향, 설비 조건 중 일부가 강하게 걸린 것으로 보입니다.');
    return lines.join('\n');
  }

  lines.push(`우선 제안 가능한 후보 ${candidates.length}건을 추천도 순으로 정리했습니다.`);
  lines.push('');

  candidates.forEach((result, index) => {
    const property = result.property;
    lines.push(`${index + 1}. ${property.buildingName} ${property.roomNo}호`);
    lines.push(`- 추천도: ${result.rank} / ${result.score}점`);
    lines.push(`- 월세+관리비: ${result.totalCost ? `${result.totalCost.toLocaleString()}엔` : '확인 필요'}`);
    lines.push(`- 위치: ${property.address}`);
    lines.push(`- 역: ${property.lineName} ${property.nearestStation} 도보 ${property.walkMinutes ?? '?'}분`);
    lines.push(`- 타입/면적/층수: ${property.layout || '확인 필요'} / ${property.areaSqm ?? '?'}㎡ / ${property.floor ?? '?'}층`);
    lines.push(`- 구조/방향: ${property.structure || '확인 필요'} / ${property.facing || '확인 필요'}`);

    if (result.strengths.length > 0) {
      lines.push(`- 장점: ${result.strengths.slice(0, 4).join(' / ')}`);
    }

    if (result.checkNeeded.length > 0) {
      lines.push(`- 확인 필요: ${result.checkNeeded.slice(0, 3).join(' / ')}`);
    }

    lines.push('');
  });

  lines.push('※ 신청 전에는 공실 여부, 워킹홀리데이 심사 가능 여부, 초기비용, 보증회사 조건, 24시간 쓰레기 배출 가능 여부를 관리회사에 다시 확인해야 합니다.');

  return lines.join('\n');
}

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function buildResultsCsv(results: MatchResult[]) {
  const header = [
    '추천도',
    '점수',
    '매물명',
    '호실',
    '총액',
    '월세',
    '관리비',
    '주소',
    '노선',
    '역',
    '도보',
    '타입',
    '면적',
    '층수',
    '구조',
    '향',
    '가스',
    '오토록',
    '택배BOX',
    '외국인',
    '탈락사유',
    '장점',
    '확인필요',
  ];

  const rows = sortResults(results).map((result) => [
    result.rank,
    result.score,
    result.property.buildingName,
    result.property.roomNo,
    result.totalCost,
    result.property.rent,
    result.property.managementFee,
    result.property.address,
    result.property.lineName,
    result.property.nearestStation,
    result.property.walkMinutes,
    result.property.layout,
    result.property.areaSqm,
    result.property.floor,
    result.property.structure,
    result.property.facing,
    result.property.gasType,
    result.property.autoLock,
    result.property.deliveryBox,
    result.property.foreignContract,
    result.hardFailReasons.join(' / '),
    result.strengths.join(' / '),
    result.checkNeeded.join(' / '),
  ]);

  return [header, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
}

export default function PropertyAiSearch() {
  const [rawInquiry, setRawInquiry] = useState(sampleInquiry);
  const [copiedLabel, setCopiedLabel] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfStatus, setPdfStatus] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [extractedTextPreview, setExtractedTextPreview] = useState('');
  const [pdfResults, setPdfResults] = useState<MatchResult[]>([]);

  const parsed = useMemo(() => parseCustomerRequest(rawInquiry), [rawInquiry]);
  const customerSummary = useMemo(() => buildCustomerSummary(parsed), [parsed]);
  const apiJson = useMemo(() => buildApiJson(parsed), [parsed]);
  const realnetMemo = useMemo(() => buildRealnetMemo(parsed), [parsed]);
  const sortedPdfResults = useMemo(() => sortResults(pdfResults), [pdfResults]);
  const recommendationMessage = useMemo(
    () => buildRecommendationMessage(parsed, pdfResults),
    [parsed, pdfResults],
  );

  const resultCounts = useMemo(() => {
    return {
      a: pdfResults.filter((result) => result.rank === 'A추천').length,
      b: pdfResults.filter((result) => result.rank === 'B후보').length,
      c: pdfResults.filter((result) => result.rank === 'C확인필요').length,
      fail: pdfResults.filter((result) => result.rank === '탈락').length,
    };
  }, [pdfResults]);

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(''), 1800);
    } catch {
      alert('복사에 실패했습니다. 직접 드래그해서 복사해주세요.');
    }
  };

  const handlePdfFile = async (file: File | undefined) => {
    if (!file) return;

    setPdfFileName(file.name);
    setPdfError('');
    setPdfResults([]);
    setExtractedTextPreview('');
    setIsAnalyzingPdf(true);
    setPdfStatus('PDF 분석 준비 중입니다...');

    try {
      const extractedText = await extractTextFromPdfFile(file, (page, total, status) => {
        setPdfStatus(`${status || 'PDF 분석 중'}... ${page}/${total}페이지`);
      });

      setExtractedTextPreview(extractedText.slice(0, 2500));

      const properties = parseRealnetPdfText(extractedText);
      const results = properties.map((property) => analyzePropertyMatch(parsed, property));

      setPdfResults(results);
      setPdfStatus(`분석 완료: ${properties.length}개 호실을 추출했습니다.`);
    } catch (error: any) {
      console.error(error);
      setPdfError(error?.message || 'PDF 분석 중 오류가 발생했습니다.');
      setPdfStatus('');
    } finally {
      setIsAnalyzingPdf(false);
    }
  };

  const downloadCsv = () => {
    const csv = buildResultsCsv(sortedPdfResults);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${parsed.customerName || '고객'}_PDF매물분석.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <section style={styles.wrapper}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Osaka J Internal AI Tool</p>
          <h1 style={styles.title}>AI 매물 검색 어시스턴트</h1>
          <p style={styles.description}>
            고객 문의 내용을 검색 조건으로 정리하고, RealnetPro PDF 리스트를 업로드해
            고객 조건에 가까운 매물을 자동 선별합니다.
          </p>
        </div>

        <div style={styles.statusBox}>
          <span style={styles.statusDot} />
          <div>
            <strong>PDF 분석 모드</strong>
            <p>RealnetPro에서 공식 출력한 PDF를 업로드하면 텍스트 추출을 먼저 시도하고, 이미지형 PDF는 OCR로 분석합니다.</p>
          </div>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>1. 고객 문의 내용</h2>
            <p style={styles.panelSubText}>
              고객이 보낸 카톡, LINE, 이메일 내용을 그대로 붙여넣으세요.
            </p>
          </div>

          <textarea
            style={styles.inputTextarea}
            value={rawInquiry}
            onChange={(event) => setRawInquiry(event.target.value)}
            placeholder="고객 문의 내용을 여기에 붙여넣으세요."
          />

          <div style={styles.buttonRow}>
            <button type="button" style={styles.secondaryButton} onClick={() => setRawInquiry(sampleInquiry)}>
              샘플 불러오기
            </button>
            <button type="button" style={styles.dangerButton} onClick={() => setRawInquiry('')}>
              비우기
            </button>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>2. 기본 정보 자동 추출</h2>
            <p style={styles.panelSubText}>
              고객명, 재류자격, 예산, 지역, 층수 등을 자동으로 정리합니다.
            </p>
          </div>

          <div style={styles.infoGrid}>
            <InfoItem label="고객명" value={parsed.customerName} />
            <InfoItem label="성별/메모" value={parsed.genderMemo} />
            <InfoItem label="재류자격" value={parsed.visaStatus} />
            <InfoItem label="지역 메모" value={parsed.areaMemo} />
            <InfoItem label="월세+관리비 상한" value={parsed.maxTotalRent ? `${parsed.maxTotalRent.toLocaleString()}엔` : '미확인'} />
            <InfoItem label="희망 타입" value={parsed.layouts.length > 0 ? parsed.layouts.join(' / ') : '미확인'} />
            <InfoItem label="최소 층수" value={parsed.minFloor ? `${parsed.minFloor}층 이상` : '미확인'} />
            <InfoItem label="역 도보" value={parsed.maxWalkMinutes ? `${parsed.maxWalkMinutes}분 이내` : '미확인'} />
          </div>
        </div>
      </section>

      <section style={styles.conditionGrid}>
        <ConditionPanel title="필수 조건" tone="must" conditions={parsed.mustConditions} />
        <ConditionPanel title="선호 조건" tone="preferred" conditions={parsed.preferredConditions} />
        <ConditionPanel title="NG 조건" tone="ng" conditions={parsed.ngConditions} />
        <ConditionPanel title="확인 필요" tone="check" conditions={parsed.checkNeededConditions} />
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeaderRow}>
          <div>
            <h2 style={styles.panelTitle}>3. RealnetPro PDF 업로드 및 자동 선별</h2>
            <p style={styles.panelSubText}>
              RealnetPro에서 조건 검색 후 「検索結果 PDF出力」로 받은 PDF를 업로드하세요.
              PDF 안의 매물을 고객 조건과 비교해 추천도를 계산합니다.
            </p>
          </div>

          {pdfResults.length > 0 && (
            <div style={styles.buttonRowNoMargin}>
              <button type="button" style={styles.secondaryButton} onClick={downloadCsv}>
                CSV 저장
              </button>
              <button type="button" style={styles.primaryButton} onClick={() => copyText('recommendation', recommendationMessage)}>
                {copiedLabel === 'recommendation' ? '복사 완료' : '추천문 복사'}
              </button>
            </div>
          )}
        </div>

        <div style={styles.uploadBox}>
          <input
            id="realnet-pdf-input"
            type="file"
            accept="application/pdf,.pdf"
            style={styles.hiddenInput}
            onChange={(event) => handlePdfFile(event.target.files?.[0])}
          />

          <button
            type="button"
            style={isAnalyzingPdf ? styles.uploadButtonDisabled : styles.uploadButton}
            disabled={isAnalyzingPdf}
            onClick={() => document.getElementById('realnet-pdf-input')?.click()}
          >
            {isAnalyzingPdf ? 'PDF 분석 중...' : 'PDF 선택 및 분석'}
          </button>

          <div>
            <strong>{pdfFileName || '선택된 PDF 없음'}</strong>
            <p style={styles.panelSubText}>
              {pdfStatus || '예: 外国人 + 70,000〜75,000円 조건으로 출력한 PDF'}
            </p>
            {pdfError && <p style={styles.errorText}>{pdfError}</p>}
          </div>
        </div>

        {pdfResults.length > 0 && (
          <>
            <div style={styles.resultSummaryGrid}>
              <SummaryCard label="전체 추출" value={pdfResults.length} />
              <SummaryCard label="A추천" value={resultCounts.a} />
              <SummaryCard label="B후보" value={resultCounts.b} />
              <SummaryCard label="확인필요" value={resultCounts.c} />
              <SummaryCard label="탈락" value={resultCounts.fail} />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>추천도</th>
                    <th style={styles.th}>매물</th>
                    <th style={styles.th}>총액</th>
                    <th style={styles.th}>역</th>
                    <th style={styles.th}>타입</th>
                    <th style={styles.th}>층/향</th>
                    <th style={styles.th}>장점</th>
                    <th style={styles.th}>확인/탈락 사유</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPdfResults.slice(0, 160).map((result) => (
                    <tr key={result.property.id}>
                      <td style={styles.td}>
                        <span style={{ ...styles.rankBadge, ...getRankStyle(result.rank) }}>
                          {result.rank}
                          <br />
                          {result.score}점
                        </span>
                      </td>
                      <td style={styles.td}>
                        <strong>{result.property.buildingName}</strong>
                        <p style={styles.smallText}>{result.property.roomNo}호 · {result.property.address}</p>
                      </td>
                      <td style={styles.td}>
                        <strong>{result.totalCost ? `${result.totalCost.toLocaleString()}엔` : '확인'}</strong>
                        <p style={styles.smallText}>
                          {result.property.rent?.toLocaleString() ?? '?'} + {result.property.managementFee?.toLocaleString() ?? '?'}
                        </p>
                      </td>
                      <td style={styles.td}>
                        {result.property.nearestStation || '확인'}
                        <p style={styles.smallText}>{result.property.lineName} · 도보 {result.property.walkMinutes ?? '?'}분</p>
                      </td>
                      <td style={styles.td}>
                        {result.property.layout || '확인'}
                        <p style={styles.smallText}>{result.property.areaSqm ?? '?'}㎡ · {result.property.structure || '구조 확인'}</p>
                      </td>
                      <td style={styles.td}>
                        {result.property.floor ?? '?'}층
                        <p style={styles.smallText}>{result.property.facing || '향 확인'}</p>
                      </td>
                      <td style={styles.td}>
                        <ul style={styles.compactList}>
                          {result.strengths.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </td>
                      <td style={styles.td}>
                        <ul style={styles.compactList}>
                          {[...result.hardFailReasons, ...result.checkNeeded, ...result.cautions].slice(0, 4).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.panelSubBox}>
              <div style={styles.panelHeaderRow}>
                <div>
                  <h3 style={styles.subTitle}>고객 발송용 추천문</h3>
                  <p style={styles.panelSubText}>A추천/B후보/C확인필요 중 상위 후보를 기준으로 자동 생성됩니다.</p>
                </div>
                <button type="button" style={styles.secondaryButton} onClick={() => copyText('recommendation2', recommendationMessage)}>
                  {copiedLabel === 'recommendation2' ? '복사 완료' : '복사'}
                </button>
              </div>
              <textarea style={styles.outputTextarea} value={recommendationMessage} readOnly />
            </div>
          </>
        )}

        {extractedTextPreview && (
          <details style={styles.detailsBox}>
            <summary>추출된 PDF 텍스트 일부 보기</summary>
            <pre style={styles.previewBox}>{extractedTextPreview}</pre>
          </details>
        )}
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>4. RealnetPro 검색 조건 후보</h2>
              <p style={styles.panelSubText}>PDF 출력 전 RealnetPro에서 입력하면 좋은 조건 후보입니다.</p>
            </div>
            <button type="button" style={styles.secondaryButton} onClick={() => copyText('realnet', realnetMemo)}>
              {copiedLabel === 'realnet' ? '복사 완료' : '조건 복사'}
            </button>
          </div>
          <textarea style={styles.outputTextareaSmall} value={realnetMemo} readOnly />
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>5. API 연결용 JSON</h2>
              <p style={styles.panelSubText}>추후 RealnetPro 공식 API/데이터 연계에 사용할 구조입니다.</p>
            </div>
            <button type="button" style={styles.secondaryButton} onClick={() => copyText('json', apiJson)}>
              {copiedLabel === 'json' ? '복사 완료' : 'JSON 복사'}
            </button>
          </div>
          <pre style={styles.codeBox}>{apiJson}</pre>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>6. 고객 조건 안내문 초안</h2>
              <p style={styles.panelSubText}>PDF 분석 전, 고객 조건 확인용으로 보낼 수 있는 문구입니다.</p>
            </div>
            <button type="button" style={styles.primaryButton} onClick={() => copyText('summary', customerSummary)}>
              {copiedLabel === 'summary' ? '복사 완료' : '안내문 복사'}
            </button>
          </div>
          <textarea style={styles.outputTextarea} value={customerSummary} readOnly />
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>7. 내부 메모</h2>
            <p style={styles.panelSubText}>상담원이 주의해야 할 내용입니다.</p>
          </div>

          {parsed.internalMemo.length > 0 ? (
            <ul style={styles.memoList}>
              {parsed.internalMemo.map((memo) => (
                <li key={memo}>{memo}</li>
              ))}
            </ul>
          ) : (
            <p style={styles.emptyText}>현재 특별 메모가 없습니다.</p>
          )}

          <div style={styles.warningBox}>
            <strong>중요</strong>
            <p>
              이 기능은 RealnetPro에서 공식 출력한 PDF를 분석하는 기능입니다.
              PDF 안의 내용만으로 확정하기 어려운 항목은 반드시 관리회사 확인 또는 지도 확인을 거쳐야 합니다.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.summaryCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ConditionPanel({
  title,
  tone,
  conditions,
}: {
  title: string;
  tone: 'must' | 'preferred' | 'ng' | 'check';
  conditions: ParsedCondition[];
}) {
  const toneStyle =
    tone === 'must'
      ? styles.mustCard
      : tone === 'preferred'
        ? styles.preferredCard
        : tone === 'ng'
          ? styles.ngCard
          : styles.checkCard;

  return (
    <article style={{ ...styles.conditionPanel, ...toneStyle }}>
      <h2 style={styles.conditionTitle}>{title}</h2>
      {conditions.length > 0 ? (
        <div style={styles.conditionList}>
          {conditions.map((condition) => (
            <div key={condition.label} style={styles.conditionItem}>
              <strong>{condition.label}</strong>
              <p>{condition.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={styles.emptyText}>자동 추출된 조건이 없습니다.</p>
      )}
    </article>
  );
}

function getRankStyle(rank: MatchRank): CSSProperties {
  if (rank === 'A추천') return styles.rankA;
  if (rank === 'B후보') return styles.rankB;
  if (rank === '탈락') return styles.rankFail;
  return styles.rankC;
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    padding: '0',
    color: '#241d18',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '24px',
    alignItems: 'end',
    marginBottom: '24px',
  },
  eyebrow: {
    margin: '0 0 8px',
    color: '#9b6b43',
    fontSize: '13px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 800,
  },
  title: {
    margin: 0,
    color: '#f8fafc',
    fontSize: '34px',
    letterSpacing: '-0.04em',
    lineHeight: 1.15,
  },
  description: {
    margin: '12px 0 0',
    maxWidth: '820px',
    color: '#d4d4d8',
    lineHeight: 1.65,
  },
  statusBox: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '16px',
    borderRadius: '18px',
    background: '#18181b',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
    color: '#f8fafc',
  },
  statusDot: {
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    background: '#d89b2b',
    marginTop: '5px',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
    alignItems: 'start',
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #eadfd4',
    borderRadius: '24px',
    padding: '22px',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.18)',
    marginBottom: '20px',
  },
  panelSubBox: {
    background: '#fffaf5',
    border: '1px solid #eadfd4',
    borderRadius: '18px',
    padding: '18px',
    marginTop: '18px',
  },
  panelHeader: {
    marginBottom: '16px',
  },
  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  panelTitle: {
    margin: 0,
    fontSize: '21px',
    letterSpacing: '-0.03em',
    color: '#241d18',
  },
  subTitle: {
    margin: 0,
    fontSize: '17px',
    color: '#241d18',
  },
  panelSubText: {
    margin: '8px 0 0',
    color: '#7b716a',
    fontSize: '14px',
    lineHeight: 1.55,
  },
  inputTextarea: {
    width: '100%',
    minHeight: '520px',
    boxSizing: 'border-box',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #ded2c7',
    background: '#fffdfb',
    color: '#241d18',
    fontSize: '14px',
    lineHeight: 1.65,
    resize: 'vertical',
    outline: 'none',
  },
  outputTextarea: {
    width: '100%',
    minHeight: '280px',
    boxSizing: 'border-box',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #ded2c7',
    background: '#fffdfb',
    color: '#241d18',
    fontSize: '14px',
    lineHeight: 1.65,
    resize: 'vertical',
    outline: 'none',
  },
  outputTextareaSmall: {
    width: '100%',
    minHeight: '220px',
    boxSizing: 'border-box',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #ded2c7',
    background: '#fffdfb',
    color: '#241d18',
    fontSize: '14px',
    lineHeight: 1.65,
    resize: 'vertical',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '14px',
  },
  buttonRowNoMargin: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '999px',
    padding: '10px 16px',
    background: '#8b5a2b',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  secondaryButton: {
    border: '1px solid #d8c7b5',
    borderRadius: '999px',
    padding: '10px 16px',
    background: '#fff',
    color: '#5b4432',
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dangerButton: {
    border: '1px solid #e0b4a8',
    borderRadius: '999px',
    padding: '10px 16px',
    background: '#fff6f3',
    color: '#a33c24',
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  infoItem: {
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #eadfd4',
    background: '#fffaf5',
  },
  conditionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  conditionPanel: {
    borderRadius: '22px',
    padding: '18px',
    border: '1px solid #eadfd4',
    minHeight: '260px',
  },
  mustCard: { background: '#eef7f0' },
  preferredCard: { background: '#eef3ff' },
  ngCard: { background: '#fff0ed' },
  checkCard: { background: '#fff8dc' },
  conditionTitle: {
    margin: '0 0 14px',
    fontSize: '18px',
    color: '#241d18',
  },
  conditionList: {
    display: 'grid',
    gap: '10px',
  },
  conditionItem: {
    padding: '12px',
    borderRadius: '14px',
    background: 'rgba(255, 255, 255, 0.72)',
    border: '1px solid rgba(120, 90, 60, 0.12)',
  },
  uploadBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px',
    borderRadius: '18px',
    border: '1px dashed #d3bda8',
    background: '#fffaf5',
  },
  uploadButton: {
    border: 'none',
    borderRadius: '999px',
    padding: '13px 18px',
    background: '#0f172a',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  uploadButtonDisabled: {
    border: 'none',
    borderRadius: '999px',
    padding: '13px 18px',
    background: '#94a3b8',
    color: '#fff',
    fontWeight: 900,
    cursor: 'not-allowed',
    whiteSpace: 'nowrap',
  },
  hiddenInput: {
    display: 'none',
  },
  errorText: {
    margin: '8px 0 0',
    color: '#b42318',
    fontSize: '13px',
    fontWeight: 800,
  },
  resultSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: '12px',
    marginTop: '18px',
  },
  summaryCard: {
    padding: '14px',
    borderRadius: '16px',
    border: '1px solid #eadfd4',
    background: '#fffdfb',
  },
  tableWrap: {
    overflowX: 'auto',
    marginTop: '18px',
    borderRadius: '16px',
    border: '1px solid #eadfd4',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1180px',
    background: '#fff',
    fontSize: '13px',
  },
  th: {
    padding: '12px',
    borderBottom: '1px solid #eadfd4',
    background: '#f8f4ef',
    color: '#51463d',
    textAlign: 'left',
    fontWeight: 900,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f0e6dc',
    verticalAlign: 'top',
    color: '#241d18',
  },
  rankBadge: {
    display: 'inline-block',
    minWidth: '74px',
    textAlign: 'center',
    borderRadius: '999px',
    padding: '7px 10px',
    fontSize: '12px',
    fontWeight: 900,
    lineHeight: 1.35,
  },
  rankA: {
    background: '#e9f7ed',
    color: '#197b38',
  },
  rankB: {
    background: '#eef3ff',
    color: '#3157a5',
  },
  rankC: {
    background: '#fff6d7',
    color: '#8a6200',
  },
  rankFail: {
    background: '#fff0ed',
    color: '#b13b28',
  },
  smallText: {
    margin: '5px 0 0',
    color: '#776b61',
    fontSize: '12px',
    lineHeight: 1.45,
  },
  compactList: {
    margin: 0,
    paddingLeft: '18px',
    display: 'grid',
    gap: '4px',
  },
  detailsBox: {
    marginTop: '18px',
    padding: '14px',
    borderRadius: '14px',
    background: '#f8f4ef',
    color: '#241d18',
  },
  previewBox: {
    margin: '12px 0 0',
    whiteSpace: 'pre-wrap',
    maxHeight: '260px',
    overflow: 'auto',
    padding: '14px',
    borderRadius: '12px',
    background: '#241d18',
    color: '#fff8ec',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  codeBox: {
    minHeight: '340px',
    maxHeight: '520px',
    overflow: 'auto',
    margin: 0,
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #ded2c7',
    background: '#241d18',
    color: '#fff8ec',
    fontSize: '13px',
    lineHeight: 1.55,
  },
  memoList: {
    margin: 0,
    paddingLeft: '20px',
    lineHeight: 1.7,
  },
  warningBox: {
    marginTop: '18px',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #ead2a8',
    background: '#fff8dc',
    lineHeight: 1.6,
  },
  emptyText: {
    margin: 0,
    color: '#8a7b70',
    lineHeight: 1.6,
  },
};
