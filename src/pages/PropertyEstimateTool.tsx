import { useMemo, useState, type CSSProperties } from 'react';

type InitialRentMode = 'oneMonth' | 'prorated' | 'proratedPlusNextMonth';

type EstimateItem = {
  id: string;
  label: string;
  amount: number;
  memo: string;
  taxable: boolean;
};

type PropertyForm = {
  customerName: string;
  propertyName: string;
  roomNo: string;
  address: string;
  nearestStation: string;
  layout: string;
  area: string;
  structure: string;
  builtYear: string;
  floor: string;
  direction: string;
  moveInDate: string;
  initialRentMode: InitialRentMode;
  rent: number;
  managementFee: number;
  deposit: number;
  keyMoney: number;
  guaranteeDeposit: number;
  guaranteeCompanyFee: number;
  fireInsurance: number;
  keyExchange: number;
  cleaningFee: number;
  supportFee: number;
  contractAdminFee: number;
  agencyFee: number;
  otherFeeName: string;
  otherFee: number;
  monthlyOtherName: string;
  monthlyOtherFee: number;
  estimateMemo: string;
};

const defaultForm: PropertyForm = {
  customerName: '',
  propertyName: '',
  roomNo: '',
  address: '',
  nearestStation: '',
  layout: '',
  area: '',
  structure: '',
  builtYear: '',
  floor: '',
  direction: '',
  moveInDate: '',
  initialRentMode: 'oneMonth',
  rent: 0,
  managementFee: 0,
  deposit: 0,
  keyMoney: 0,
  guaranteeDeposit: 0,
  guaranteeCompanyFee: 0,
  fireInsurance: 0,
  keyExchange: 0,
  cleaningFee: 0,
  supportFee: 0,
  contractAdminFee: 0,
  agencyFee: 0,
  otherFeeName: '기타 비용',
  otherFee: 0,
  monthlyOtherName: '기타 월액',
  monthlyOtherFee: 0,
  estimateMemo:
    '본 견적은 현재 확인 가능한 자료를 기준으로 작성한 개산 견적입니다. 관리회사 심사 결과, 입주일, 보증회사 조건, 계약 조건에 따라 금액이 변동될 수 있습니다.',
};

const sampleForm: PropertyForm = {
  customerName: '성요한',
  propertyName: 'CITY SPIRE北梅田',
  roomNo: '302',
  address: '大阪市北区中津4丁目4-16',
  nearestStation: '阪急宝塚線「中津」徒歩4分',
  layout: '1K',
  area: '24㎡',
  structure: '鉄筋コンクリート造',
  builtYear: '2009年03月築',
  floor: '3階',
  direction: '東向',
  moveInDate: '',
  initialRentMode: 'oneMonth',
  rent: 82000,
  managementFee: 10000,
  deposit: 0,
  keyMoney: 82000,
  guaranteeDeposit: 0,
  guaranteeCompanyFee: 55200,
  fireInsurance: 18000,
  keyExchange: 22000,
  cleaningFee: 33000,
  supportFee: 16500,
  contractAdminFee: 11000,
  agencyFee: 90200,
  otherFeeName: '기타 비용',
  otherFee: 0,
  monthlyOtherName: '기타 월액',
  monthlyOtherFee: 0,
  estimateMemo:
    '본 견적은 현재 확인 가능한 자료를 기준으로 작성한 개산 견적입니다. 관리회사 심사 결과, 입주일, 보증회사 조건, 계약 조건에 따라 금액이 변동될 수 있습니다.',
};

function yen(value: number) {
  if (!Number.isFinite(value)) return '0円';
  return `${Math.max(0, Math.round(value)).toLocaleString()}円`;
}

function numberValue(value: string) {
  const numeric = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function getMoveInProration(moveInDate: string, monthlyAmount: number) {
  if (!moveInDate || monthlyAmount <= 0) {
    return {
      daysInMonth: 0,
      chargeDays: 0,
      amount: 0,
      isValid: false,
    };
  }

  const date = new Date(`${moveInDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return {
      daysInMonth: 0,
      chargeDays: 0,
      amount: 0,
      isValid: false,
    };
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const chargeDays = Math.max(0, daysInMonth - day + 1);
  const amount = Math.round((monthlyAmount / daysInMonth) * chargeDays);

  return {
    daysInMonth,
    chargeDays,
    amount,
    isValid: true,
  };
}

function getInitialRentItems(form: PropertyForm): EstimateItem[] {
  const rentProration = getMoveInProration(form.moveInDate, form.rent);
  const managementProration = getMoveInProration(form.moveInDate, form.managementFee);

  if (form.initialRentMode === 'prorated' && rentProration.isValid) {
    return [
      {
        id: 'proratedRent',
        label: '日割家賃 / 일할 월세',
        amount: rentProration.amount,
        memo: `${rentProration.daysInMonth}일 중 ${rentProration.chargeDays}일분`,
        taxable: false,
      },
      {
        id: 'proratedManagementFee',
        label: '日割共益費 / 일할 관리비',
        amount: managementProration.amount,
        memo: `${managementProration.daysInMonth}일 중 ${managementProration.chargeDays}일분`,
        taxable: false,
      },
    ].filter((item) => item.amount > 0);
  }

  if (form.initialRentMode === 'proratedPlusNextMonth' && rentProration.isValid) {
    return [
      {
        id: 'proratedRent',
        label: '日割家賃 / 일할 월세',
        amount: rentProration.amount,
        memo: `${rentProration.daysInMonth}일 중 ${rentProration.chargeDays}일분`,
        taxable: false,
      },
      {
        id: 'proratedManagementFee',
        label: '日割共益費 / 일할 관리비',
        amount: managementProration.amount,
        memo: `${managementProration.daysInMonth}일 중 ${managementProration.chargeDays}일분`,
        taxable: false,
      },
      { id: 'nextMonthRent', label: '翌月家賃 / 익월 월세', amount: form.rent, memo: '다음달 1개월분', taxable: false },
      {
        id: 'nextMonthManagementFee',
        label: '翌月共益費 / 익월 관리비',
        amount: form.managementFee,
        memo: '다음달 1개월분',
        taxable: false,
      },
    ].filter((item) => item.amount > 0);
  }

  return [
    { id: 'rent', label: '前家賃 / 월세', amount: form.rent, memo: '1개월분 기준', taxable: false },
    {
      id: 'managementFee',
      label: '共益費・管理費 / 관리비',
      amount: form.managementFee,
      memo: '1개월분 기준',
      taxable: false,
    },
  ].filter((item) => item.amount > 0);
}

function buildItems(form: PropertyForm): EstimateItem[] {
  return [
    ...getInitialRentItems(form),
    { id: 'monthlyOtherFee', label: form.monthlyOtherName || '기타 월액', amount: form.monthlyOtherFee, memo: '월액 비용', taxable: false },
    { id: 'deposit', label: '敷金 / 보증금', amount: form.deposit, memo: '계약 종료 시 정산 대상', taxable: false },
    { id: 'keyMoney', label: '礼金 / 사례금', amount: form.keyMoney, memo: '반환 없음', taxable: false },
    { id: 'guaranteeDeposit', label: '保証金 / 보증금', amount: form.guaranteeDeposit, memo: '조건 확인 필요', taxable: false },
    {
      id: 'guaranteeCompanyFee',
      label: '保証会社 初回保証料 / 보증회사 비용',
      amount: form.guaranteeCompanyFee,
      memo: '보증회사 심사 조건에 따라 변동 가능',
      taxable: false,
    },
    { id: 'fireInsurance', label: '火災保険 / 화재보험', amount: form.fireInsurance, memo: '보험사/기간 확인 필요', taxable: false },
    { id: 'keyExchange', label: '鍵交換代 / 열쇠교환비', amount: form.keyExchange, memo: '세금 포함 여부 확인 필요', taxable: true },
    { id: 'cleaningFee', label: '退去時清掃費 / 청소비', amount: form.cleaningFee, memo: '입주시 또는 퇴거시 청구 여부 확인', taxable: true },
    { id: 'supportFee', label: '24時間サポート / 24시간 서포트', amount: form.supportFee, memo: '가입 필수 여부 확인', taxable: true },
    { id: 'contractAdminFee', label: '契約事務手数料 / 계약사무수수료', amount: form.contractAdminFee, memo: '관리회사 조건 확인', taxable: true },
    { id: 'agencyFee', label: '仲介手数料 / 중개수수료', amount: form.agencyFee, memo: '세금 포함 기준으로 입력 권장', taxable: true },
    { id: 'otherFee', label: form.otherFeeName || '기타 비용', amount: form.otherFee, memo: '기타 확인 비용', taxable: false },
  ].filter((item) => item.amount > 0);
}

function buildCustomerMessage(form: PropertyForm, total: number, monthlyTotal: number) {
  const roomLabel = [form.propertyName, form.roomNo ? `${form.roomNo}호` : ''].filter(Boolean).join(' ');

  return `${form.customerName ? `${form.customerName} 고객님, ` : ''}요청하신 매물의 초기비용 개산 견적을 아래와 같이 안내드립니다.

[매물 정보]
- 매물명: ${roomLabel || '확인 필요'}
- 주소: ${form.address || '확인 필요'}
- 교통: ${form.nearestStation || '확인 필요'}
- 타입/면적: ${[form.layout, form.area].filter(Boolean).join(' / ') || '확인 필요'}
- 구조/축년: ${[form.structure, form.builtYear].filter(Boolean).join(' / ') || '확인 필요'}
- 층수/향: ${[form.floor, form.direction].filter(Boolean).join(' / ') || '확인 필요'}
- 입주 예정일: ${form.moveInDate || '확인 필요'}

[월액 비용]
- 월세: ${yen(form.rent)}
- 관리비/공익비: ${yen(form.managementFee)}
${form.monthlyOtherFee > 0 ? `- ${form.monthlyOtherName}: ${yen(form.monthlyOtherFee)}\n` : ''}- 월액 합계: ${yen(monthlyTotal)}

[초기비용 개산]
- 초기비용 합계: ${yen(total)}

※ 본 견적은 현재 확인 가능한 자료를 기준으로 작성한 개산 견적입니다.
※ 입주일, 보증회사 심사 결과, 관리회사 조건, 옵션 가입 여부에 따라 금액이 변동될 수 있습니다.
※ 최종 금액은 관리회사 확인 후 확정됩니다.`;
}

function buildPropertyIntro(form: PropertyForm) {
  const roomLabel = [form.propertyName, form.roomNo ? `${form.roomNo}호` : ''].filter(Boolean).join(' ');

  return `${roomLabel || '추천 매물'} 안내자료

[기본 정보]
- 주소: ${form.address || '확인 필요'}
- 교통: ${form.nearestStation || '확인 필요'}
- 타입: ${form.layout || '확인 필요'}
- 면적: ${form.area || '확인 필요'}
- 구조: ${form.structure || '확인 필요'}
- 축년: ${form.builtYear || '확인 필요'}
- 층수: ${form.floor || '확인 필요'}
- 향: ${form.direction || '확인 필요'}
- 입주 가능일: ${form.moveInDate || '확인 필요'}

[비용]
- 월세: ${yen(form.rent)}
- 관리비/공익비: ${yen(form.managementFee)}
- 월액 합계: ${yen(form.rent + form.managementFee + form.monthlyOtherFee)}

[추천 포인트]
- 고객 조건에 맞는지 확인 후 기재하세요.
- 역 접근성, 건물 구조, 설비, 방향, 층수, 주변 환경을 중심으로 안내하면 좋습니다.

[확인 필요사항]
- 외국인/재류자격 심사 가능 여부
- 보증회사 조건
- 입주 가능일
- 24시간 쓰레기 배출 가능 여부
- 인터넷/수도/기타 월액 비용
- 단기해약 위약금
`;
}

export default function PropertyEstimateTool() {
  const [form, setForm] = useState<PropertyForm>(defaultForm);
  const [copied, setCopied] = useState('');

  const items = useMemo(() => buildItems(form), [form]);
  const initialTotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const monthlyTotal = form.rent + form.managementFee + form.monthlyOtherFee;
  const proration = useMemo(() => getMoveInProration(form.moveInDate, form.rent + form.managementFee), [form.moveInDate, form.rent, form.managementFee]);
  const customerMessage = useMemo(() => buildCustomerMessage(form, initialTotal, monthlyTotal), [form, initialTotal, monthlyTotal]);
  const propertyIntro = useMemo(() => buildPropertyIntro(form), [form]);

  const update = (key: keyof PropertyForm, value: string) => {
    const numericKeys: Array<keyof PropertyForm> = [
      'rent',
      'managementFee',
      'deposit',
      'keyMoney',
      'guaranteeDeposit',
      'guaranteeCompanyFee',
      'fireInsurance',
      'keyExchange',
      'cleaningFee',
      'supportFee',
      'contractAdminFee',
      'agencyFee',
      'otherFee',
      'monthlyOtherFee',
    ];

    setForm((current) => ({
      ...current,
      [key]: numericKeys.includes(key) ? numberValue(value) : value,
    }));
  };

  const setInitialRentMode = (mode: InitialRentMode) => {
    setForm((current) => ({ ...current, initialRentMode: mode }));
  };

  const applyGuaranteeFee = (rate: number) => {
    const base = form.rent + form.managementFee + form.monthlyOtherFee;
    setForm((current) => ({
      ...current,
      guaranteeCompanyFee: Math.round(base * rate),
    }));
  };

  const applyAgencyFee = (rate: number, includeTax = true) => {
    const taxRate = includeTax ? 1.1 : 1;
    setForm((current) => ({
      ...current,
      agencyFee: Math.round(form.rent * rate * taxRate),
    }));
  };

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      alert('복사에 실패했습니다. 직접 드래그해서 복사해주세요.');
    }
  };

  const printEstimate = () => {
    window.print();
  };

  return (
    <section style={styles.wrapper}>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Osaka J Internal Tool</p>
        <h1 style={styles.title}>추천 매물 자료 생성</h1>
        <p style={styles.description}>
          관리회사 공식 PDF를 보면서 주요 금액을 입력하면 초기비용 개산 견적서와 고객용 매물 소개자료를 생성합니다.
          이번 단계에서는 일할계산, 보증회사 비용 자동계산, 중개수수료 자동계산을 추가했습니다.
        </p>
      </section>

      <section style={styles.toolbar}>
        <button type="button" style={styles.secondaryButton} onClick={() => setForm(sampleForm)}>
          샘플 입력
        </button>
        <button type="button" style={styles.secondaryButton} onClick={() => setForm(defaultForm)}>
          전체 초기화
        </button>
        <button type="button" style={styles.primaryButton} onClick={printEstimate}>
          인쇄 / PDF 저장
        </button>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>1. 고객 / 매물 기본정보</h2>

          <div style={styles.formGrid}>
            <TextInput label="고객명" value={form.customerName} onChange={(value) => update('customerName', value)} />
            <TextInput label="매물명" value={form.propertyName} onChange={(value) => update('propertyName', value)} />
            <TextInput label="호실" value={form.roomNo} onChange={(value) => update('roomNo', value)} />
            <TextInput label="주소" value={form.address} onChange={(value) => update('address', value)} />
            <TextInput label="가까운 역 / 도보" value={form.nearestStation} onChange={(value) => update('nearestStation', value)} />
            <DateInput label="입주 예정일" value={form.moveInDate} onChange={(value) => update('moveInDate', value)} />
            <TextInput label="타입" value={form.layout} onChange={(value) => update('layout', value)} />
            <TextInput label="면적" value={form.area} onChange={(value) => update('area', value)} />
            <TextInput label="구조" value={form.structure} onChange={(value) => update('structure', value)} />
            <TextInput label="축년" value={form.builtYear} onChange={(value) => update('builtYear', value)} />
            <TextInput label="층수" value={form.floor} onChange={(value) => update('floor', value)} />
            <TextInput label="향" value={form.direction} onChange={(value) => update('direction', value)} />
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>2. 비용 입력</h2>

          <div style={styles.formGrid}>
            <MoneyInput label="월세 / 賃料" value={form.rent} onChange={(value) => update('rent', value)} />
            <MoneyInput label="관리비 / 共益費" value={form.managementFee} onChange={(value) => update('managementFee', value)} />
            <MoneyInput label="敷金" value={form.deposit} onChange={(value) => update('deposit', value)} />
            <MoneyInput label="礼金" value={form.keyMoney} onChange={(value) => update('keyMoney', value)} />
            <MoneyInput label="保証金" value={form.guaranteeDeposit} onChange={(value) => update('guaranteeDeposit', value)} />
            <MoneyInput label="保証会社 初回保証料" value={form.guaranteeCompanyFee} onChange={(value) => update('guaranteeCompanyFee', value)} />
            <MoneyInput label="火災保険" value={form.fireInsurance} onChange={(value) => update('fireInsurance', value)} />
            <MoneyInput label="鍵交換代" value={form.keyExchange} onChange={(value) => update('keyExchange', value)} />
            <MoneyInput label="退去時清掃費 / 청소비" value={form.cleaningFee} onChange={(value) => update('cleaningFee', value)} />
            <MoneyInput label="24時間サポート" value={form.supportFee} onChange={(value) => update('supportFee', value)} />
            <MoneyInput label="契約事務手数料" value={form.contractAdminFee} onChange={(value) => update('contractAdminFee', value)} />
            <MoneyInput label="仲介手数料" value={form.agencyFee} onChange={(value) => update('agencyFee', value)} />
            <TextInput label="기타 비용명" value={form.otherFeeName} onChange={(value) => update('otherFeeName', value)} />
            <MoneyInput label="기타 비용" value={form.otherFee} onChange={(value) => update('otherFee', value)} />
            <TextInput label="기타 월액명" value={form.monthlyOtherName} onChange={(value) => update('monthlyOtherName', value)} />
            <MoneyInput label="기타 월액" value={form.monthlyOtherFee} onChange={(value) => update('monthlyOtherFee', value)} />
          </div>
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>3. 자동 계산 보조</h2>

        <div style={styles.helperGrid}>
          <div style={styles.helperCard}>
            <h3 style={styles.helperTitle}>초기 월세 계산 방식</h3>
            <p style={styles.helperText}>
              입주 예정일을 입력하면 일할 계산이 가능합니다. 관리회사 견적 기준과 다를 수 있으므로 최종 확인이 필요합니다.
            </p>
            <div style={styles.segmentRow}>
              <button
                type="button"
                style={form.initialRentMode === 'oneMonth' ? styles.segmentActive : styles.segmentButton}
                onClick={() => setInitialRentMode('oneMonth')}
              >
                1개월분
              </button>
              <button
                type="button"
                style={form.initialRentMode === 'prorated' ? styles.segmentActive : styles.segmentButton}
                onClick={() => setInitialRentMode('prorated')}
              >
                일할만
              </button>
              <button
                type="button"
                style={form.initialRentMode === 'proratedPlusNextMonth' ? styles.segmentActive : styles.segmentButton}
                onClick={() => setInitialRentMode('proratedPlusNextMonth')}
              >
                일할+익월
              </button>
            </div>
            <p style={styles.helperResult}>
              {proration.isValid
                ? `입주월 기준: ${proration.daysInMonth}일 중 ${proration.chargeDays}일분 / 월세+관리비 일할 ${yen(proration.amount)}`
                : '입주 예정일을 입력하면 일할 금액이 표시됩니다.'}
            </p>
          </div>

          <div style={styles.helperCard}>
            <h3 style={styles.helperTitle}>보증회사 비용 자동계산</h3>
            <p style={styles.helperText}>월세+관리비+기타 월액을 기준으로 계산합니다.</p>
            <div style={styles.buttonWrap}>
              <button type="button" style={styles.secondaryButton} onClick={() => applyGuaranteeFee(0.3)}>
                30%
              </button>
              <button type="button" style={styles.secondaryButton} onClick={() => applyGuaranteeFee(0.5)}>
                50%
              </button>
              <button type="button" style={styles.secondaryButton} onClick={() => applyGuaranteeFee(1)}>
                100%
              </button>
            </div>
          </div>

          <div style={styles.helperCard}>
            <h3 style={styles.helperTitle}>중개수수료 자동계산</h3>
            <p style={styles.helperText}>월세 기준으로 계산하며, 버튼은 소비세 10% 포함 금액으로 입력합니다.</p>
            <div style={styles.buttonWrap}>
              <button type="button" style={styles.secondaryButton} onClick={() => applyAgencyFee(0.5, true)}>
                0.5개월+세금
              </button>
              <button type="button" style={styles.secondaryButton} onClick={() => applyAgencyFee(1, true)}>
                1개월+세금
              </button>
              <button type="button" style={styles.secondaryButton} onClick={() => applyAgencyFee(0, true)}>
                0円
              </button>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span>월액 합계</span>
          <strong>{yen(monthlyTotal)}</strong>
        </div>
        <div style={styles.summaryCard}>
          <span>초기비용 개산 합계</span>
          <strong>{yen(initialTotal)}</strong>
        </div>
        <div style={styles.summaryCard}>
          <span>입력된 비용 항목</span>
          <strong>{items.length}개</strong>
        </div>
      </section>

      <section style={styles.panel} className="estimate-print-area">
        <div style={styles.printHeader}>
          <div>
            <p style={styles.eyebrowDark}>初期費用概算書</p>
            <h2 style={styles.estimateTitle}>초기비용 개산 견적서</h2>
          </div>
          <div style={styles.printMeta}>
            <p>작성일: {new Date().toLocaleDateString('ja-JP')}</p>
            <p>Osaka J Real Estate</p>
          </div>
        </div>

        <div style={styles.propertyBox}>
          <InfoLine label="고객명" value={form.customerName || '-'} />
          <InfoLine label="매물명" value={[form.propertyName, form.roomNo ? `${form.roomNo}호` : ''].filter(Boolean).join(' ') || '-'} />
          <InfoLine label="주소" value={form.address || '-'} />
          <InfoLine label="교통" value={form.nearestStation || '-'} />
          <InfoLine label="타입/면적" value={[form.layout, form.area].filter(Boolean).join(' / ') || '-'} />
          <InfoLine label="구조/축년" value={[form.structure, form.builtYear].filter(Boolean).join(' / ') || '-'} />
          <InfoLine label="층수/향" value={[form.floor, form.direction].filter(Boolean).join(' / ') || '-'} />
          <InfoLine label="입주 예정일" value={form.moveInDate || '-'} />
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>항목</th>
                <th style={styles.thRight}>금액</th>
                <th style={styles.th}>메모</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.label}</td>
                    <td style={styles.tdRight}>{yen(item.amount)}</td>
                    <td style={styles.td}>{item.memo}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={styles.td} colSpan={3}>
                    입력된 비용 항목이 없습니다.
                  </td>
                </tr>
              )}
              <tr>
                <td style={styles.totalTd}>초기비용 개산 합계</td>
                <td style={styles.totalTdRight}>{yen(initialTotal)}</td>
                <td style={styles.totalTd}>최종 금액은 관리회사 확인 후 확정</td>
              </tr>
            </tbody>
          </table>
        </div>

        <textarea
          style={styles.memoTextarea}
          value={form.estimateMemo}
          onChange={(event) => update('estimateMemo', event.target.value)}
        />
      </section>

      <section style={styles.grid}>
        <OutputPanel
          title="4. 고객 발송용 견적 안내문"
          value={customerMessage}
          copied={copied === 'customer'}
          onCopy={() => copyText('customer', customerMessage)}
        />
        <OutputPanel
          title="5. 고객용 매물 소개자료 초안"
          value={propertyIntro}
          copied={copied === 'intro'}
          onCopy={() => copyText('intro', propertyIntro)}
        />
      </section>

      <style>
        {`@media print {
          body * {
            visibility: hidden;
          }

          .estimate-print-area, .estimate-print-area * {
            visibility: visible;
          }

          .estimate-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
          }
        }`}
      </style>
    </section>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={styles.label}>
      <span>{label}</span>
      <input style={styles.input} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={styles.label}>
      <span>{label}</span>
      <input style={styles.input} type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <label style={styles.label}>
      <span>{label}</span>
      <input
        style={styles.input}
        value={value ? value.toLocaleString() : ''}
        inputMode="numeric"
        placeholder="0"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoLine}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OutputPanel({
  title,
  value,
  copied,
  onCopy,
}: {
  title: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div style={styles.panel}>
      <div style={styles.panelHeaderRow}>
        <h2 style={styles.panelTitle}>{title}</h2>
        <button type="button" style={styles.secondaryButton} onClick={onCopy}>
          {copied ? '복사 완료' : '복사'}
        </button>
      </div>
      <textarea style={styles.outputTextarea} value={value} readOnly />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    width: '100%',
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '0 16px 40px',
    boxSizing: 'border-box',
    color: '#241d18',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    marginBottom: '20px',
  },
  eyebrow: {
    margin: '0 0 8px',
    color: '#b9853b',
    fontSize: '13px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  eyebrowDark: {
    margin: '0 0 8px',
    color: '#8b5a2b',
    fontSize: '13px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
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
    maxWidth: '860px',
    color: '#d4d4d8',
    lineHeight: 1.65,
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '18px',
    marginBottom: '18px',
  },
  panel: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #eadfd4',
    borderRadius: '22px',
    padding: '20px',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.16)',
  },
  panelTitle: {
    margin: '0 0 16px',
    fontSize: '20px',
    color: '#241d18',
    letterSpacing: '-0.03em',
  },
  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  label: {
    display: 'grid',
    gap: '7px',
    color: '#5b4432',
    fontSize: '13px',
    fontWeight: 800,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #ded2c7',
    borderRadius: '13px',
    padding: '11px 12px',
    fontSize: '14px',
    color: '#241d18',
    background: '#fffdfb',
    outline: 'none',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '999px',
    padding: '10px 16px',
    background: '#8b5a2b',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #d8c7b5',
    borderRadius: '999px',
    padding: '10px 16px',
    background: '#fff',
    color: '#5b4432',
    fontWeight: 900,
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px',
    marginBottom: '18px',
  },
  summaryCard: {
    borderRadius: '18px',
    border: '1px solid #eadfd4',
    background: '#fffaf5',
    padding: '18px',
  },
  helperGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px',
  },
  helperCard: {
    padding: '16px',
    border: '1px solid #eadfd4',
    borderRadius: '18px',
    background: '#fffaf5',
  },
  helperTitle: {
    margin: '0 0 8px',
    fontSize: '15px',
    color: '#241d18',
  },
  helperText: {
    margin: '0 0 12px',
    color: '#7b716a',
    fontSize: '13px',
    lineHeight: 1.55,
  },
  helperResult: {
    margin: '12px 0 0',
    color: '#5b4432',
    fontSize: '12px',
    lineHeight: 1.55,
    fontWeight: 800,
  },
  segmentRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  segmentButton: {
    border: '1px solid #d8c7b5',
    borderRadius: '999px',
    padding: '8px 12px',
    background: '#fff',
    color: '#5b4432',
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: '12px',
  },
  segmentActive: {
    border: '1px solid #8b5a2b',
    borderRadius: '999px',
    padding: '8px 12px',
    background: '#8b5a2b',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: '12px',
  },
  buttonWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  printHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '18px',
    alignItems: 'flex-start',
    borderBottom: '2px solid #8b5a2b',
    paddingBottom: '14px',
    marginBottom: '16px',
  },
  estimateTitle: {
    margin: 0,
    fontSize: '26px',
    color: '#241d18',
  },
  printMeta: {
    textAlign: 'right',
    color: '#6f6258',
    fontSize: '13px',
    lineHeight: 1.45,
  },
  propertyBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px 14px',
    padding: '14px',
    borderRadius: '16px',
    background: '#fffaf5',
    border: '1px solid #eadfd4',
    marginBottom: '16px',
  },
  infoLine: {
    display: 'grid',
    gridTemplateColumns: '110px minmax(0, 1fr)',
    gap: '10px',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid #eadfd4',
    borderRadius: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '780px',
    fontSize: '13px',
  },
  th: {
    background: '#f8f4ef',
    color: '#51463d',
    borderBottom: '1px solid #eadfd4',
    padding: '11px',
    textAlign: 'left',
    fontWeight: 900,
  },
  thRight: {
    background: '#f8f4ef',
    color: '#51463d',
    borderBottom: '1px solid #eadfd4',
    padding: '11px',
    textAlign: 'right',
    fontWeight: 900,
  },
  td: {
    padding: '10px 11px',
    borderBottom: '1px solid #f0e6dc',
    verticalAlign: 'top',
  },
  tdRight: {
    padding: '10px 11px',
    borderBottom: '1px solid #f0e6dc',
    textAlign: 'right',
    verticalAlign: 'top',
    fontWeight: 800,
  },
  totalTd: {
    padding: '13px 11px',
    background: '#fff8dc',
    fontWeight: 900,
  },
  totalTdRight: {
    padding: '13px 11px',
    background: '#fff8dc',
    textAlign: 'right',
    fontWeight: 900,
    fontSize: '16px',
  },
  memoTextarea: {
    width: '100%',
    minHeight: '80px',
    marginTop: '14px',
    boxSizing: 'border-box',
    border: '1px solid #ded2c7',
    borderRadius: '13px',
    padding: '12px',
    lineHeight: 1.6,
    resize: 'vertical',
    color: '#241d18',
    background: '#fffdfb',
  },
  outputTextarea: {
    width: '100%',
    minHeight: '360px',
    boxSizing: 'border-box',
    border: '1px solid #ded2c7',
    borderRadius: '13px',
    padding: '14px',
    lineHeight: 1.65,
    resize: 'vertical',
    color: '#241d18',
    background: '#fffdfb',
  },
};
