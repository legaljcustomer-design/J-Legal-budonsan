import { useMemo, useState, type CSSProperties } from 'react';

type ParsedCondition = {
  label: string;
  reason: string;
};

type ParsedRequest = {
  customerName: string;
  genderMemo: string;
  visaStatus: string;
  areaMemo: string;
  budgetUpper: number | null;
  layouts: string[];
  minFloor: number | null;
  maxWalkMinutes: number | null;
  mustConditions: ParsedCondition[];
  preferredConditions: ParsedCondition[];
  ngConditions: ParsedCondition[];
  checkNeeded: ParsedCondition[];
  realnetConditions: string[];
  chatGptPrompt: string;
  customerConfirmMessage: string;
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

function normalizeText(text: string) {
  return text
    .replace(/[：]/g, ':')
    .replace(/[，]/g, ',')
    .replace(/[〜～]/g, '~')
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

function addCondition(target: ParsedCondition[], label: string, reason: string) {
  if (!target.some((item) => item.label === label)) {
    target.push({ label, reason });
  }
}

function addText(target: string[], value: string) {
  const trimmed = value.trim();

  if (trimmed && !target.includes(trimmed)) {
    target.push(trimmed);
  }
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

  const base = Math.round(Number(manMatch[1]) * 10000);

  if (normalized.includes('초~중반') || normalized.includes('초중반')) return base + 5000;
  if (normalized.includes('중반')) return base + 5000;
  if (normalized.includes('후반')) return base + 8000;
  if (normalized.includes('초반')) return base + 3000;

  return base;
}

function parseLayouts(text: string) {
  const layouts: string[] = [];

  ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK'].forEach((layout) => {
    if (new RegExp(layout, 'i').test(text)) {
      addText(layouts, layout);
    }
  });

  if (text.includes('원룸') || text.includes('ワンルーム')) {
    addText(layouts, '1R');
  }

  return layouts;
}

function parseMinFloor(text: string) {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+)\s*(층|階)\s*이상/);

  return match?.[1] ? Number(match[1]) : null;
}

function parseMaxWalkMinutes(text: string) {
  const normalized = normalizeText(text);

  const stationRangeMatch = normalized.match(/역까지\s*도보\s*(\d+)\s*~\s*(\d+)\s*분/);
  if (stationRangeMatch?.[2]) return Number(stationRangeMatch[2]);

  const rangeMatch = normalized.match(/도보\s*(\d+)\s*~\s*(\d+)\s*분/);
  if (rangeMatch?.[2]) return Number(rangeMatch[2]);

  const withinMatch = normalized.match(/도보\s*(\d+)\s*분\s*이내/);
  if (withinMatch?.[1]) return Number(withinMatch[1]);

  return null;
}

function detectCustomerName(text: string) {
  const rawName = extractLineValue(text, ['이름', '성함', '고객명']);

  if (!rawName) return '미입력';

  return rawName.replace(/\(.+\)/g, '').trim() || '미입력';
}

function detectVisaStatus(text: string) {
  const normalized = normalizeText(text);
  const direct = extractLineValue(text, ['재류자격', '비자', '체류자격']);

  if (direct) return direct;
  if (normalized.includes('워킹홀리데이') || normalized.includes('워홀')) return '워킹홀리데이';
  if (normalized.includes('유학') || normalized.includes('유학생')) return '유학';
  if (normalized.includes('취업비자')) return '취업비자';
  if (normalized.includes('배우자비자') || normalized.includes('배우자 비자')) return '배우자비자';

  return '미입력';
}

function parseInquiry(rawInquiry: string): ParsedRequest {
  const normalized = normalizeText(rawInquiry);
  const customerName = detectCustomerName(rawInquiry);
  const visaStatus = detectVisaStatus(rawInquiry);
  const genderMemo = rawInquiry.includes('남성')
    ? '남성 추정'
    : rawInquiry.includes('여성')
      ? '여성 추정'
      : '미입력';
  const areaMemo = extractLineValue(rawInquiry, ['지역', '희망지역', '희망 지역']) || '미입력';
  const budgetUpper = parseBudget(rawInquiry);
  const layouts = parseLayouts(rawInquiry);
  const minFloor = parseMinFloor(rawInquiry);
  const maxWalkMinutes = parseMaxWalkMinutes(rawInquiry);

  const mustConditions: ParsedCondition[] = [];
  const preferredConditions: ParsedCondition[] = [];
  const ngConditions: ParsedCondition[] = [];
  const checkNeeded: ParsedCondition[] = [];
  const realnetConditions: string[] = [];

  if (budgetUpper) {
    addCondition(
      mustConditions,
      `월세+관리비 ${budgetUpper.toLocaleString()}엔 이하`,
      '고객이 예산 상한을 언급했으므로 총액 기준 필수 조건으로 봅니다.',
    );
    addText(realnetConditions, `賃料+共益費 기준 ${budgetUpper.toLocaleString()}円 이하 희망`);
    addText(realnetConditions, '주의: RealnetPro에서 賃料만 검색하면 共益費 포함 총액 초과 매물이 섞일 수 있음');
  }

  if (layouts.length > 0) {
    addCondition(
      mustConditions,
      `${layouts.join(' / ')} 타입`,
      '희망 간取り가 명확하므로 필수 조건으로 봅니다.',
    );
    addText(realnetConditions, `間取り: ${layouts.join(' / ')}`);
  }

  if (minFloor) {
    addCondition(
      mustConditions,
      `${minFloor}층 이상`,
      '고객이 층수를 명확히 언급했으므로 필수 조건으로 봅니다.',
    );
    addText(realnetConditions, `所在階: ${minFloor}階以上`);
  }

  if (maxWalkMinutes) {
    addCondition(
      mustConditions,
      `역 도보 ${maxWalkMinutes}분 이내`,
      '역까지의 도보 시간이 명확하므로 필수 조건으로 봅니다.',
    );
    addText(realnetConditions, `駅徒歩: ${maxWalkMinutes}分以内`);
  }

  if (normalized.includes('오토록') || normalized.includes('オートロック')) {
    addCondition(mustConditions, '오토록', '공동현관 오토록을 요구하고 있습니다.');
    addText(realnetConditions, '設備: オートロック');
  }

  if (
    normalized.includes('무인택배') ||
    normalized.includes('택배함') ||
    normalized.includes('택배박스') ||
    normalized.includes('宅配box') ||
    normalized.includes('宅配ボックス')
  ) {
    addCondition(mustConditions, '무인택배함 / 宅配BOX', '택배BOX를 요구하고 있습니다.');
    addText(realnetConditions, '設備: 宅配BOX');
  }

  if (
    normalized.includes('철근콘크리트') ||
    normalized.includes('rc') ||
    normalized.includes('src') ||
    normalized.includes('鉄筋')
  ) {
    addCondition(
      mustConditions,
      'RC / SRC / 철근콘크리트 구조',
      '방음과 단열 희망과도 연결되는 주요 조건입니다.',
    );
    addText(realnetConditions, '構造: 鉄筋コンクリート造 / 鉄骨鉄筋コンクリート造 우선');
  }

  if (normalized.includes('도시가스') || normalized.includes('都市ガス')) {
    addCondition(mustConditions, '도시가스', '도시가스를 희망하고 있습니다.');
    addText(realnetConditions, '設備/備考: 都市ガス');
  }

  if (normalized.includes('외국인') || normalized.includes('外国人')) {
    addText(realnetConditions, 'フリーワード: 外国人');
  } else if (
    visaStatus.includes('워킹') ||
    visaStatus.includes('워홀') ||
    visaStatus.includes('유학') ||
    visaStatus.includes('취업')
  ) {
    addText(realnetConditions, 'フリーワード: 外国人');
  }

  if (normalized.includes('프로판') || normalized.includes('プロパン')) {
    addCondition(ngConditions, '프로판가스', '고객이 프로판가스를 제외했습니다.');
    addText(realnetConditions, '除外確認: プロパンガス');
  }

  if (normalized.includes('북향') || normalized.includes('北向')) {
    addCondition(ngConditions, '북향', '고객이 북향을 제외했습니다.');
    addText(realnetConditions, '除外確認: 北向');
  }

  if (normalized.includes('신이마미야')) {
    addCondition(ngConditions, '신이마미야역 주변', '고객이 명확히 제외한 지역입니다.');
    addText(realnetConditions, '除外候補: 新今宮 / 動物園前 / 萩之茶屋 / 西成');
  }

  if (normalized.includes('선로') || normalized.includes('전철')) {
    addCondition(ngConditions, '전철 선로 인접', '소음 우려로 제외 조건에 가깝습니다.');
    addCondition(checkNeeded, '지도상 선로 인접 여부', 'PDF만으로 확정하기 어려워 지도 확인이 필요합니다.');
  }

  if (normalized.includes('시야') || normalized.includes('고층건물') || normalized.includes('차단')) {
    addCondition(ngConditions, '창밖 시야 차단 심한 매물', '고객이 OUT 조건으로 언급했습니다.');
    addCondition(checkNeeded, '창밖 시야 / 맞은편 고층건물 여부', '사진, 스트리트뷰, 내견으로 확인해야 합니다.');
  }

  if (normalized.includes('24시간') && (normalized.includes('분리수거') || normalized.includes('쓰레기'))) {
    addCondition(preferredConditions, '24시간 쓰레기 배출 / 분리수거 가능', '관리규약 확인이 필요한 선호 조건입니다.');
    addCondition(checkNeeded, '24시간 쓰레기 배출 가능 여부', '물건 정보에 없으면 관리회사 확인이 필요합니다.');
  }

  if (normalized.includes('벌레')) {
    addCondition(preferredConditions, '벌레 리스크가 낮은 건물', '층수, 주변 음식점, 쓰레기장 위치, 건물 관리상태를 함께 봐야 합니다.');
    addCondition(checkNeeded, '벌레 발생 리스크', '완전 보장은 어렵고 주변 환경 확인이 필요합니다.');
  }

  if (normalized.includes('방음')) {
    addCondition(preferredConditions, '방음이 비교적 좋은 매물', 'RC/SRC, 선로·대로변 인접 여부를 함께 봐야 합니다.');
    addCondition(checkNeeded, '방음 수준', '구조만으로 확정할 수 없어 내견 확인이 필요합니다.');
  }

  if (normalized.includes('따뜻')) {
    addCondition(preferredConditions, '겨울에 비교적 따뜻한 방', '향, 층수, 단열, 창 상태를 확인해야 합니다.');
    addCondition(checkNeeded, '겨울철 단열/채광', '내견과 지도 확인이 필요합니다.');
  }

  if (normalized.includes('가스레인지') || normalized.includes('화구') || normalized.includes('コンロ')) {
    addCondition(preferredConditions, '가스레인지 기본 옵션 / 가능하면 2구', '설비란 또는 관리회사 확인이 필요합니다.');
    addCondition(checkNeeded, '가스레인지 기본 옵션 및 2구 여부', '도면·설비 정보·관리회사 확인이 필요합니다.');
  }

  if (normalized.includes('치안')) {
    addCondition(preferredConditions, '치안이 괜찮은 생활권', '야간 동선과 역 주변 분위기 확인이 필요합니다.');
    addCondition(checkNeeded, '치안 및 야간 귀가 동선', '지도와 현장감 기준으로 확인해야 합니다.');
  }

  if (normalized.includes('편의점') || normalized.includes('마트') || normalized.includes('약국')) {
    addCondition(preferredConditions, '편의점 / 마트 / 약국 근처', '생활 편의시설 접근성을 선호합니다.');
    addCondition(checkNeeded, '주변 편의시설', '지도에서 편의점, 슈퍼, 드럭스토어를 확인해야 합니다.');
  }

  if (
    visaStatus.includes('워킹') ||
    visaStatus.includes('워홀') ||
    visaStatus.includes('워킹홀리데이')
  ) {
    addCondition(
      checkNeeded,
      '외국인 계약 가능 여부 / 워홀 1년 심사 가능 여부',
      '外国人契約可能이어도 워킹홀리데이 1년 체류 심사는 별도 확인이 필요합니다.',
    );
  }

  const chatGptPrompt = buildChatGptPrompt({
    customerName,
    genderMemo,
    visaStatus,
    areaMemo,
    budgetUpper,
    layouts,
    minFloor,
    maxWalkMinutes,
    mustConditions,
    preferredConditions,
    ngConditions,
    checkNeeded,
  });

  const customerConfirmMessage = buildCustomerConfirmMessage({
    customerName,
    visaStatus,
    budgetUpper,
    layouts,
    minFloor,
    maxWalkMinutes,
    mustConditions,
    preferredConditions,
    ngConditions,
    checkNeeded,
  });

  return {
    customerName,
    genderMemo,
    visaStatus,
    areaMemo,
    budgetUpper,
    layouts,
    minFloor,
    maxWalkMinutes,
    mustConditions,
    preferredConditions,
    ngConditions,
    checkNeeded,
    realnetConditions,
    chatGptPrompt,
    customerConfirmMessage,
  };
}

function buildConditionLines(conditions: ParsedCondition[]) {
  if (conditions.length === 0) return '- 특별히 추출된 조건 없음';

  return conditions.map((condition) => `- ${condition.label}`).join('\n');
}

function buildChatGptPrompt(parsed: Omit<ParsedRequest, 'realnetConditions' | 'chatGptPrompt' | 'customerConfirmMessage'>) {
  return `아래 고객 조건과 첨부한 RealnetPro PDF를 기준으로 매물을 분석해주세요.

[중요]
- PDF는 RealnetPro/リアプロ의 검색 결과 PDF입니다.
- PDF 안의 매물을 가능한 많이 읽고, 고객 조건에 맞는 순서대로 정리해주세요.
- 월세는 반드시 "賃料 + 共益費/管理費" 합계 기준으로 판단해주세요.
- "賃料만 70,000~75,000円"이어도 共益費 포함 총액이 고객 상한을 넘으면 탈락입니다.
- PDF만으로 판단하기 어려운 항목은 추정하지 말고 "확인 필요"로 분류해주세요.

[고객 기본 정보]
- 고객명: ${parsed.customerName}
- 성별/메모: ${parsed.genderMemo}
- 재류자격: ${parsed.visaStatus}
- 희망 지역 메모: ${parsed.areaMemo}
- 월세+관리비 상한: ${parsed.budgetUpper ? `${parsed.budgetUpper.toLocaleString()}엔 이하` : '미확인'}
- 희망 타입: ${parsed.layouts.length ? parsed.layouts.join(' / ') : '미확인'}
- 최소 층수: ${parsed.minFloor ? `${parsed.minFloor}층 이상` : '미확인'}
- 역 도보: ${parsed.maxWalkMinutes ? `${parsed.maxWalkMinutes}분 이내` : '미확인'}

[필수 조건]
${buildConditionLines(parsed.mustConditions)}

[선호 조건]
${buildConditionLines(parsed.preferredConditions)}

[NG / 제외 조건]
${buildConditionLines(parsed.ngConditions)}

[확인 필요 조건]
${buildConditionLines(parsed.checkNeeded)}

[분석 기준]
1. 매물별로 아래 항목을 추출해주세요.
   - 매물명
   - 호실
   - 주소
   - 노선/역/도보분수
   - 월세
   - 관리비/共益費
   - 월세+관리비 총액
   - 間取り
   - 면적
   - 층수
   - 구조
   - 축년수
   - 향
   - 가스 종류
   - 오토록
   - 宅配BOX
   - 外国人契約可能 여부
   - 기타 설비/비고

2. 매물을 아래 4단계로 분류해주세요.
   - A추천: 주요 필수조건을 대부분 충족하고 고객에게 우선 제안 가능
   - B후보: 핵심 조건은 맞지만 일부 확인 필요
   - C확인필요: 나쁘지 않지만 확인 항목이 많음
   - 탈락: 예산 초과, 타입 불일치, 층수 불일치, 프로판가스, 북향, 제외지역 등 명확한 NG

3. 탈락 매물도 중요한 경우에는 탈락 사유를 짧게 정리해주세요.

4. 출력 형식은 아래 순서로 해주세요.
   1) 전체 요약
   2) A추천 표
   3) B후보 표
   4) C확인필요 표
   5) 탈락 주요 사유 요약
   6) 관리회사에 확인해야 할 항목
   7) 고객에게 보낼 수 있는 안내문 초안

[표 형식]
추천도 | 매물명/호실 | 월세+관리비 | 역/도보 | 타입/면적 | 층수/향 | 구조/가스 | 장점 | 확인 필요/탈락 사유

위 기준으로 첨부 PDF를 분석해주세요.`;
}

function buildCustomerConfirmMessage(parsed: Pick<
  ParsedRequest,
  | 'customerName'
  | 'visaStatus'
  | 'budgetUpper'
  | 'layouts'
  | 'minFloor'
  | 'maxWalkMinutes'
  | 'mustConditions'
  | 'preferredConditions'
  | 'ngConditions'
  | 'checkNeeded'
>) {
  const lines: string[] = [];

  lines.push(`${parsed.customerName} 고객님 조건을 아래와 같이 정리했습니다.`);
  lines.push('');
  lines.push('[기본 조건]');
  lines.push(`- 재류자격: ${parsed.visaStatus}`);
  lines.push(`- 월세+관리비 상한: ${parsed.budgetUpper ? `${parsed.budgetUpper.toLocaleString()}엔 이하` : '확인 필요'}`);
  lines.push(`- 희망 타입: ${parsed.layouts.length ? parsed.layouts.join(' / ') : '확인 필요'}`);
  lines.push(`- 층수: ${parsed.minFloor ? `${parsed.minFloor}층 이상` : '확인 필요'}`);
  lines.push(`- 역 도보: ${parsed.maxWalkMinutes ? `${parsed.maxWalkMinutes}분 이내` : '확인 필요'}`);
  lines.push('');
  lines.push('[필수 조건]');
  lines.push(buildConditionLines(parsed.mustConditions));
  lines.push('');
  lines.push('[선호 조건]');
  lines.push(buildConditionLines(parsed.preferredConditions));
  lines.push('');
  lines.push('[제외 조건]');
  lines.push(buildConditionLines(parsed.ngConditions));
  lines.push('');
  lines.push('[확인 필요]');
  lines.push(buildConditionLines(parsed.checkNeeded));
  lines.push('');
  lines.push('위 조건을 기준으로 우선 필수 조건에 가까운 매물을 먼저 확인하고, PDF만으로 확정이 어려운 항목은 관리회사 확인 후 안내드리겠습니다.');

  return lines.join('\n');
}

export default function PropertyAiSearch() {
  const [rawInquiry, setRawInquiry] = useState(sampleInquiry);
  const [copiedLabel, setCopiedLabel] = useState('');

  const parsed = useMemo(() => parseInquiry(rawInquiry), [rawInquiry]);

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
          <p style={styles.eyebrow}>Osaka J Internal Tool</p>
          <h1 style={styles.title}>AI 매물 검색 어시스턴트</h1>
          <p style={styles.description}>
            고객 조건을 정리하고, ChatGPT에 붙여넣을 PDF 분석용 프롬프트를 생성합니다.
            RealnetPro PDF는 이 ChatGPT 대화창에 직접 업로드해서 분석하는 반자동 방식입니다.
          </p>
        </div>

        <div style={styles.statusBox}>
          <span style={styles.statusDot} />
          <div>
            <strong>반자동 분석 모드</strong>
            <p>API 비용 없이, 이 화면에서 프롬프트를 만든 뒤 ChatGPT 대화창에 PDF와 함께 붙여넣습니다.</p>
          </div>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>1. 고객 문의 내용</h2>
            <p style={styles.panelSubText}>고객이 보낸 카톡, LINE, 이메일 내용을 그대로 붙여넣으세요.</p>
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
            <p style={styles.panelSubText}>고객명, 비자, 예산, 타입, 층수, 역 도보 조건을 자동 정리합니다.</p>
          </div>

          <div style={styles.infoGrid}>
            <InfoItem label="고객명" value={parsed.customerName} />
            <InfoItem label="성별/메모" value={parsed.genderMemo} />
            <InfoItem label="재류자격" value={parsed.visaStatus} />
            <InfoItem label="지역 메모" value={parsed.areaMemo} />
            <InfoItem
              label="월세+관리비 상한"
              value={parsed.budgetUpper ? `${parsed.budgetUpper.toLocaleString()}엔` : '미확인'}
            />
            <InfoItem
              label="희망 타입"
              value={parsed.layouts.length ? parsed.layouts.join(' / ') : '미확인'}
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
        <ConditionPanel title="필수 조건" tone="must" conditions={parsed.mustConditions} />
        <ConditionPanel title="선호 조건" tone="preferred" conditions={parsed.preferredConditions} />
        <ConditionPanel title="NG 조건" tone="ng" conditions={parsed.ngConditions} />
        <ConditionPanel title="확인 필요" tone="check" conditions={parsed.checkNeeded} />
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeaderRow}>
          <div>
            <h2 style={styles.panelTitle}>3. ChatGPT PDF 분석용 프롬프트</h2>
            <p style={styles.panelSubText}>
              아래 문구를 복사한 뒤, 이 ChatGPT 대화창에 붙여넣고 RealnetPro PDF를 함께 업로드하세요.
            </p>
          </div>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => copyText('prompt', parsed.chatGptPrompt)}
          >
            {copiedLabel === 'prompt' ? '복사 완료' : '프롬프트 복사'}
          </button>
        </div>

        <textarea style={styles.promptTextarea} value={parsed.chatGptPrompt} readOnly />

        <div style={styles.noticeBox}>
          <strong>사용 순서</strong>
          <ol>
            <li>RealnetPro에서 조건 검색 후 「検索結果 PDF出力」로 PDF를 저장합니다.</li>
            <li>위 프롬프트를 복사합니다.</li>
            <li>ChatGPT 대화창에 프롬프트를 붙여넣고 PDF를 업로드합니다.</li>
            <li>ChatGPT가 A추천/B후보/C확인필요/탈락과 고객 발송문을 정리합니다.</li>
          </ol>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>4. RealnetPro 검색 조건 후보</h2>
              <p style={styles.panelSubText}>PDF 출력 전 RealnetPro에서 입력하면 좋은 조건입니다.</p>
            </div>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => copyText('realnet', parsed.realnetConditions.join('\n'))}
            >
              {copiedLabel === 'realnet' ? '복사 완료' : '조건 복사'}
            </button>
          </div>

          <div style={styles.searchList}>
            {parsed.realnetConditions.length ? (
              parsed.realnetConditions.map((item) => (
                <div key={item} style={styles.searchItem}>
                  {item}
                </div>
              ))
            ) : (
              <p style={styles.emptyText}>자동 추출된 검색 조건이 없습니다.</p>
            )}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>5. 고객 조건 확인용 안내문</h2>
              <p style={styles.panelSubText}>고객에게 조건 확인용으로 보낼 수 있는 초안입니다.</p>
            </div>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => copyText('customer', parsed.customerConfirmMessage)}
            >
              {copiedLabel === 'customer' ? '복사 완료' : '안내문 복사'}
            </button>
          </div>

          <textarea style={styles.outputTextarea} value={parsed.customerConfirmMessage} readOnly />
        </div>
      </section>

      <section style={styles.warningBox}>
        <strong>정리</strong>
        <p>
          이 화면은 더 이상 OpenAI API를 호출하지 않습니다. 따라서 API 비용이 발생하지 않습니다.
          RealnetPro PDF 분석은 ChatGPT 대화창에서 직접 PDF를 업로드해 진행합니다.
          기존 서버 함수 <code>functions/api/analyze-property-pdf.ts</code>는 삭제해도 됩니다.
        </p>
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

      {conditions.length ? (
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
    width: '100%',
    maxWidth: '1180px',
    minHeight: '100vh',
    margin: '0 auto',
    padding: '0 16px 40px',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    color: '#241d18',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '18px',
    alignItems: 'start',
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
    maxWidth: '560px',
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
    background: '#22c55e',
    marginTop: '5px',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '20px',
    marginBottom: '20px',
    alignItems: 'start',
    width: '100%',
  },
  panel: {
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #eadfd4',
    borderRadius: '24px',
    padding: '22px',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.18)',
    marginBottom: '20px',
  },
  panelHeader: {
    marginBottom: '16px',
  },
  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
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
    minHeight: '360px',
    maxHeight: '520px',
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
    overflowY: 'auto',
  },
  promptTextarea: {
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
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
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
    minHeight: '240px',
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
  searchList: {
    display: 'grid',
    gap: '10px',
  },
  searchItem: {
    padding: '13px',
    borderRadius: '14px',
    border: '1px solid #eadfd4',
    background: '#fffaf5',
    fontSize: '14px',
    fontWeight: 700,
    color: '#51463d',
  },
  noticeBox: {
    marginTop: '16px',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #c7d7ff',
    background: '#eef3ff',
    lineHeight: 1.7,
  },
  warningBox: {
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #ead2a8',
    background: '#fff8dc',
    lineHeight: 1.7,
    color: '#241d18',
  },
  emptyText: {
    margin: 0,
    color: '#8a7b70',
    lineHeight: 1.6,
  },
};

