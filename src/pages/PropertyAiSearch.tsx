import { useMemo, useState, type CSSProperties } from 'react';

type ConditionLevel = '필수' | '선호' | 'NG' | '확인필요';

type ParsedCondition = {
  level: ConditionLevel;
  label: string;
  reason: string;
};

type RealnetSearchCondition = {
  field: string;
  value: string;
  note: string;
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
  realnetSearchConditions: RealnetSearchCondition[];
  japaneseSearchKeywords: string[];
  excludedJapaneseKeywords: string[];
  internalMemo: string[];
};

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

function addUnique(target: string[], value: string) {
  const trimmed = value.trim();

  if (trimmed && !target.includes(trimmed)) {
    target.push(trimmed);
  }
}

function addCondition(
  target: ParsedCondition[],
  level: ConditionLevel,
  label: string,
  reason: string,
) {
  if (!target.some((item) => item.label === label)) {
    target.push({ level, label, reason });
  }
}

function parseBudget(text: string) {
  const normalized = normalizeText(text);

  const directYenMatch = normalized.match(/(\d{2,3})[,，]?(\d{3})\s*엔?/);
  if (directYenMatch) {
    return Number(`${directYenMatch[1]}${directYenMatch[2]}`);
  }

  const manMatch = normalized.match(/(\d+(?:\.\d+)?)\s*만\s*엔?/);

  if (!manMatch) {
    return null;
  }

  const base = Number(manMatch[1]) * 10000;

  if (normalized.includes('초~중반') || normalized.includes('초중반')) {
    return base + 5000;
  }

  if (normalized.includes('중반')) {
    return base + 5000;
  }

  if (normalized.includes('후반')) {
    return base + 8000;
  }

  if (normalized.includes('초반')) {
    return base + 3000;
  }

  return base;
}

function parseLayouts(text: string) {
  const layouts: string[] = [];
  const candidates = ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK'];

  candidates.forEach((layout) => {
    const regex = new RegExp(layout, 'i');

    if (regex.test(text)) {
      addUnique(layouts, layout);
    }
  });

  return layouts;
}

function parseMinFloor(text: string) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+)\s*(층|階)\s*이상/);

  if (match?.[1]) {
    return Number(match[1]);
  }

  return null;
}

function parseMinTatami(text: string) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(조|帖|畳)/);

  if (match?.[1]) {
    return Number(match[1]);
  }

  return null;
}

function parseMaxWalkMinutes(text: string) {
  const normalized = normalizeText(text);

  const rangeMatch = normalized.match(/도보\s*(\d+)\s*~\s*(\d+)\s*분/);
  if (rangeMatch?.[2]) {
    return Number(rangeMatch[2]);
  }

  const stationWalkRangeMatch = normalized.match(/역까지\s*도보\s*(\d+)\s*~\s*(\d+)\s*분/);
  if (stationWalkRangeMatch?.[2]) {
    return Number(stationWalkRangeMatch[2]);
  }

  const withinMatch = normalized.match(/도보\s*(\d+)\s*분\s*이내/);
  if (withinMatch?.[1]) {
    return Number(withinMatch[1]);
  }

  const stationWalkWithinMatch = normalized.match(/역까지\s*도보\s*(\d+)\s*분\s*이내/);
  if (stationWalkWithinMatch?.[1]) {
    return Number(stationWalkWithinMatch[1]);
  }

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
    ['新今宮', '動物園前', '萩之茶屋', '西成'].forEach((word) =>
      addUnique(excludedJapaneseKeywords, word),
    );
  }

  return { excludedAreas, excludedJapaneseKeywords };
}

function detectPreferredAreas(text: string) {
  const normalized = normalizeText(text);
  const preferredAreas: string[] = [];

  if (normalized.includes('오사카')) {
    addUnique(preferredAreas, '오사카');
  }

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
      '필수',
      `월세+관리비 ${maxTotalRent.toLocaleString()}엔 이하`,
      '예산 상한이 명확하게 입력되어 있어 1차 필터 조건으로 사용합니다.',
    );
  }

  if (layouts.length > 0) {
    addCondition(
      mustConditions,
      '필수',
      `${layouts.join(' / ')} 타입`,
      '희망 간取り가 명확하므로 검색 조건으로 사용합니다.',
    );
  }

  if (minFloor) {
    addCondition(
      mustConditions,
      '필수',
      `${minFloor}층 이상`,
      '층수 희망이 명확하므로 필수 조건으로 분류합니다.',
    );
  }

  if (minTatami) {
    addCondition(
      preferredConditions,
      '선호',
      `${minTatami}조 이상 또는 그에 가까운 방`,
      '조수는 도면 표기 차이가 있어 선호 조건으로 두고 확인합니다.',
    );
  }

  if (maxWalkMinutes) {
    addCondition(
      mustConditions,
      '필수',
      `역 도보 ${maxWalkMinutes}분 이내`,
      '역거리 희망이 명확하므로 검색 조건으로 사용합니다.',
    );
  }

  if (normalized.includes('오토록') || normalized.includes('オートロック')) {
    addCondition(
      mustConditions,
      '필수',
      '오토록',
      '1층 공동현관 오토록을 요구하고 있어 필수 설비로 분류합니다.',
    );
  }

  if (
    normalized.includes('무인택배') ||
    normalized.includes('택배함') ||
    normalized.includes('宅配box') ||
    normalized.includes('宅配ボックス')
  ) {
    addCondition(
      mustConditions,
      '필수',
      '무인택배함 / 宅配BOX',
      '무인택배함을 요구하고 있어 필수 설비로 분류합니다.',
    );
  }

  if (
    normalized.includes('철근콘크리트') ||
    normalized.includes('rc') ||
    normalized.includes('src') ||
    normalized.includes('鉄筋')
  ) {
    addCondition(
      mustConditions,
      '필수',
      'RC / SRC / 철근콘크리트 구조',
      '구조 조건이 명확하고 방음·단열 희망과도 연결됩니다.',
    );
  }

  if (normalized.includes('도시가스') || normalized.includes('都市ガス')) {
    addCondition(
      mustConditions,
      '필수',
      '도시가스',
      '도시가스 희망이 명확하므로 필수 조건으로 분류합니다.',
    );
  }

  if (normalized.includes('프로판') || normalized.includes('プロパン')) {
    addCondition(
      ngConditions,
      'NG',
      '프로판가스',
      '프로판가스 제외 요청이 있어 탈락 조건으로 분류합니다.',
    );
  }

  if (normalized.includes('북향') || normalized.includes('北向')) {
    addCondition(
      ngConditions,
      'NG',
      '북향',
      '북향 절대 제외 요청이 있어 탈락 조건으로 분류합니다.',
    );
  }

  if (excludedAreas.length > 0) {
    excludedAreas.forEach((area) => {
      addCondition(
        ngConditions,
        'NG',
        area,
        '고객이 명확히 제외한 지역 또는 생활권입니다.',
      );
    });
  }

  if (normalized.includes('선로') || normalized.includes('전철')) {
    addCondition(
      ngConditions,
      'NG',
      '전철 선로 인접',
      '소음 우려가 있어 제외 조건으로 분류합니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '지도상 선로 인접 여부',
      'RealnetPro 기본 항목만으로는 확인이 어려울 수 있어 지도 확인이 필요합니다.',
    );
  }

  if (normalized.includes('시야') || normalized.includes('고층건물') || normalized.includes('차단')) {
    addCondition(
      ngConditions,
      'NG',
      '창밖 시야 차단 심한 매물',
      '고객이 OUT 조건으로 언급했습니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '창밖 시야 / 맞은편 고층건물 여부',
      '사진, 스트리트뷰, 내견으로 확인해야 합니다.',
    );
  }

  if (normalized.includes('24시간') && (normalized.includes('분리수거') || normalized.includes('쓰레기'))) {
    addCondition(
      preferredConditions,
      '선호',
      '24시간 쓰레기 배출 / 분리수거 가능',
      '설비나 관리규약 확인이 필요한 항목이므로 선호 조건으로 분류합니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '24시간 쓰레기 배출 가능 여부',
      '물건 정보에 없으면 관리회사 확인이 필요합니다.',
    );
  }

  if (normalized.includes('벌레')) {
    addCondition(
      preferredConditions,
      '선호',
      '벌레 리스크가 낮은 건물',
      '고층, RC, 주변 음식점 여부, 쓰레기장 위치 등을 함께 봐야 합니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '벌레 발생 리스크',
      '완전 보장은 어렵고, 층수·주변 환경·건물 관리상태 확인이 필요합니다.',
    );
  }

  if (normalized.includes('방음')) {
    addCondition(
      preferredConditions,
      '선호',
      '방음이 비교적 좋은 매물',
      'RC/SRC, 선로·대로변 인접 여부, 벽 두께 등으로 추정합니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '방음 수준',
      '구조만으로 확정할 수 없어 내견 및 주변 환경 확인이 필요합니다.',
    );
  }

  if (normalized.includes('따뜻')) {
    addCondition(
      preferredConditions,
      '선호',
      '겨울에 비교적 따뜻한 방',
      '향, 층수, 각방 여부, 단열, 창 상태를 함께 봐야 합니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '겨울철 단열/채광',
      '내견, 향, 창, 층수, 주변 건물 상태 확인이 필요합니다.',
    );
  }

  if (normalized.includes('가스레인지') || normalized.includes('화구') || normalized.includes('コンロ')) {
    addCondition(
      preferredConditions,
      '선호',
      '가스레인지 기본 옵션 / 가능하면 2구',
      '설비란에 없으면 관리회사 확인이 필요합니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '가스레인지 기본 옵션 및 2구 여부',
      '도면·설비 정보·관리회사 확인이 필요합니다.',
    );
  }

  if (normalized.includes('치안')) {
    addCondition(
      preferredConditions,
      '선호',
      '치안이 괜찮은 생활권',
      '지역 특성과 야간 동선 확인이 필요한 조건입니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '치안 및 야간 귀가 동선',
      '직원 경험, 지도, 역 주변 분위기 확인이 필요합니다.',
    );
  }

  if (normalized.includes('편의점') || normalized.includes('마트') || normalized.includes('약국')) {
    addCondition(
      preferredConditions,
      '선호',
      '편의점 / 마트 / 약국 근처',
      '생활 편의시설 접근성을 선호 조건으로 분류합니다.',
    );
    addCondition(
      checkNeededConditions,
      '확인필요',
      '주변 편의시설',
      '지도상 편의점, 슈퍼, 드럭스토어 위치 확인이 필요합니다.',
    );
  }

  if (normalized.includes('많은 매물') || normalized.includes('최대한 많은')) {
    internalMemo.push('고객이 많은 후보를 원하므로, A추천뿐 아니라 B후보까지 함께 제안하는 방식이 적합합니다.');
  }

  if (visaStatus.includes('워킹') || visaStatus.includes('워홀') || visaStatus.includes('워킹홀리데이')) {
    internalMemo.push('워킹홀리데이 1년 체류이므로 외국인 계약 가능 여부, 단기 체류 심사 가능 여부, 보증회사 조건 확인이 필요합니다.');
    addCondition(
      checkNeededConditions,
      '확인필요',
      '외국인 계약 가능 여부 / 워홀 심사 가능 여부',
      '재류자격과 체류기간에 따라 보증회사 심사 조건이 달라질 수 있습니다.',
    );
  }

  const realnetSearchConditions: RealnetSearchCondition[] = [];

  realnetSearchConditions.push({
    field: 'エリア',
    value: preferredAreas.length > 0 ? preferredAreas.join(' / ') : areaMemo,
    note: '초기 검색 지역입니다. 공식 연계 시 RealnetPro 지역 코드로 변환해야 합니다.',
  });

  if (excludedAreas.length > 0) {
    realnetSearchConditions.push({
      field: '除外エリア',
      value: excludedAreas.join(' / '),
      note: '검색 결과에서 제외하거나 후처리 필터로 탈락 처리합니다.',
    });
  }

  if (maxTotalRent) {
    realnetSearchConditions.push({
      field: '賃料 + 共益費',
      value: `${maxTotalRent.toLocaleString()}円以下`,
      note: '월세와 관리비 합산 기준입니다.',
    });
  }

  if (layouts.length > 0) {
    realnetSearchConditions.push({
      field: '間取り',
      value: layouts.join(' / '),
      note: 'RealnetPro 검색 조건의 간取り 항목에 매핑합니다.',
    });
  }

  if (minFloor) {
    realnetSearchConditions.push({
      field: '所在階',
      value: `${minFloor}階以上`,
      note: '3층 이상 등 층수 필터입니다.',
    });
  }

  if (maxWalkMinutes) {
    realnetSearchConditions.push({
      field: '駅徒歩',
      value: `${maxWalkMinutes}分以内`,
      note: '가장 가까운 역 기준입니다.',
    });
  }

  mustConditions.forEach((condition) => {
    if (
      condition.label.includes('오토록') ||
      condition.label.includes('택배') ||
      condition.label.includes('도시가스') ||
      condition.label.includes('RC')
    ) {
      realnetSearchConditions.push({
        field: '設備/構造',
        value: condition.label,
        note: 'RealnetPro 제공 항목에 있을 경우 검색 필터로 사용하고, 없으면 후처리 판정에 사용합니다.',
      });
    }
  });

  const japaneseSearchKeywords: string[] = [];

  mustConditions.forEach((condition) => {
    if (condition.label.includes('오토록')) addUnique(japaneseSearchKeywords, 'オートロック');
    if (condition.label.includes('택배')) addUnique(japaneseSearchKeywords, '宅配BOX');
    if (condition.label.includes('도시가스')) addUnique(japaneseSearchKeywords, '都市ガス');
    if (condition.label.includes('RC')) {
      addUnique(japaneseSearchKeywords, 'RC');
      addUnique(japaneseSearchKeywords, '鉄筋コンクリート');
    }
  });

  preferredConditions.forEach((condition) => {
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
    realnetSearchConditions,
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

  if (parsed.mustConditions.length > 0) {
    parsed.mustConditions.forEach((condition) => {
      lines.push(`- ${condition.label}`);
    });
  } else {
    lines.push('- 별도 필수 조건 확인 필요');
  }

  lines.push('');
  lines.push('[선호 조건]');

  if (parsed.preferredConditions.length > 0) {
    parsed.preferredConditions.forEach((condition) => {
      lines.push(`- ${condition.label}`);
    });
  } else {
    lines.push('- 별도 선호 조건 확인 필요');
  }

  lines.push('');
  lines.push('[제외 조건]');

  if (parsed.ngConditions.length > 0) {
    parsed.ngConditions.forEach((condition) => {
      lines.push(`- ${condition.label}`);
    });
  } else {
    lines.push('- 별도 제외 조건 확인 필요');
  }

  lines.push('');
  lines.push('[확인 필요]');
  parsed.checkNeededConditions.forEach((condition) => {
    lines.push(`- ${condition.label}`);
  });

  lines.push('');
  lines.push('위 조건 기준으로 우선 필수 조건에 가까운 매물을 먼저 확인하고, 모든 조건을 100% 확정하기 어려운 항목은 관리회사 확인 후 안내드리겠습니다.');

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

function buildRealnetInquiryMemo(parsed: ParsedCustomerRequest) {
  const lines: string[] = [];

  lines.push('RealnetPro 공식 데이터 연계 시 필요한 검색 조건 후보');
  lines.push('');
  lines.push(`고객명: ${parsed.customerName}`);
  lines.push(`재류자격: ${parsed.visaStatus}`);
  lines.push('');

  parsed.realnetSearchConditions.forEach((condition) => {
    lines.push(`- ${condition.field}: ${condition.value}`);
    lines.push(`  메모: ${condition.note}`);
  });

  if (parsed.japaneseSearchKeywords.length > 0) {
    lines.push('');
    lines.push(`검색 키워드 후보: ${parsed.japaneseSearchKeywords.join(', ')}`);
  }

  if (parsed.excludedJapaneseKeywords.length > 0) {
    lines.push(`제외 키워드 후보: ${parsed.excludedJapaneseKeywords.join(', ')}`);
  }

  return lines.join('\n');
}

export default function PropertyAiSearch() {
  const [rawInquiry, setRawInquiry] = useState(sampleInquiry);
  const [copiedLabel, setCopiedLabel] = useState('');

  const parsed = useMemo(() => parseCustomerRequest(rawInquiry), [rawInquiry]);
  const customerSummary = useMemo(() => buildCustomerSummary(parsed), [parsed]);
  const apiJson = useMemo(() => buildApiJson(parsed), [parsed]);
  const realnetMemo = useMemo(() => buildRealnetInquiryMemo(parsed), [parsed]);

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(''), 1800);
    } catch {
      alert('복사에 실패했습니다. 직접 드래그해서 복사해주세요.');
    }
  };

  return (
    <section style={styles.wrapper}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Osaka J Internal AI Tool</p>
          <h1 style={styles.title}>AI 매물 검색 어시스턴트</h1>
          <p style={styles.description}>
            고객 문의 내용을 그대로 붙여넣으면 검색 조건 형태로 정리합니다.
            RealnetPro 공식 데이터 연계가 준비되면 이 조건을 기반으로 자동 매물 검색에 연결할 수 있습니다.
          </p>
        </div>

        <div style={styles.statusBox}>
          <span style={styles.statusDot} />
          <div>
            <strong>RealnetPro 연동 상태</strong>
            <p>공식 API/데이터 연계 확인 전까지는 자동 접속 기능을 비활성화합니다.</p>
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
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setRawInquiry(sampleInquiry)}
            >
              샘플 불러오기
            </button>
            <button
              type="button"
              style={styles.dangerButton}
              onClick={() => setRawInquiry('')}
            >
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
            <InfoItem
              label="월세+관리비 상한"
              value={parsed.maxTotalRent ? `${parsed.maxTotalRent.toLocaleString()}엔` : '미확인'}
            />
            <InfoItem
              label="희망 타입"
              value={parsed.layouts.length > 0 ? parsed.layouts.join(' / ') : '미확인'}
            />
            <InfoItem
              label="최소 층수"
              value={parsed.minFloor ? `${parsed.minFloor}층 이상` : '미확인'}
            />
            <InfoItem
              label="역 도보"
              value={parsed.maxWalkMinutes ? `${parsed.maxWalkMinutes}분 이내` : '미확인'}
            />
          </div>
        </div>
      </section>

      <section style={styles.conditionGrid}>
        <ConditionPanel
          title="필수 조건"
          tone="must"
          conditions={parsed.mustConditions}
        />
        <ConditionPanel
          title="선호 조건"
          tone="preferred"
          conditions={parsed.preferredConditions}
        />
        <ConditionPanel
          title="NG 조건"
          tone="ng"
          conditions={parsed.ngConditions}
        />
        <ConditionPanel
          title="확인 필요"
          tone="check"
          conditions={parsed.checkNeededConditions}
        />
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>3. RealnetPro 검색 조건 후보</h2>
              <p style={styles.panelSubText}>
                공식 연계가 가능해지면 이 조건들을 API/CSV/데이터피드 조건으로 변환합니다.
              </p>
            </div>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => copyText('realnet', realnetMemo)}
            >
              {copiedLabel === 'realnet' ? '복사 완료' : '조건 복사'}
            </button>
          </div>

          <div style={styles.searchConditionList}>
            {parsed.realnetSearchConditions.map((condition) => (
              <div key={`${condition.field}-${condition.value}`} style={styles.searchConditionItem}>
                <strong>{condition.field}</strong>
                <span>{condition.value}</span>
                <p>{condition.note}</p>
              </div>
            ))}
          </div>

          {parsed.japaneseSearchKeywords.length > 0 && (
            <div style={styles.keywordBox}>
              <strong>일본어 검색 키워드 후보</strong>
              <p>{parsed.japaneseSearchKeywords.join(', ')}</p>
            </div>
          )}

          {parsed.excludedJapaneseKeywords.length > 0 && (
            <div style={styles.keywordBox}>
              <strong>제외 키워드 후보</strong>
              <p>{parsed.excludedJapaneseKeywords.join(', ')}</p>
            </div>
          )}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>4. API 연결용 JSON</h2>
              <p style={styles.panelSubText}>
                추후 RealnetPro 공식 데이터 연계 또는 사내 DB 검색에 사용할 구조입니다.
              </p>
            </div>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => copyText('json', apiJson)}
            >
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
              <h2 style={styles.panelTitle}>5. 고객 안내문 초안</h2>
              <p style={styles.panelSubText}>
                상담원이 고객에게 조건 확인용으로 보낼 수 있는 문구입니다.
              </p>
            </div>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => copyText('summary', customerSummary)}
            >
              {copiedLabel === 'summary' ? '복사 완료' : '안내문 복사'}
            </button>
          </div>

          <textarea style={styles.outputTextarea} value={customerSummary} readOnly />
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>6. 내부 메모</h2>
            <p style={styles.panelSubText}>
              상담원이 주의해야 할 내용입니다.
            </p>
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
              RealnetPro에 자동 로그인하거나 화면을 무단으로 긁어오는 기능은 넣지 않습니다.
              공식 API, CSV, 데이터피드, 연계 계약이 확인된 뒤에만 자동 검색 기능을 연결합니다.
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

const styles: Record<string, CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    padding: '0',
    color: '#241d18',
    fontFamily:
      'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
    minHeight: '360px',
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
  mustCard: {
    background: '#eef7f0',
  },
  preferredCard: {
    background: '#eef3ff',
  },
  ngCard: {
    background: '#fff0ed',
  },
  checkCard: {
    background: '#fff8dc',
  },
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
  searchConditionList: {
    display: 'grid',
    gap: '12px',
  },
  searchConditionItem: {
    display: 'grid',
    gap: '5px',
    padding: '13px',
    borderRadius: '14px',
    border: '1px solid #eadfd4',
    background: '#fffaf5',
  },
  keywordBox: {
    marginTop: '14px',
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #eadfd4',
    background: '#f8f4ef',
  },
  codeBox: {
    minHeight: '420px',
    maxHeight: '620px',
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
