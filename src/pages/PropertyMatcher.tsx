import { useMemo, useState } from 'react';

type YesNoUnknown = 'yes' | 'no' | 'unknown';

type CustomerCondition = {
  name: string;
  genderMemo: string;
  visaStatus: string;
  areaMemo: string;
  excludedAreaKeywords: string;
  preferredAreaMemo: string;
  maxTotalRent: number;
  allowedLayouts: string[];
  minFloor: number;
  minTatami: number;
  maxWalkMinutes: number;
  requireAutoLock: boolean;
  requireDeliveryBox: boolean;
  requireRc: boolean;
  requireCityGas: boolean;
  rejectNorthFacing: boolean;
  rejectPropaneGas: boolean;
  rejectRailAdjacent: boolean;
  rejectViewBlocked: boolean;
  preferTrashAnytime: boolean;
  preferTwoBurnerGasStove: boolean;
  preferSafety: boolean;
  preferConvenience: boolean;
};

type PropertyInput = {
  id: string;
  name: string;
  roomNo: string;
  address: string;
  nearestStation: string;
  lineName: string;
  walkMinutes: number;
  rent: number;
  managementFee: number;
  layout: string;
  tatami: number;
  sqm: number;
  floor: number;
  totalFloors: number;
  structure: string;
  builtYear: string;
  facing: string;
  gasType: string;
  autoLock: YesNoUnknown;
  deliveryBox: YesNoUnknown;
  trashAnytime: YesNoUnknown;
  stoveIncluded: YesNoUnknown;
  stoveBurners: string;
  railAdjacent: YesNoUnknown;
  viewBlocked: YesNoUnknown;
  safetyMemo: string;
  convenienceMemo: string;
  url: string;
  staffMemo: string;
};

type AnalysisResult = {
  property: PropertyInput;
  totalCost: number;
  score: number;
  rank: 'A추천' | 'B후보' | 'C확인필요' | '탈락';
  hardFailReasons: string[];
  strengths: string[];
  cautions: string[];
  checkNeeded: string[];
};

const yesNoUnknownLabel: Record<YesNoUnknown, string> = {
  yes: '있음 / 해당',
  no: '없음 / 아님',
  unknown: '확인 필요',
};

const defaultCustomer: CustomerCondition = {
  name: '이기현',
  genderMemo: '남성 추정',
  visaStatus: '워킹홀리데이 1년',
  areaMemo: '오사카 전체 가능',
  excludedAreaKeywords: '신이마미야\n新今宮\n動物園前\n萩之茶屋\n西成',
  preferredAreaMemo: '신이마미야역 근처는 제외, 그 위쪽 생활권 희망',
  maxTotalRent: 75000,
  allowedLayouts: ['1R', '1K'],
  minFloor: 3,
  minTatami: 7,
  maxWalkMinutes: 10,
  requireAutoLock: true,
  requireDeliveryBox: true,
  requireRc: true,
  requireCityGas: true,
  rejectNorthFacing: true,
  rejectPropaneGas: true,
  rejectRailAdjacent: true,
  rejectViewBlocked: true,
  preferTrashAnytime: true,
  preferTwoBurnerGasStove: true,
  preferSafety: true,
  preferConvenience: true,
};

const createEmptyProperty = (): PropertyInput => ({
  id: crypto.randomUUID(),
  name: '',
  roomNo: '',
  address: '',
  nearestStation: '',
  lineName: '',
  walkMinutes: 10,
  rent: 0,
  managementFee: 0,
  layout: '1K',
  tatami: 7,
  sqm: 20,
  floor: 3,
  totalFloors: 10,
  structure: 'RC',
  builtYear: '',
  facing: '동향',
  gasType: '도시가스',
  autoLock: 'unknown',
  deliveryBox: 'unknown',
  trashAnytime: 'unknown',
  stoveIncluded: 'unknown',
  stoveBurners: '확인 필요',
  railAdjacent: 'unknown',
  viewBlocked: 'unknown',
  safetyMemo: '',
  convenienceMemo: '',
  url: '',
  staffMemo: '',
});

const sampleProperty = (): PropertyInput => ({
  id: crypto.randomUUID(),
  name: '예시 매물',
  roomNo: '403',
  address: '大阪市中央区 ○○',
  nearestStation: '堺筋本町',
  lineName: '大阪メトロ堺筋線',
  walkMinutes: 7,
  rent: 68000,
  managementFee: 7000,
  layout: '1K',
  tatami: 7,
  sqm: 22,
  floor: 4,
  totalFloors: 10,
  structure: 'RC',
  builtYear: '2018년',
  facing: '동향',
  gasType: '도시가스',
  autoLock: 'yes',
  deliveryBox: 'yes',
  trashAnytime: 'unknown',
  stoveIncluded: 'yes',
  stoveBurners: '2구',
  railAdjacent: 'no',
  viewBlocked: 'no',
  safetyMemo: '비교적 생활권 양호. 대로변 접근 가능.',
  convenienceMemo: '근처 편의점, 슈퍼 확인 필요.',
  url: '',
  staffMemo: '샘플용 매물입니다. 실제 제안 전 삭제하세요.',
});

function includesAnyKeyword(text: string, keywordsText: string) {
  const normalizedText = text.toLowerCase();
  const keywords = keywordsText
    .split('\n')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);

  return keywords.some((keyword) => normalizedText.includes(keyword));
}

function analyzeProperty(
  customer: CustomerCondition,
  property: PropertyInput,
): AnalysisResult {
  const hardFailReasons: string[] = [];
  const strengths: string[] = [];
  const cautions: string[] = [];
  const checkNeeded: string[] = [];

  let score = 0;
  const totalCost = Number(property.rent || 0) + Number(property.managementFee || 0);

  const combinedLocationText = [
    property.address,
    property.nearestStation,
    property.lineName,
    property.staffMemo,
  ].join(' ');

  if (!property.name.trim()) {
    hardFailReasons.push('매물명이 입력되지 않았습니다.');
  }

  if (customer.excludedAreaKeywords.trim() && includesAnyKeyword(combinedLocationText, customer.excludedAreaKeywords)) {
    hardFailReasons.push('고객이 제외한 지역/역 키워드에 해당할 가능성이 있습니다.');
  }

  if (totalCost <= 0) {
    hardFailReasons.push('월세 또는 관리비 정보가 부족합니다.');
  } else if (totalCost > customer.maxTotalRent) {
    hardFailReasons.push(`월세+관리비 총액이 상한 ${customer.maxTotalRent.toLocaleString()}엔을 초과합니다.`);
  } else {
    if (totalCost <= 70000) {
      score += 15;
      strengths.push('월세+관리비 총액이 7만 엔 이하로 예산 안정권입니다.');
    } else if (totalCost <= 73000) {
      score += 12;
      strengths.push('월세+관리비 총액이 7만 엔 초반대로 예산에 잘 맞습니다.');
    } else {
      score += 8;
      cautions.push('월세+관리비가 7만 엔 중반에 가까워 예산 상한에 근접합니다.');
    }
  }

  if (!customer.allowedLayouts.includes(property.layout)) {
    hardFailReasons.push(`희망 타입(${customer.allowedLayouts.join(', ')})이 아닙니다.`);
  } else {
    score += 8;
    strengths.push(`${property.layout} 타입으로 고객 희망 조건에 맞습니다.`);
  }

  if (Number(property.tatami || 0) < customer.minTatami) {
    cautions.push(`방 크기가 ${customer.minTatami}조 미만일 가능성이 있습니다.`);
  } else {
    score += 5;
    strengths.push(`${property.tatami}조 정도로 희망 크기 조건에 가깝습니다.`);
  }

  if (Number(property.floor || 0) < customer.minFloor) {
    hardFailReasons.push(`${customer.minFloor}층 이상 희망 조건에 맞지 않습니다.`);
  } else {
    score += 8;
    strengths.push(`${property.floor}층으로 3층 이상 조건을 충족합니다.`);
  }

  if (Number(property.walkMinutes || 0) > customer.maxWalkMinutes) {
    hardFailReasons.push(`역 도보 ${customer.maxWalkMinutes}분 이내 조건을 초과합니다.`);
  } else if (Number(property.walkMinutes || 0) <= 5) {
    score += 10;
    strengths.push('역 도보 5분 이내로 접근성이 좋습니다.');
  } else {
    score += 8;
    strengths.push('역 도보 10분 이내 조건을 충족합니다.');
  }

  const structureText = property.structure.toUpperCase();
  const isRc = structureText.includes('RC') || structureText.includes('SRC') || property.structure.includes('鉄筋');

  if (customer.requireRc && !isRc) {
    hardFailReasons.push('RC/SRC 또는 철근콘크리트 구조로 확인되지 않습니다.');
  } else if (isRc) {
    score += 10;
    strengths.push('RC/SRC 계열 구조로 방음·단열 면에서 비교적 유리합니다.');
  }

  if (customer.requireAutoLock) {
    if (property.autoLock === 'no') {
      hardFailReasons.push('오토록이 없습니다.');
    } else if (property.autoLock === 'yes') {
      score += 8;
      strengths.push('1층 공동현관 오토록 조건을 충족합니다.');
    } else {
      checkNeeded.push('오토록 유무 확인이 필요합니다.');
    }
  }

  if (customer.requireDeliveryBox) {
    if (property.deliveryBox === 'no') {
      hardFailReasons.push('무인택배함이 없습니다.');
    } else if (property.deliveryBox === 'yes') {
      score += 8;
      strengths.push('무인택배함 조건을 충족합니다.');
    } else {
      checkNeeded.push('무인택배함 유무 확인이 필요합니다.');
    }
  }

  if (customer.preferTrashAnytime) {
    if (property.trashAnytime === 'yes') {
      score += 6;
      strengths.push('24시간 쓰레기 배출 가능 조건을 충족합니다.');
    } else if (property.trashAnytime === 'no') {
      cautions.push('24시간 쓰레기 배출은 불가할 가능성이 있습니다.');
    } else {
      checkNeeded.push('24시간 분리수거/쓰레기 배출 가능 여부 확인이 필요합니다.');
    }
  }

  if (customer.requireCityGas || customer.rejectPropaneGas) {
    const gasText = property.gasType.toLowerCase();

    if (gasText.includes('プロパン') || gasText.includes('propane') || property.gasType.includes('프로판')) {
      hardFailReasons.push('프로판가스 매물입니다.');
    } else if (gasText.includes('都市') || property.gasType.includes('도시')) {
      score += 8;
      strengths.push('도시가스 조건을 충족합니다.');
    } else {
      checkNeeded.push('도시가스/프로판가스 여부 확인이 필요합니다.');
    }
  }

  if (customer.rejectNorthFacing) {
    if (property.facing.includes('북') || property.facing.includes('北')) {
      hardFailReasons.push('북향 매물입니다.');
    } else if (property.facing.trim()) {
      score += 6;
      strengths.push(`북향이 아닌 ${property.facing} 매물입니다.`);
    } else {
      checkNeeded.push('방 향 확인이 필요합니다.');
    }
  }

  if (customer.rejectRailAdjacent) {
    if (property.railAdjacent === 'yes') {
      hardFailReasons.push('주변 전철 선로 인접 가능성이 있습니다.');
    } else if (property.railAdjacent === 'no') {
      score += 5;
      strengths.push('전철 선로 인접 리스크가 낮아 보입니다.');
    } else {
      checkNeeded.push('전철 선로 인접 여부를 지도/현장으로 확인해야 합니다.');
    }
  }

  if (customer.rejectViewBlocked) {
    if (property.viewBlocked === 'yes') {
      hardFailReasons.push('집 앞 고층건물 등으로 시야 차단 가능성이 있습니다.');
    } else if (property.viewBlocked === 'no') {
      score += 5;
      strengths.push('시야 차단 리스크가 낮아 보입니다.');
    } else {
      checkNeeded.push('창밖 시야 차단 여부를 사진/지도/현장으로 확인해야 합니다.');
    }
  }

  if (customer.preferTwoBurnerGasStove) {
    if (property.stoveIncluded === 'yes' && property.stoveBurners.includes('2')) {
      score += 5;
      strengths.push('2구 가스레인지 조건에 가까운 매물입니다.');
    } else if (property.stoveIncluded === 'no') {
      cautions.push('가스레인지 기본 옵션이 아닐 가능성이 있습니다.');
    } else {
      checkNeeded.push('가스레인지 기본 옵션 여부 및 2구 여부 확인이 필요합니다.');
    }
  }

  if (customer.preferSafety) {
    if (property.safetyMemo.trim()) {
      score += 4;
      strengths.push('치안/생활권 관련 직원 메모가 입력되어 있습니다.');
    } else {
      checkNeeded.push('치안/생활권 평판 확인이 필요합니다.');
    }
  }

  if (customer.preferConvenience) {
    if (property.convenienceMemo.trim()) {
      score += 4;
      strengths.push('편의점·마트·약국 등 생활편의 관련 메모가 입력되어 있습니다.');
    } else {
      checkNeeded.push('편의점·마트·약국 접근성 확인이 필요합니다.');
    }
  }

  checkNeeded.push('벌레 발생 가능성은 층수, 주변 음식점, 건물 관리상태를 별도 확인해야 합니다.');
  checkNeeded.push('방음과 겨울철 단열은 구조만으로 확정할 수 없어 내견/관리회사 확인이 필요합니다.');

  let rank: AnalysisResult['rank'] = 'C확인필요';

  if (hardFailReasons.length > 0) {
    rank = '탈락';
  } else if (score >= 80) {
    rank = 'A추천';
  } else if (score >= 65) {
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

function buildCustomerMessage(customer: CustomerCondition, results: AnalysisResult[]) {
  const candidates = results
    .filter((result) => result.rank !== '탈락')
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return `${customer.name} 고객님 조건 기준으로 확인한 결과, 현재 입력된 매물 중 바로 추천 가능한 매물은 없습니다.

특히 예산, 층수, 구조, 오토록, 택배박스, 도시가스, 북향 제외, 신이마미야 근처 제외 등의 조건이 동시에 들어가 있어 조건을 100% 충족하는 매물 수가 제한될 수 있습니다.

조건 중 일부를 조정하실 수 있다면 더 많은 후보를 확인해드릴 수 있습니다.`;
  }

  const lines: string[] = [];

  lines.push(`${customer.name} 고객님 조건 기준으로 추천 가능한 매물을 정리했습니다.`);
  lines.push('');
  lines.push('모든 조건을 100% 확정하기 어려운 항목도 있어, 우선 필수 조건에 가까운 매물부터 정리했습니다.');
  lines.push('');

  candidates.forEach((result, index) => {
    const property = result.property;

    lines.push(`${index + 1}. ${property.name}${property.roomNo ? ` ${property.roomNo}호` : ''}`);
    lines.push(`- 추천도: ${result.rank} / 조건 점수 ${result.score}점`);
    lines.push(`- 월세+관리비: ${result.totalCost.toLocaleString()}엔`);
    lines.push(`- 위치: ${property.nearestStation || '역 정보 확인 필요'} 도보 ${property.walkMinutes || '?'}분`);
    lines.push(`- 타입/층수: ${property.layout}, ${property.floor}층`);
    lines.push(`- 구조/가스: ${property.structure || '확인 필요'} / ${property.gasType || '확인 필요'}`);

    const topStrengths = result.strengths.slice(0, 4);
    if (topStrengths.length > 0) {
      lines.push(`- 장점: ${topStrengths.join(' / ')}`);
    }

    const topChecks = result.checkNeeded.slice(0, 3);
    if (topChecks.length > 0) {
      lines.push(`- 확인 필요: ${topChecks.join(' / ')}`);
    }

    if (property.url) {
      lines.push(`- 상세 링크: ${property.url}`);
    }

    lines.push('');
  });

  lines.push('※ 실제 신청 전에는 공실 여부, 외국인 계약 가능 여부, 초기비용, 보증회사 심사 조건, 쓰레기 배출 규칙, 가스레인지 설비 여부를 다시 확인해야 합니다.');

  return lines.join('\n');
}

function numberOrZero(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function PropertyMatcher() {
  const [customer, setCustomer] = useState<CustomerCondition>(defaultCustomer);
  const [properties, setProperties] = useState<PropertyInput[]>([sampleProperty()]);
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => {
    return properties
      .map((property) => analyzeProperty(customer, property))
      .sort((a, b) => {
        if (a.rank === '탈락' && b.rank !== '탈락') return 1;
        if (a.rank !== '탈락' && b.rank === '탈락') return -1;
        return b.score - a.score;
      });
  }, [customer, properties]);

  const customerMessage = useMemo(() => {
    return buildCustomerMessage(customer, results);
  }, [customer, results]);

  const updateProperty = <K extends keyof PropertyInput>(
    id: string,
    key: K,
    value: PropertyInput[K],
  ) => {
    setProperties((current) =>
      current.map((property) =>
        property.id === id ? { ...property, [key]: value } : property,
      ),
    );
  };

  const addProperty = () => {
    setProperties((current) => [...current, createEmptyProperty()]);
  };

  const duplicateProperty = (id: string) => {
    setProperties((current) => {
      const target = current.find((property) => property.id === id);
      if (!target) return current;

      return [
        ...current,
        {
          ...target,
          id: crypto.randomUUID(),
          name: `${target.name} 복사본`,
        },
      ];
    });
  };

  const removeProperty = (id: string) => {
    setProperties((current) => current.filter((property) => property.id !== id));
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(customerMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      alert('복사에 실패했습니다. 직접 드래그해서 복사해주세요.');
    }
  };

  const downloadCsv = () => {
    const header = [
      '추천도',
      '점수',
      '매물명',
      '호실',
      '월세+관리비',
      '역',
      '도보',
      '타입',
      '층수',
      '구조',
      '향',
      '가스',
      '탈락사유',
      '확인필요',
      'URL',
    ];

    const rows = results.map((result) => [
      result.rank,
      result.score,
      result.property.name,
      result.property.roomNo,
      result.totalCost,
      result.property.nearestStation,
      result.property.walkMinutes,
      result.property.layout,
      result.property.floor,
      result.property.structure,
      result.property.facing,
      result.property.gasType,
      result.hardFailReasons.join(' / '),
      result.checkNeeded.join(' / '),
      result.property.url,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${customer.name || '고객'}_매물추천리스트.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const candidateCount = results.filter((result) => result.rank !== '탈락').length;
  const failedCount = results.filter((result) => result.rank === '탈락').length;

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Osaka J Internal Tool</p>
          <h1 style={styles.title}>매물 추천 생성기</h1>
          <p style={styles.description}>
            고객 조건과 매물 정보를 비교해서 추천도, 탈락 사유, 확인 필요 항목,
            고객 발송문을 자동으로 정리합니다.
          </p>
        </div>

        <div style={styles.summaryCards}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>입력 매물</span>
            <strong style={styles.summaryValue}>{properties.length}</strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>추천 가능</span>
            <strong style={styles.summaryValue}>{candidateCount}</strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>탈락</span>
            <strong style={styles.summaryValue}>{failedCount}</strong>
          </div>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>1. 고객 조건</h2>
            <p style={styles.panelSubText}>이번 고객님의 필수 조건과 선호 조건입니다.</p>
          </div>

          <div style={styles.formGrid}>
            <label style={styles.label}>
              고객명
              <input
                style={styles.input}
                value={customer.name}
                onChange={(event) =>
                  setCustomer((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label style={styles.label}>
              성별/메모
              <input
                style={styles.input}
                value={customer.genderMemo}
                onChange={(event) =>
                  setCustomer((current) => ({ ...current, genderMemo: event.target.value }))
                }
              />
            </label>

            <label style={styles.label}>
              재류자격
              <input
                style={styles.input}
                value={customer.visaStatus}
                onChange={(event) =>
                  setCustomer((current) => ({ ...current, visaStatus: event.target.value }))
                }
              />
            </label>

            <label style={styles.label}>
              월세+관리비 상한
              <input
                style={styles.input}
                type="number"
                value={customer.maxTotalRent}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    maxTotalRent: numberOrZero(event.target.value),
                  }))
                }
              />
            </label>

            <label style={styles.label}>
              최소 층수
              <input
                style={styles.input}
                type="number"
                value={customer.minFloor}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    minFloor: numberOrZero(event.target.value),
                  }))
                }
              />
            </label>

            <label style={styles.label}>
              역 도보 최대 분수
              <input
                style={styles.input}
                type="number"
                value={customer.maxWalkMinutes}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    maxWalkMinutes: numberOrZero(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <label style={styles.label}>
            희망 지역 메모
            <textarea
              style={styles.textarea}
              value={customer.areaMemo}
              onChange={(event) =>
                setCustomer((current) => ({ ...current, areaMemo: event.target.value }))
              }
            />
          </label>

          <label style={styles.label}>
            제외 지역/역 키워드
            <textarea
              style={styles.textarea}
              value={customer.excludedAreaKeywords}
              onChange={(event) =>
                setCustomer((current) => ({
                  ...current,
                  excludedAreaKeywords: event.target.value,
                }))
              }
            />
          </label>

          <label style={styles.label}>
            선호 지역 메모
            <textarea
              style={styles.textarea}
              value={customer.preferredAreaMemo}
              onChange={(event) =>
                setCustomer((current) => ({
                  ...current,
                  preferredAreaMemo: event.target.value,
                }))
              }
            />
          </label>

          <div style={styles.checkGrid}>
            <label style={styles.checkItem}>
              <input
                type="checkbox"
                checked={customer.requireAutoLock}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    requireAutoLock: event.target.checked,
                  }))
                }
              />
              오토록 필수
            </label>

            <label style={styles.checkItem}>
              <input
                type="checkbox"
                checked={customer.requireDeliveryBox}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    requireDeliveryBox: event.target.checked,
                  }))
                }
              />
              택배박스 필수
            </label>

            <label style={styles.checkItem}>
              <input
                type="checkbox"
                checked={customer.requireRc}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    requireRc: event.target.checked,
                  }))
                }
              />
              RC/SRC 필수
            </label>

            <label style={styles.checkItem}>
              <input
                type="checkbox"
                checked={customer.requireCityGas}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    requireCityGas: event.target.checked,
                  }))
                }
              />
              도시가스 필수
            </label>

            <label style={styles.checkItem}>
              <input
                type="checkbox"
                checked={customer.rejectNorthFacing}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    rejectNorthFacing: event.target.checked,
                  }))
                }
              />
              북향 제외
            </label>

            <label style={styles.checkItem}>
              <input
                type="checkbox"
                checked={customer.rejectRailAdjacent}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    rejectRailAdjacent: event.target.checked,
                  }))
                }
              />
              선로 인접 제외
            </label>

            <label style={styles.checkItem}>
              <input
                type="checkbox"
                checked={customer.rejectViewBlocked}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    rejectViewBlocked: event.target.checked,
                  }))
                }
              />
              시야 차단 제외
            </label>

            <label style={styles.checkItem}>
              <input
                type="checkbox"
                checked={customer.preferTrashAnytime}
                onChange={(event) =>
                  setCustomer((current) => ({
                    ...current,
                    preferTrashAnytime: event.target.checked,
                  }))
                }
              />
              24시간 쓰레기 선호
            </label>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>2. 고객 발송문</h2>
              <p style={styles.panelSubText}>추천 가능 매물을 기준으로 자동 생성됩니다.</p>
            </div>

            <div style={styles.buttonGroup}>
              <button type="button" style={styles.secondaryButton} onClick={downloadCsv}>
                CSV 저장
              </button>
              <button type="button" style={styles.primaryButton} onClick={copyMessage}>
                {copied ? '복사 완료' : '문구 복사'}
              </button>
            </div>
          </div>

          <textarea
            style={styles.messageBox}
            value={customerMessage}
            readOnly
          />
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeaderRow}>
          <div>
            <h2 style={styles.panelTitle}>3. 매물 정보 입력</h2>
            <p style={styles.panelSubText}>
              RealnetPro에서 확인한 매물 정보를 여기에 입력하면 자동 판정됩니다.
            </p>
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" style={styles.secondaryButton} onClick={() => setProperties([sampleProperty()])}>
              샘플 초기화
            </button>
            <button type="button" style={styles.primaryButton} onClick={addProperty}>
              매물 추가
            </button>
          </div>
        </div>

        <div style={styles.propertyList}>
          {properties.map((property, index) => {
            const result = results.find((item) => item.property.id === property.id);

            return (
              <article key={property.id} style={styles.propertyCard}>
                <div style={styles.propertyHeader}>
                  <div>
                    <p style={styles.propertyIndex}>매물 {index + 1}</p>
                    <h3 style={styles.propertyTitle}>
                      {property.name || '매물명 미입력'}
                      {property.roomNo ? ` ${property.roomNo}호` : ''}
                    </h3>
                  </div>

                  <div style={styles.badgeWrap}>
                    {result && (
                      <span
                        style={{
                          ...styles.rankBadge,
                          ...(result.rank === 'A추천'
                            ? styles.rankA
                            : result.rank === 'B후보'
                              ? styles.rankB
                              : result.rank === '탈락'
                                ? styles.rankFail
                                : styles.rankC),
                        }}
                      >
                        {result.rank} · {result.score}점
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.formGridLarge}>
                  <label style={styles.label}>
                    매물명
                    <input
                      style={styles.input}
                      value={property.name}
                      onChange={(event) => updateProperty(property.id, 'name', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    호실
                    <input
                      style={styles.input}
                      value={property.roomNo}
                      onChange={(event) => updateProperty(property.id, 'roomNo', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    주소
                    <input
                      style={styles.input}
                      value={property.address}
                      onChange={(event) => updateProperty(property.id, 'address', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    역
                    <input
                      style={styles.input}
                      value={property.nearestStation}
                      onChange={(event) => updateProperty(property.id, 'nearestStation', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    노선
                    <input
                      style={styles.input}
                      value={property.lineName}
                      onChange={(event) => updateProperty(property.id, 'lineName', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    도보 분수
                    <input
                      style={styles.input}
                      type="number"
                      value={property.walkMinutes}
                      onChange={(event) =>
                        updateProperty(property.id, 'walkMinutes', numberOrZero(event.target.value))
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    월세
                    <input
                      style={styles.input}
                      type="number"
                      value={property.rent}
                      onChange={(event) =>
                        updateProperty(property.id, 'rent', numberOrZero(event.target.value))
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    관리비
                    <input
                      style={styles.input}
                      type="number"
                      value={property.managementFee}
                      onChange={(event) =>
                        updateProperty(property.id, 'managementFee', numberOrZero(event.target.value))
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    타입
                    <select
                      style={styles.input}
                      value={property.layout}
                      onChange={(event) => updateProperty(property.id, 'layout', event.target.value)}
                    >
                      <option value="1R">1R</option>
                      <option value="1K">1K</option>
                      <option value="1DK">1DK</option>
                      <option value="1LDK">1LDK</option>
                      <option value="2K">2K</option>
                      <option value="기타">기타</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    조수
                    <input
                      style={styles.input}
                      type="number"
                      value={property.tatami}
                      onChange={(event) =>
                        updateProperty(property.id, 'tatami', numberOrZero(event.target.value))
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    ㎡
                    <input
                      style={styles.input}
                      type="number"
                      value={property.sqm}
                      onChange={(event) =>
                        updateProperty(property.id, 'sqm', numberOrZero(event.target.value))
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    층수
                    <input
                      style={styles.input}
                      type="number"
                      value={property.floor}
                      onChange={(event) =>
                        updateProperty(property.id, 'floor', numberOrZero(event.target.value))
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    건물 총층
                    <input
                      style={styles.input}
                      type="number"
                      value={property.totalFloors}
                      onChange={(event) =>
                        updateProperty(property.id, 'totalFloors', numberOrZero(event.target.value))
                      }
                    />
                  </label>

                  <label style={styles.label}>
                    구조
                    <select
                      style={styles.input}
                      value={property.structure}
                      onChange={(event) => updateProperty(property.id, 'structure', event.target.value)}
                    >
                      <option value="RC">RC</option>
                      <option value="SRC">SRC</option>
                      <option value="鉄筋コンクリート">鉄筋コンクリート</option>
                      <option value="鉄骨">鉄骨</option>
                      <option value="木造">木造</option>
                      <option value="기타">기타</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    축년수
                    <input
                      style={styles.input}
                      value={property.builtYear}
                      onChange={(event) => updateProperty(property.id, 'builtYear', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    향
                    <select
                      style={styles.input}
                      value={property.facing}
                      onChange={(event) => updateProperty(property.id, 'facing', event.target.value)}
                    >
                      <option value="남향">남향</option>
                      <option value="동향">동향</option>
                      <option value="서향">서향</option>
                      <option value="북향">북향</option>
                      <option value="南">南</option>
                      <option value="東">東</option>
                      <option value="西">西</option>
                      <option value="北">北</option>
                      <option value="확인 필요">확인 필요</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    가스
                    <select
                      style={styles.input}
                      value={property.gasType}
                      onChange={(event) => updateProperty(property.id, 'gasType', event.target.value)}
                    >
                      <option value="도시가스">도시가스</option>
                      <option value="都市ガス">都市ガス</option>
                      <option value="프로판가스">프로판가스</option>
                      <option value="プロパンガス">プロパンガス</option>
                      <option value="확인 필요">확인 필요</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    오토록
                    <select
                      style={styles.input}
                      value={property.autoLock}
                      onChange={(event) =>
                        updateProperty(property.id, 'autoLock', event.target.value as YesNoUnknown)
                      }
                    >
                      <option value="yes">{yesNoUnknownLabel.yes}</option>
                      <option value="no">{yesNoUnknownLabel.no}</option>
                      <option value="unknown">{yesNoUnknownLabel.unknown}</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    택배박스
                    <select
                      style={styles.input}
                      value={property.deliveryBox}
                      onChange={(event) =>
                        updateProperty(property.id, 'deliveryBox', event.target.value as YesNoUnknown)
                      }
                    >
                      <option value="yes">{yesNoUnknownLabel.yes}</option>
                      <option value="no">{yesNoUnknownLabel.no}</option>
                      <option value="unknown">{yesNoUnknownLabel.unknown}</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    24시간 쓰레기
                    <select
                      style={styles.input}
                      value={property.trashAnytime}
                      onChange={(event) =>
                        updateProperty(property.id, 'trashAnytime', event.target.value as YesNoUnknown)
                      }
                    >
                      <option value="yes">{yesNoUnknownLabel.yes}</option>
                      <option value="no">{yesNoUnknownLabel.no}</option>
                      <option value="unknown">{yesNoUnknownLabel.unknown}</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    레인지 기본옵션
                    <select
                      style={styles.input}
                      value={property.stoveIncluded}
                      onChange={(event) =>
                        updateProperty(property.id, 'stoveIncluded', event.target.value as YesNoUnknown)
                      }
                    >
                      <option value="yes">{yesNoUnknownLabel.yes}</option>
                      <option value="no">{yesNoUnknownLabel.no}</option>
                      <option value="unknown">{yesNoUnknownLabel.unknown}</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    화구 수
                    <select
                      style={styles.input}
                      value={property.stoveBurners}
                      onChange={(event) => updateProperty(property.id, 'stoveBurners', event.target.value)}
                    >
                      <option value="1구">1구</option>
                      <option value="2구">2구</option>
                      <option value="3구">3구</option>
                      <option value="확인 필요">확인 필요</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    선로 인접
                    <select
                      style={styles.input}
                      value={property.railAdjacent}
                      onChange={(event) =>
                        updateProperty(property.id, 'railAdjacent', event.target.value as YesNoUnknown)
                      }
                    >
                      <option value="yes">{yesNoUnknownLabel.yes}</option>
                      <option value="no">{yesNoUnknownLabel.no}</option>
                      <option value="unknown">{yesNoUnknownLabel.unknown}</option>
                    </select>
                  </label>

                  <label style={styles.label}>
                    시야 차단
                    <select
                      style={styles.input}
                      value={property.viewBlocked}
                      onChange={(event) =>
                        updateProperty(property.id, 'viewBlocked', event.target.value as YesNoUnknown)
                      }
                    >
                      <option value="yes">{yesNoUnknownLabel.yes}</option>
                      <option value="no">{yesNoUnknownLabel.no}</option>
                      <option value="unknown">{yesNoUnknownLabel.unknown}</option>
                    </select>
                  </label>
                </div>

                <div style={styles.formGrid}>
                  <label style={styles.label}>
                    치안/생활권 메모
                    <textarea
                      style={styles.textarea}
                      value={property.safetyMemo}
                      onChange={(event) => updateProperty(property.id, 'safetyMemo', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    편의시설 메모
                    <textarea
                      style={styles.textarea}
                      value={property.convenienceMemo}
                      onChange={(event) => updateProperty(property.id, 'convenienceMemo', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    상세 URL
                    <textarea
                      style={styles.textarea}
                      value={property.url}
                      onChange={(event) => updateProperty(property.id, 'url', event.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    직원 메모
                    <textarea
                      style={styles.textarea}
                      value={property.staffMemo}
                      onChange={(event) => updateProperty(property.id, 'staffMemo', event.target.value)}
                    />
                  </label>
                </div>

                {result && (
                  <div style={styles.resultBox}>
                    <div>
                      <strong>월세+관리비 총액:</strong> {result.totalCost.toLocaleString()}엔
                    </div>

                    {result.hardFailReasons.length > 0 && (
                      <div style={styles.resultSection}>
                        <strong style={styles.failText}>탈락 사유</strong>
                        <ul style={styles.ul}>
                          {result.hardFailReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.strengths.length > 0 && (
                      <div style={styles.resultSection}>
                        <strong style={styles.goodText}>장점</strong>
                        <ul style={styles.ul}>
                          {result.strengths.slice(0, 6).map((strength) => (
                            <li key={strength}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.cautions.length > 0 && (
                      <div style={styles.resultSection}>
                        <strong style={styles.cautionText}>주의</strong>
                        <ul style={styles.ul}>
                          {result.cautions.map((caution) => (
                            <li key={caution}>{caution}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.checkNeeded.length > 0 && (
                      <div style={styles.resultSection}>
                        <strong>확인 필요</strong>
                        <ul style={styles.ul}>
                          {result.checkNeeded.slice(0, 6).map((check) => (
                            <li key={check}>{check}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div style={styles.cardActions}>
                  <button type="button" style={styles.secondaryButton} onClick={() => duplicateProperty(property.id)}>
                    복사
                  </button>
                  <button type="button" style={styles.dangerButton} onClick={() => removeProperty(property.id)}>
                    삭제
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f6f3ee',
    color: '#241d18',
    padding: '32px',
    fontFamily:
      'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
    alignItems: 'flex-end',
    marginBottom: '24px',
  },
  eyebrow: {
    margin: '0 0 8px',
    fontSize: '13px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#9b6b43',
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: '34px',
    lineHeight: 1.15,
    letterSpacing: '-0.04em',
  },
  description: {
    margin: '12px 0 0',
    maxWidth: '720px',
    color: '#6b625b',
    lineHeight: 1.65,
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(110px, 1fr))',
    gap: '12px',
  },
  summaryCard: {
    background: '#fff',
    border: '1px solid #eadfd4',
    borderRadius: '18px',
    padding: '16px',
    boxShadow: '0 12px 30px rgba(91, 66, 45, 0.08)',
  },
  summaryLabel: {
    display: 'block',
    color: '#8a7b70',
    fontSize: '13px',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '28px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.05fr 0.95fr',
    gap: '20px',
    alignItems: 'start',
    marginBottom: '20px',
  },
  panel: {
    background: '#fff',
    border: '1px solid #eadfd4',
    borderRadius: '24px',
    padding: '22px',
    boxShadow: '0 14px 36px rgba(91, 66, 45, 0.08)',
  },
  panelHeader: {
    marginBottom: '18px',
  },
  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '18px',
  },
  panelTitle: {
    margin: 0,
    fontSize: '21px',
    letterSpacing: '-0.03em',
  },
  panelSubText: {
    margin: '8px 0 0',
    color: '#7b716a',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
    marginBottom: '14px',
  },
  formGridLarge: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '14px',
    marginBottom: '14px',
  },
  label: {
    display: 'grid',
    gap: '7px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#51463d',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #ded2c7',
    borderRadius: '12px',
    padding: '11px 12px',
    fontSize: '14px',
    background: '#fffdfb',
    color: '#241d18',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    minHeight: '82px',
    boxSizing: 'border-box',
    border: '1px solid #ded2c7',
    borderRadius: '12px',
    padding: '11px 12px',
    fontSize: '14px',
    background: '#fffdfb',
    color: '#241d18',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.5,
  },
  checkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
    marginTop: '18px',
  },
  checkItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '10px 12px',
    border: '1px solid #eadfd4',
    borderRadius: '12px',
    background: '#fffaf5',
    fontSize: '14px',
    fontWeight: 700,
  },
  buttonGroup: {
    display: 'flex',
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
  },
  secondaryButton: {
    border: '1px solid #d8c7b5',
    borderRadius: '999px',
    padding: '10px 16px',
    background: '#fff',
    color: '#5b4432',
    fontWeight: 800,
    cursor: 'pointer',
  },
  dangerButton: {
    border: '1px solid #e0b4a8',
    borderRadius: '999px',
    padding: '10px 16px',
    background: '#fff6f3',
    color: '#a33c24',
    fontWeight: 800,
    cursor: 'pointer',
  },
  messageBox: {
    width: '100%',
    minHeight: '540px',
    boxSizing: 'border-box',
    border: '1px solid #ded2c7',
    borderRadius: '16px',
    padding: '16px',
    fontSize: '14px',
    lineHeight: 1.65,
    background: '#fffdfb',
    color: '#241d18',
    resize: 'vertical',
  },
  propertyList: {
    display: 'grid',
    gap: '16px',
  },
  propertyCard: {
    border: '1px solid #eadfd4',
    borderRadius: '20px',
    padding: '18px',
    background: '#fffdfb',
  },
  propertyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px',
  },
  propertyIndex: {
    margin: '0 0 4px',
    color: '#9b6b43',
    fontSize: '13px',
    fontWeight: 800,
  },
  propertyTitle: {
    margin: 0,
    fontSize: '20px',
  },
  badgeWrap: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  rankBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 900,
    whiteSpace: 'nowrap',
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
  resultBox: {
    marginTop: '14px',
    padding: '14px',
    borderRadius: '16px',
    background: '#f8f4ef',
    border: '1px solid #eadfd4',
    fontSize: '14px',
    lineHeight: 1.55,
  },
  resultSection: {
    marginTop: '12px',
  },
  ul: {
    margin: '8px 0 0',
    paddingLeft: '20px',
  },
  goodText: {
    color: '#197b38',
  },
  failText: {
    color: '#b13b28',
  },
  cautionText: {
    color: '#8a6200',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '14px',
  },
};
