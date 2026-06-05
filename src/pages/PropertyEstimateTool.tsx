import { useMemo, useState, type CSSProperties } from 'react';

const PDFJS_VERSION = '4.10.38';
const PDFJS_MODULE_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`;
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;
const TESSERACT_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

let pdfJsModulePromise: Promise<any> | null = null;
let tesseractLoadPromise: Promise<any> | null = null;

async function loadPdfJs() {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import(/* @vite-ignore */ PDFJS_MODULE_URL).then((module: any) => {
      module.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return module;
    });
  }

  return pdfJsModulePromise;
}

async function loadTesseract() {
  const existing = (window as any).Tesseract;

  if (existing?.createWorker) {
    return existing;
  }

  if (!tesseractLoadPromise) {
    tesseractLoadPromise = new Promise((resolve, reject) => {
      const alreadyAdded = document.querySelector(`script[src="${TESSERACT_SCRIPT_URL}"]`);

      if (alreadyAdded) {
        alreadyAdded.addEventListener('load', () => {
          const loaded = (window as any).Tesseract;

          if (loaded?.createWorker) resolve(loaded);
          else reject(new Error('Tesseract OCR 라이브러리를 불러왔지만 createWorker를 찾지 못했습니다.'));
        });
        alreadyAdded.addEventListener('error', () => reject(new Error('Tesseract OCR 라이브러리 로드 실패')));
        return;
      }

      const script = document.createElement('script');
      script.src = TESSERACT_SCRIPT_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        const loaded = (window as any).Tesseract;

        if (loaded?.createWorker) resolve(loaded);
        else reject(new Error('Tesseract OCR 라이브러리를 불러왔지만 createWorker를 찾지 못했습니다.'));
      };

      script.onerror = () => reject(new Error('Tesseract OCR 라이브러리 로드 실패'));
      document.head.appendChild(script);
    });
  }

  return tesseractLoadPromise;
}

type InitialRentMode = 'oneMonth' | 'prorated' | 'proratedPlusNextMonth';

type CustomFee = {
  id: string;
  label: string;
  amount: number;
  memo: string;
};

type PdfExtractResult = {
  propertyName?: string;
  roomNo?: string;
  address?: string;
  nearestStation?: string;
  layout?: string;
  area?: string;
  structure?: string;
  builtYear?: string;
  floor?: string;
  direction?: string;
  rent?: number;
  managementFee?: number;
  deposit?: number;
  keyMoney?: number;
  guaranteeDeposit?: number;
  guaranteeCompanyFee?: number;
  fireInsurance?: number;
  keyExchange?: number;
  cleaningFee?: number;
  supportFee?: number;
  contractAdminFee?: number;
  monthlyOtherFee?: number;
  monthlyOtherName?: string;
  otherFee?: number;
  otherFeeName?: string;
  customInitialFees?: CustomFee[];
  customMonthlyFees?: CustomFee[];
  estimateMemo?: string;
  detectedMemo: string[];
};

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
  customInitialFees: CustomFee[];
  customMonthlyFees: CustomFee[];
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
  customInitialFees: [],
  customMonthlyFees: [],
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
  customInitialFees: [],
  customMonthlyFees: [],
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

function sumFees(fees: CustomFee[]) {
  return fees.reduce((sum, fee) => sum + fee.amount, 0);
}

function buildMonthlyFeeLines(form: PropertyForm) {
  const lines: string[] = [];

  if (form.monthlyOtherFee > 0) {
    lines.push(`- ${form.monthlyOtherName || '기타 월액'}: ${yen(form.monthlyOtherFee)}`);
  }

  form.customMonthlyFees
    .filter((fee) => fee.amount > 0)
    .forEach((fee) => {
      lines.push(`- ${fee.label || '추가 월액'}: ${yen(fee.amount)}`);
    });

  return lines.length ? `${lines.join('\n')}\n` : '';
}

function normalizePdfText(text: string) {
  return text
    .replace(/\r/g, '\n')
    .replace(/　/g, ' ')
    .replace(/[|｜]/g, ' ')
    .replace(/[：]/g, ':')
    .replace(/[〜～]/g, '~')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function compactText(text: string) {
  return normalizePdfText(text).replace(/\s+/g, ' ');
}

function parseYenValue(value: string | undefined) {
  if (!value) return null;
  if (/なし|無し|無|free|無料/i.test(value)) return 0;

  const matched = value.match(/(\d{1,3}(?:,\d{3})+|\d{4,8})/);
  if (!matched?.[1]) return null;

  return Number(matched[1].replace(/,/g, ''));
}

function parseMonthValue(value: string | undefined, rent: number) {
  if (!value) return null;
  if (/なし|無し|無|0/.test(value)) return 0;

  const monthMatch = value.match(/(\d+(?:\.\d+)?)\s*(?:ヶ月|か月|カ月|ヵ月)/);
  if (monthMatch?.[1]) {
    return Math.round(Number(monthMatch[1]) * rent);
  }

  return parseYenValue(value);
}

function findFirstMatch(text: string, regexes: RegExp[]) {
  for (const regex of regexes) {
    const match = text.match(regex);
    if (match?.[1]) return match[1].trim();
  }

  return '';
}

function findLabeledAmount(text: string, labels: string[], rent = 0) {
  const compact = compactText(text);

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const yenMatch = compact.match(new RegExp(`${escaped}[^\\dな無０0]{0,30}(\\d{1,3}(?:,\\d{3})+|\\d{4,8})\\s*円`));
    const yen = parseYenValue(yenMatch?.[1]);
    if (yen !== null) return yen;

    const noneMatch = compact.match(new RegExp(`${escaped}[^\\dな無０0]{0,30}(なし|無し|無|0)`));
    if (noneMatch?.[1]) return 0;

    const monthMatch = compact.match(new RegExp(`${escaped}[^\\d]{0,30}(\\d+(?:\\.\\d+)?)\\s*(?:ヶ月|か月|カ月|ヵ月)`));
    const month = parseMonthValue(monthMatch?.[1] ? `${monthMatch[1]}ヶ月` : '', rent);
    if (month !== null) return month;
  }

  return null;
}

function findFeeByKeywords(text: string, keywords: string[]) {
  const compact = compactText(text);

  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = compact.match(new RegExp(`${escaped}[^\\d]{0,40}(\\d{1,3}(?:,\\d{3})+|\\d{4,8})\\s*円`));
    const value = parseYenValue(match?.[1]);
    if (value !== null) return value;
  }

  return null;
}

function findLabeledText(text: string, label: string, nextLabels: string[]) {
  const normalized = normalizePdfText(text);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedNext = nextLabels.map((next) => next.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  const regex = new RegExp(`${escapedLabel}\\s*[:：]?\\s*([\\s\\S]*?)(?=\\n(?:${escapedNext})\\s*[:：]?|\\n--- PAGE|$)`);
  const match = normalized.match(regex);

  return match?.[1]?.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function cleanRoomNo(value: string) {
  return value.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim();
}

function parseDirectYenAfterLabel(text: string, label: string) {
  const value = findLabeledText(text, label, [
    '共益費・管理費',
    '敷金',
    '礼金',
    '保証金',
    '償却・敷引',
    '更新料',
    '契約期間',
    '町内会費',
    '駐車場',
    '備 考',
    '設 備',
    '条　件',
    '取引態様',
    '特記事項',
  ]);

  return parseYenValue(value);
}

function parsePropertyPdfText(rawText: string): PdfExtractResult {
  const normalized = normalizePdfText(rawText);
  const compact = compactText(rawText);
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const memo: string[] = [];

  const addressLineIndex = lines.findIndex((line) => /(大阪|京都|兵庫|神戸|堺|吹田|東大阪|豊中|尼崎|西宮).*(徒歩|\/|／)/.test(line));
  const addressLine = addressLineIndex >= 0 ? lines[addressLineIndex] : '';
  const splitAddress = addressLine.split(/[／/]/).map((part) => part.trim()).filter(Boolean);

  const roomBlockMatch = compact.match(
    /(1R|1K|1DK|1LDK|2K|2DK|2LDK|3LDK)\s+(\d+(?:\.\d+)?)㎡\s+(\d{1,3}(?:,\d{3})+|\d{4,8})円\s+(?:(\d{1,3}(?:,\d{3})+|\d{4,8})円|(なし|無し|無|0))/,
  );

  const labeledRent = findLabeledAmount(normalized, ['賃料', '家賃']);
  const rent = labeledRent ?? parseYenValue(roomBlockMatch?.[3]);
  const managementFee =
    findLabeledAmount(normalized, ['共益費', '管理費', '共益費・管理費']) ??
    parseYenValue(roomBlockMatch?.[4] || roomBlockMatch?.[5]);

  const result: PdfExtractResult = {
    detectedMemo: memo,
  };

  const detailLabels = [
    '物件名',
    '号室名',
    '所在地',
    '交通',
    '建築構造',
    '間取タイプ',
    '専有面積',
    '開口部方位',
    '築年',
    '現況/入居時期',
    '賃料',
    '共益費・管理費',
    '敷金',
    '礼金',
    '保証金',
    '更新料',
    '契約期間',
    '町内会費',
    '駐車場',
    '備 考',
    '設 備',
    '条　件',
    '取引態様',
    '特記事項',
  ];

  const directPropertyName = findLabeledText(normalized, '物件名', detailLabels);
  const directRoomNo = findLabeledText(normalized, '号室名', detailLabels);
  const directAddress = findLabeledText(normalized, '所在地', detailLabels).replace(/〒\d{3}-?\d{4}.*/, '').trim();
  const directTraffic = findLabeledText(normalized, '交通', detailLabels);
  const directStructure = findLabeledText(normalized, '建築構造', detailLabels);
  const directLayout = findLabeledText(normalized, '間取タイプ', detailLabels);
  const directArea = findLabeledText(normalized, '専有面積', detailLabels);
  const directDirection = findLabeledText(normalized, '開口部方位', detailLabels);
  const directBuiltYear = findLabeledText(normalized, '築年', detailLabels);
  const directStatus = findLabeledText(normalized, '現況/入居時期', detailLabels);
  const directSpecial = findLabeledText(normalized, '特記事項', ['取引態様', 'Powered by', '--- PAGE']);
  const directEquipment = findLabeledText(normalized, '設 備', ['条　件', '取引態様', '特記事項']);
  const directCondition = findLabeledText(normalized, '条　件', ['取引態様', '特記事項']);

  if (directPropertyName || directRoomNo || directAddress) {
    result.propertyName = directPropertyName || '';
    result.roomNo = cleanRoomNo(directRoomNo);
    result.address = directAddress || '';
    result.nearestStation = directTraffic || '';
    result.layout = directLayout.match(/(1R|1K|1DK|1LDK|2K|2DK|2LDK|3LDK)/)?.[1] || directLayout || '';
    result.area = directArea.match(/(\d+(?:\.\d+)?)\s*㎡/)?.[0] || directArea || '';
    result.structure = directStructure || '';
    result.builtYear = directBuiltYear || '';
    result.floor = directRoomNo.match(/（([^）]*階部分)）/)?.[1] || '';
    result.direction = directDirection || '';

    const directRent = parseDirectYenAfterLabel(normalized, '賃料');
    const directManagementFee = parseDirectYenAfterLabel(normalized, '共益費・管理費');
    const directDeposit = parseMonthValue(findLabeledText(normalized, '敷金', detailLabels), directRent || 0);
    const directKeyMoney = parseMonthValue(findLabeledText(normalized, '礼金', detailLabels), directRent || 0);
    const directGuaranteeDeposit = parseMonthValue(findLabeledText(normalized, '保証金', detailLabels), directRent || 0);

    if (directRent !== null) result.rent = directRent;
    if (directManagementFee !== null) result.managementFee = directManagementFee;
    if (directDeposit !== null) result.deposit = directDeposit;
    if (directKeyMoney !== null) result.keyMoney = directKeyMoney;
    if (directGuaranteeDeposit !== null) result.guaranteeDeposit = directGuaranteeDeposit;

    const customInitialFees: CustomFee[] = [];
    const customMonthlyFees: CustomFee[] = [];

    const insuranceMonthly = directSpecial.match(/保険：?保険要加入\s*(\d{1,3}(?:,\d{3})+|\d{3,8})円/);
    const smartSupportMonthly = directSpecial.match(/スマサポコンシェル：?(\d{1,3}(?:,\d{3})+|\d{3,8})円（?月額/);
    const cleaning = directSpecial.match(/(?:契約時)?ルームクリーニング代(?:（税込）)?：?(\d{1,3}(?:,\d{3})+|\d{4,8})円/);
    const key = directSpecial.match(/カギ代：?(\d{1,3}(?:,\d{3})+|\d{4,8})円/);
    const smartSupportJoin = directSpecial.match(/スマサポコンシェル入会金：?(\d{1,3}(?:,\d{3})+|\d{4,8})円/);
    const renewalFee = directSpecial.match(/更新手数料：?(\d{1,3}(?:,\d{3})+|\d{4,8})円/);

    if (insuranceMonthly?.[1]) {
      customMonthlyFees.push({
        id: `pdf-insurance-${Date.now()}`,
        label: '保険料 / 보험료',
        amount: Number(insuranceMonthly[1].replace(/,/g, '')),
        memo: 'PDF 특記事項에서 월액 가능성 있음. 청구 방식 확인 필요',
      });
    }

    if (smartSupportMonthly?.[1]) {
      customMonthlyFees.push({
        id: `pdf-smart-support-monthly-${Date.now()}`,
        label: 'スマサポコンシェル（月額）',
        amount: Number(smartSupportMonthly[1].replace(/,/g, '')),
        memo: '월액 비용',
      });
    }

    if (cleaning?.[1]) result.cleaningFee = Number(cleaning[1].replace(/,/g, ''));
    if (key?.[1]) result.keyExchange = Number(key[1].replace(/,/g, ''));

    if (smartSupportJoin?.[1]) {
      customInitialFees.push({
        id: `pdf-smart-support-join-${Date.now()}`,
        label: 'スマサポコンシェル入会金',
        amount: Number(smartSupportJoin[1].replace(/,/g, '')),
        memo: '계약시 비용',
      });
    }

    if (renewalFee?.[1]) {
      memo.push(`更新手数料 ${renewalFee[1]}円 표기 있음. 갱신시 비용으로 초기비용에는 넣지 않았습니다.`);
    }

    if (/外国人契約可能/.test(directCondition + directSpecial + directEquipment)) {
      memo.push('外国人契約可能 표기 있음');
    }

    if (/保証会社利用必須/.test(directCondition + directSpecial)) {
      memo.push('保証会社利用必須 표기 있음. 초회 보증료는 별도 확인 필요');
    }

    if (/都市ガス/.test(directEquipment)) {
      memo.push('都市ガス 표기 있음');
    }

    if (directStatus) {
      memo.push(`現況/入居時期: ${directStatus}`);
    }

    result.customInitialFees = customInitialFees;
    result.customMonthlyFees = customMonthlyFees;

    result.estimateMemo = [
      '본 견적은 PDF 자동 추출 결과를 바탕으로 한 개산 견적입니다.',
      '자동 추출값은 관리회사 원본 PDF와 반드시 대조 확인해주세요.',
      ...memo,
    ].join('\n');

    return result;
  }

  const propertyNameByLabel = findFirstMatch(normalized, [
    /物件名\s*[:：]?\s*([^\n]+)/,
    /建物名\s*[:：]?\s*([^\n]+)/,
    /マンション名\s*[:：]?\s*([^\n]+)/,
  ]);

  const propertyNameByAddress = addressLineIndex > 0 ? lines[addressLineIndex - 1] : '';

  result.propertyName = propertyNameByLabel || propertyNameByAddress || '';
  result.address = splitAddress[0] || findFirstMatch(normalized, [/所在地\s*[:：]?\s*([^\n]+)/, /住所\s*[:：]?\s*([^\n]+)/]);
  result.nearestStation =
    splitAddress.slice(1).join(' / ') ||
    findFirstMatch(normalized, [/交通\s*[:：]?\s*([^\n]+)/, /最寄(?:駅)?\s*[:：]?\s*([^\n]+)/]);

  result.roomNo = findFirstMatch(normalized, [
    /号室(?:名)?\s*[:：]?\s*([0-9A-Za-z\-]+)/,
    /([0-9A-Za-z\-]+)\s*号室/,
    /\n([0-9]{3,4})\n（\d+階部分）/,
  ]);

  result.layout = roomBlockMatch?.[1] || findFirstMatch(compact, [/(1R|1K|1DK|1LDK|2K|2DK|2LDK|3LDK)/]);
  const areaValue = roomBlockMatch?.[2] || findFirstMatch(compact, [/(\d+(?:\.\d+)?)\s*㎡/]);
  result.area = areaValue ? `${areaValue}㎡` : '';

  result.structure = findFirstMatch(compact, [
    /(鉄骨鉄筋コンクリート造)/,
    /(鉄筋コンクリート造)/,
    /(軽量鉄骨造)/,
    /(鉄骨造)/,
    /(木造)/,
  ]);

  result.builtYear = findFirstMatch(compact, [/(\d{4}年\d{1,2}月築)/, /(築\d+年)/, /(新築)/]);
  result.floor = findFirstMatch(compact, [/（(\d+階部分)）/, /所在階\s*[:：]?\s*(\d+階)/]);
  result.direction = findFirstMatch(compact, [
    /(北東向|東北向|北西向|西北向|南東向|東南向|南西向|西南向|南向|北向|東向|西向)/,
  ]);

  if (rent !== null) result.rent = rent;
  if (managementFee !== null) result.managementFee = managementFee;

  if (result.rent) {
    const deposit = findLabeledAmount(normalized, ['敷金'], result.rent);
    const keyMoney = findLabeledAmount(normalized, ['礼金'], result.rent);
    const guaranteeDeposit = findLabeledAmount(normalized, ['保証金'], result.rent);

    if (deposit !== null) result.deposit = deposit;
    if (keyMoney !== null) result.keyMoney = keyMoney;
    if (guaranteeDeposit !== null) result.guaranteeDeposit = guaranteeDeposit;
  }

  const guaranteeCompanyFee =
    findFeeByKeywords(normalized, ['初回保証料', '保証会社', '保証料']) ??
    (() => {
      const percentMatch = compact.match(/初回保証料[^0-9]{0,30}(\d{1,3})\s*%/);
      if (percentMatch?.[1] && result.rent !== undefined) {
        return Math.round(((result.rent || 0) + (result.managementFee || 0)) * (Number(percentMatch[1]) / 100));
      }
      return null;
    })();

  const fireInsurance = findFeeByKeywords(normalized, ['火災保険', '保険料', '保険']);
  const keyExchange = findFeeByKeywords(normalized, ['鍵交換', 'カギ交換', 'キー交換']);
  const cleaningFee = findFeeByKeywords(normalized, ['クリーニング', '清掃費', '退去時清掃']);
  const supportFee = findFeeByKeywords(normalized, ['24時間サポート', '安心サポート', '駆けつけ']);
  const contractAdminFee = findFeeByKeywords(normalized, ['契約事務手数料', '事務手数料', '書類作成']);

  if (guaranteeCompanyFee !== null) result.guaranteeCompanyFee = guaranteeCompanyFee;
  if (fireInsurance !== null) result.fireInsurance = fireInsurance;
  if (keyExchange !== null) result.keyExchange = keyExchange;
  if (cleaningFee !== null) result.cleaningFee = cleaningFee;
  if (supportFee !== null) result.supportFee = supportFee;
  if (contractAdminFee !== null) result.contractAdminFee = contractAdminFee;

  if (/水道代|水道料/.test(compact)) {
    const waterFee = findFeeByKeywords(normalized, ['水道代', '水道料']);
    if (waterFee !== null) {
      result.monthlyOtherName = '水道代 / 수도비';
      result.monthlyOtherFee = waterFee;
    }
  }

  if (/インターネット|ネット/.test(compact)) {
    memo.push('인터넷 비용 포함/별도 여부 확인 필요');
  }

  if (/外国人契約可能/.test(compact)) {
    memo.push('外国人契約可能 표기 있음');
  }

  if (/短期解約|違約金/.test(compact)) {
    memo.push('단기해약 위약금 조건 확인 필요');
  }

  if (/ペット/.test(compact)) {
    memo.push('반려동물 관련 조건 있음. 고객 조건과 별도 확인 필요');
  }

  if (!result.rent || result.managementFee === undefined) {
    memo.push('월세/관리비 자동 추출이 불완전합니다. PDF 원본 금액을 직접 확인해주세요.');
  }

  if (!result.propertyName) {
    memo.push('매물명 자동 추출이 불완전합니다.');
  }

  result.estimateMemo = [
    '본 견적은 PDF 자동 추출 결과를 바탕으로 한 개산 견적입니다.',
    '자동 추출값은 관리회사 원본 PDF와 반드시 대조 확인해주세요.',
    ...memo,
  ].join('\n');

  return result;
}

function formatPdfTextItems(items: any[]) {
  const textItems = items
    .map((item: any) => ({
      text: typeof item.str === 'string' ? item.str.trim() : '',
      x: Array.isArray(item.transform) ? Number(item.transform[4]) || 0 : 0,
      y: Array.isArray(item.transform) ? Number(item.transform[5]) || 0 : 0,
    }))
    .filter((item) => item.text);

  textItems.sort((a, b) => {
    if (Math.abs(b.y - a.y) > 3) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: Array<{ y: number; items: typeof textItems }> = [];

  textItems.forEach((item) => {
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= 3);

    if (line) {
      line.items.push(item);
      line.y = (line.y + item.y) / 2;
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  });

  return lines
    .map((line) =>
      line.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join('\n');
}

function hasUsefulPdfText(text: string) {
  const compact = text.replace(/--- PAGE \d+ \/ \d+ ---/g, '').replace(/\s+/g, '');

  return compact.length >= 30;
}

async function renderPageToCanvas(page: any) {
  const viewport = page.getViewport({ scale: 2.2 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Canvas를 생성하지 못했습니다.');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
}

async function createJapaneseOcrWorker() {
  const tesseract = await loadTesseract();

  if (!tesseract?.createWorker) {
    throw new Error('Tesseract OCR createWorker 함수를 찾지 못했습니다.');
  }

  return tesseract.createWorker('jpn+eng', 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
  });
}

async function extractTextFromPdf(file: File, onProgress?: (message: string) => void) {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pageTexts: string[] = [];
  let ocrWorker: any = null;
  let ocrUsed = false;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress?.(`PDF ${pageNumber}/${pdf.numPages}페이지 텍스트를 확인하는 중입니다...`);

      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      let text = formatPdfTextItems(content.items as any[]);

      if (!hasUsefulPdfText(text)) {
        ocrUsed = true;
      }
      if (!hasUsefulPdfText(text)) {
        onProgress?.(
          `PDF ${pageNumber}/${pdf.numPages}페이지가 이미지형으로 보입니다. OCR로 글자를 인식하는 중입니다. 처음 실행은 시간이 걸릴 수 있습니다...`,
        );

        if (!ocrWorker) {
          ocrWorker = await createJapaneseOcrWorker();
        }

        const canvas = await renderPageToCanvas(page);
        const result = await ocrWorker.recognize(canvas);
        text = result?.data?.text || '';
      }

      pageTexts.push(`--- PAGE ${pageNumber} / ${pdf.numPages} ---\n${text}`);
    }
  } finally {
    if (ocrWorker) {
      await ocrWorker.terminate();
    }
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount: pdf.numPages,
    ocrUsed,
  };
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
    ...form.customMonthlyFees.map((fee) => ({
      id: `customMonthly-${fee.id}`,
      label: fee.label || '추가 월액',
      amount: fee.amount,
      memo: fee.memo || '월액 비용',
      taxable: false,
    })),
    ...form.customInitialFees.map((fee) => ({
      id: `customInitial-${fee.id}`,
      label: fee.label || '추가 초기비용',
      amount: fee.amount,
      memo: fee.memo || '추가 비용',
      taxable: false,
    })),
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
${buildMonthlyFeeLines(form)}- 월액 합계: ${yen(monthlyTotal)}

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
- 월액 합계: ${yen(form.rent + form.managementFee + form.monthlyOtherFee + sumFees(form.customMonthlyFees))}

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


function buildChatGptJsonExtractionPrompt() {
  return `첨부한 RealnetPro/リアプロ 매물 전용 PDF에서 아래 항목을 추출해서 JSON만 출력해주세요.

[중요]
- PDF에 없는 값은 빈 문자열 또는 0으로 넣어주세요.
- 금액은 콤마 없이 숫자만 넣어주세요.
- 월액 비용과 계약시 추가비용은 배열로 넣어주세요.
- 설명 문장 없이 JSON만 출력해주세요.

[JSON 형식]
{
  "propertyName": "",
  "roomNo": "",
  "address": "",
  "nearestStation": "",
  "layout": "",
  "area": "",
  "structure": "",
  "builtYear": "",
  "floor": "",
  "direction": "",
  "moveInDate": "",
  "rent": 0,
  "managementFee": 0,
  "deposit": 0,
  "keyMoney": 0,
  "guaranteeDeposit": 0,
  "guaranteeCompanyFee": 0,
  "fireInsurance": 0,
  "keyExchange": 0,
  "cleaningFee": 0,
  "supportFee": 0,
  "contractAdminFee": 0,
  "otherFeeName": "",
  "otherFee": 0,
  "customInitialFees": [
    {
      "label": "",
      "amount": 0,
      "memo": ""
    }
  ],
  "customMonthlyFees": [
    {
      "label": "",
      "amount": 0,
      "memo": ""
    }
  ],
  "estimateMemo": ""
}

[예시 판단]
- 賃料 → rent
- 共益費・管理費 → managementFee
- 敷金 → deposit
- 礼金 → keyMoney
- 保証金 → guaranteeDeposit
- 火災保険 / 保険料 → fireInsurance 또는 월액이면 customMonthlyFees
- カギ代 / 鍵交換代 → keyExchange
- ルームクリーニング代 / 清掃費 → cleaningFee
- スマサポコンシェル入会金 등 계약시 비용 → customInitialFees
- スマサポコンシェル（月額）/ 水道代 등 월액 비용 → customMonthlyFees
- 更新料 / 更新手数料는 갱신시 비용이므로 estimateMemo에만 적고 초기비용에는 넣지 마세요.

위 기준으로 첨부 PDF를 읽고 JSON만 출력해주세요.`;
}

function parsePastedJson(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(withoutFence);
}

function normalizeCustomFees(fees: any[] | undefined, prefix: string): CustomFee[] {
  if (!Array.isArray(fees)) return [];

  return fees
    .map((fee, index) => ({
      id: `${prefix}-${Date.now()}-${index}`,
      label: String(fee?.label || ''),
      amount: typeof fee?.amount === 'number' ? fee.amount : numberValue(String(fee?.amount || '0')),
      memo: String(fee?.memo || ''),
    }))
    .filter((fee) => fee.label || fee.amount > 0 || fee.memo);
}

export default function PropertyEstimateTool() {
  const [form, setForm] = useState<PropertyForm>(defaultForm);
  const [copied, setCopied] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfStatus, setPdfStatus] = useState('');
  const [pdfExtractedText, setPdfExtractedText] = useState('');
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfExtractedData, setPdfExtractedData] = useState<PdfExtractResult | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonStatus, setJsonStatus] = useState('');

  const items = useMemo(() => buildItems(form), [form]);
  const initialTotal = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const monthlyTotal = form.rent + form.managementFee + form.monthlyOtherFee + sumFees(form.customMonthlyFees);
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
    const base = form.rent + form.managementFee + form.monthlyOtherFee + sumFees(form.customMonthlyFees);
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

  const addCustomFee = (kind: 'initial' | 'monthly') => {
    const newFee: CustomFee = {
      id: `${kind}-${Date.now()}`,
      label: kind === 'initial' ? '추가 초기비용' : '추가 월액비용',
      amount: 0,
      memo: '',
    };

    setForm((current) => ({
      ...current,
      customInitialFees: kind === 'initial' ? [...current.customInitialFees, newFee] : current.customInitialFees,
      customMonthlyFees: kind === 'monthly' ? [...current.customMonthlyFees, newFee] : current.customMonthlyFees,
    }));
  };

  const updateCustomFee = (kind: 'initial' | 'monthly', id: string, key: keyof CustomFee, value: string) => {
    setForm((current) => {
      const targetKey = kind === 'initial' ? 'customInitialFees' : 'customMonthlyFees';
      const nextFees = current[targetKey].map((fee) => {
        if (fee.id !== id) return fee;

        return {
          ...fee,
          [key]: key === 'amount' ? numberValue(value) : value,
        };
      });

      return {
        ...current,
        [targetKey]: nextFees,
      };
    });
  };

  const removeCustomFee = (kind: 'initial' | 'monthly', id: string) => {
    setForm((current) => {
      const targetKey = kind === 'initial' ? 'customInitialFees' : 'customMonthlyFees';

      return {
        ...current,
        [targetKey]: current[targetKey].filter((fee) => fee.id !== id),
      };
    });
  };

  const handlePdfFile = async (file: File | undefined) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('PDF 파일만 첨부할 수 있습니다.');
      return;
    }

    setPdfFileName(file.name);
    setPdfStatus('PDF 텍스트를 읽는 중입니다...');
    setPdfExtractedText('');
    setPdfPageCount(0);
    setPdfExtractedData(null);

    try {
      const { text, pageCount, ocrUsed } = await extractTextFromPdf(file, setPdfStatus);
      const parsed = parsePropertyPdfText(text);

      setPdfExtractedText(text.slice(0, 8000));
      setPdfPageCount(pageCount);

      setPdfExtractedData(parsed);

      setPdfStatus(
        ocrUsed
          ? `PDF ${pageCount}페이지를 OCR로 읽고 자동 추출 후보를 만들었습니다. OCR 결과는 오인식 가능성이 있으므로 원본 PDF와 반드시 대조해주세요.`
          : `PDF ${pageCount}페이지를 읽고 자동 추출 후보를 만들었습니다. 아래 추출 후보를 확인한 뒤 “추출값 입력폼에 반영” 버튼을 눌러주세요.`,
      );
    } catch (error: any) {
      console.error(error);
      setPdfStatus(
        `PDF를 읽지 못했습니다. 이미지 기반 PDF이거나 텍스트 추출이 제한된 파일일 수 있습니다. 상세: ${error?.message || '알 수 없는 오류'}`,
      );
    }
  };

  const applyPdfExtractedData = () => {
    if (!pdfExtractedData) {
      alert('반영할 PDF 추출값이 없습니다.');
      return;
    }

    const parsed = pdfExtractedData;

    setForm((current) => ({
      ...current,
      propertyName: parsed.propertyName || current.propertyName,
      roomNo: parsed.roomNo || current.roomNo,
      address: parsed.address || current.address,
      nearestStation: parsed.nearestStation || current.nearestStation,
      layout: parsed.layout || current.layout,
      area: parsed.area || current.area,
      structure: parsed.structure || current.structure,
      builtYear: parsed.builtYear || current.builtYear,
      floor: parsed.floor || current.floor,
      direction: parsed.direction || current.direction,
      rent: parsed.rent ?? current.rent,
      managementFee: parsed.managementFee ?? current.managementFee,
      deposit: parsed.deposit ?? current.deposit,
      keyMoney: parsed.keyMoney ?? current.keyMoney,
      guaranteeDeposit: parsed.guaranteeDeposit ?? current.guaranteeDeposit,
      guaranteeCompanyFee: parsed.guaranteeCompanyFee ?? current.guaranteeCompanyFee,
      fireInsurance: parsed.fireInsurance ?? current.fireInsurance,
      keyExchange: parsed.keyExchange ?? current.keyExchange,
      cleaningFee: parsed.cleaningFee ?? current.cleaningFee,
      supportFee: parsed.supportFee ?? current.supportFee,
      contractAdminFee: parsed.contractAdminFee ?? current.contractAdminFee,
      monthlyOtherName: parsed.monthlyOtherName || current.monthlyOtherName,
      monthlyOtherFee: parsed.monthlyOtherFee ?? current.monthlyOtherFee,
      otherFeeName: parsed.otherFeeName || current.otherFeeName,
      otherFee: parsed.otherFee ?? current.otherFee,
      customInitialFees: parsed.customInitialFees?.length ? parsed.customInitialFees : current.customInitialFees,
      customMonthlyFees: parsed.customMonthlyFees?.length ? parsed.customMonthlyFees : current.customMonthlyFees,
      estimateMemo: parsed.estimateMemo || current.estimateMemo,
    }));

    setPdfStatus('추출값을 입력폼에 반영했습니다. 금액은 반드시 원본 PDF와 대조 확인해주세요.');
  };

  const applyPastedJson = () => {
    try {
      const parsed = parsePastedJson(jsonInput);

      setForm((current) => ({
        ...current,
        propertyName: parsed.propertyName || current.propertyName,
        roomNo: parsed.roomNo || current.roomNo,
        address: parsed.address || current.address,
        nearestStation: parsed.nearestStation || current.nearestStation,
        layout: parsed.layout || current.layout,
        area: parsed.area || current.area,
        structure: parsed.structure || current.structure,
        builtYear: parsed.builtYear || current.builtYear,
        floor: parsed.floor || current.floor,
        direction: parsed.direction || current.direction,
        moveInDate: parsed.moveInDate || current.moveInDate,
        rent: parsed.rent !== undefined ? numberValue(String(parsed.rent)) : current.rent,
        managementFee: parsed.managementFee !== undefined ? numberValue(String(parsed.managementFee)) : current.managementFee,
        deposit: parsed.deposit !== undefined ? numberValue(String(parsed.deposit)) : current.deposit,
        keyMoney: parsed.keyMoney !== undefined ? numberValue(String(parsed.keyMoney)) : current.keyMoney,
        guaranteeDeposit:
          parsed.guaranteeDeposit !== undefined ? numberValue(String(parsed.guaranteeDeposit)) : current.guaranteeDeposit,
        guaranteeCompanyFee:
          parsed.guaranteeCompanyFee !== undefined
            ? numberValue(String(parsed.guaranteeCompanyFee))
            : current.guaranteeCompanyFee,
        fireInsurance: parsed.fireInsurance !== undefined ? numberValue(String(parsed.fireInsurance)) : current.fireInsurance,
        keyExchange: parsed.keyExchange !== undefined ? numberValue(String(parsed.keyExchange)) : current.keyExchange,
        cleaningFee: parsed.cleaningFee !== undefined ? numberValue(String(parsed.cleaningFee)) : current.cleaningFee,
        supportFee: parsed.supportFee !== undefined ? numberValue(String(parsed.supportFee)) : current.supportFee,
        contractAdminFee:
          parsed.contractAdminFee !== undefined ? numberValue(String(parsed.contractAdminFee)) : current.contractAdminFee,
        otherFeeName: parsed.otherFeeName || current.otherFeeName,
        otherFee: parsed.otherFee !== undefined ? numberValue(String(parsed.otherFee)) : current.otherFee,
        customInitialFees: normalizeCustomFees(parsed.customInitialFees, 'json-initial'),
        customMonthlyFees: normalizeCustomFees(parsed.customMonthlyFees, 'json-monthly'),
        estimateMemo: parsed.estimateMemo || current.estimateMemo,
      }));

      setJsonStatus('JSON 내용을 입력폼에 반영했습니다. 금액은 원본 PDF와 대조 확인해주세요.');
    } catch (error: any) {
      setJsonStatus(`JSON 반영에 실패했습니다. 형식이 올바른지 확인해주세요. 상세: ${error?.message || '알 수 없는 오류'}`);
    }
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
          텍스트형 PDF는 직접 읽고, 이미지형 PDF는 OCR 보조로 읽어 자동 추출 후보를 만듭니다.
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

      <section style={styles.panel}>
        <div style={styles.panelHeaderRow}>
          <div>
            <h2 style={styles.panelTitle}>1. 관리회사 PDF 첨부 / 자동 입력</h2>
            <p style={styles.panelSubText}>
              RealnetPro에서 내려받은 매물 전용 PDF를 첨부하면, 읽을 수 있는 텍스트를 기준으로 매물정보와 비용 항목을 자동 입력합니다.
            </p>
          </div>

          <label style={styles.uploadButton}>
            PDF 첨부
            <input
              type="file"
              accept="application/pdf,.pdf"
              style={{ display: 'none' }}
              onChange={(event) => handlePdfFile(event.target.files?.[0])}
            />
          </label>
        </div>

        <div style={styles.pdfStatusBox}>
          <strong>{pdfFileName || '첨부된 PDF 없음'}</strong>
          <p>{pdfStatus || 'PDF를 첨부하면 자동 추출 결과가 여기에 표시됩니다.'}</p>
          {pdfPageCount > 0 && <span>{pdfPageCount}페이지 감지</span>}
        </div>

        {pdfExtractedData && (
          <div style={styles.pdfCandidateBox}>
            <div style={styles.panelHeaderRow}>
              <div>
                <h3 style={styles.helperTitle}>PDF 자동 추출 후보</h3>
                <p style={styles.panelSubText}>
                  바로 입력폼을 덮어쓰지 않고, 추출 후보를 먼저 보여줍니다. 원본 PDF와 비교 후 반영하세요.
                </p>
              </div>
              <button type="button" style={styles.primaryButton} onClick={applyPdfExtractedData}>
                추출값 입력폼에 반영
              </button>
            </div>

            <div style={styles.candidateGrid}>
              <CandidateItem label="매물명" value={pdfExtractedData.propertyName} />
              <CandidateItem label="호실" value={pdfExtractedData.roomNo} />
              <CandidateItem label="주소" value={pdfExtractedData.address} />
              <CandidateItem label="교통" value={pdfExtractedData.nearestStation} />
              <CandidateItem label="타입" value={pdfExtractedData.layout} />
              <CandidateItem label="면적" value={pdfExtractedData.area} />
              <CandidateItem label="구조" value={pdfExtractedData.structure} />
              <CandidateItem label="축년" value={pdfExtractedData.builtYear} />
              <CandidateItem label="층수" value={pdfExtractedData.floor} />
              <CandidateItem label="향" value={pdfExtractedData.direction} />
              <CandidateItem label="월세" value={pdfExtractedData.rent !== undefined ? yen(pdfExtractedData.rent) : ''} />
              <CandidateItem
                label="관리비"
                value={pdfExtractedData.managementFee !== undefined ? yen(pdfExtractedData.managementFee) : ''}
              />
              <CandidateItem label="敷金" value={pdfExtractedData.deposit !== undefined ? yen(pdfExtractedData.deposit) : ''} />
              <CandidateItem label="礼金" value={pdfExtractedData.keyMoney !== undefined ? yen(pdfExtractedData.keyMoney) : ''} />
              <CandidateItem
                label="保証会社"
                value={pdfExtractedData.guaranteeCompanyFee !== undefined ? yen(pdfExtractedData.guaranteeCompanyFee) : ''}
              />
              <CandidateItem
                label="火災保険"
                value={pdfExtractedData.fireInsurance !== undefined ? yen(pdfExtractedData.fireInsurance) : ''}
              />
              <CandidateItem
                label="鍵交換代"
                value={pdfExtractedData.keyExchange !== undefined ? yen(pdfExtractedData.keyExchange) : ''}
              />
              <CandidateItem
                label="清掃費"
                value={pdfExtractedData.cleaningFee !== undefined ? yen(pdfExtractedData.cleaningFee) : ''}
              />
              <CandidateItem
                label="추가 초기비용"
                value={
                  pdfExtractedData.customInitialFees?.length
                    ? pdfExtractedData.customInitialFees.map((fee) => `${fee.label} ${yen(fee.amount)}`).join(' / ')
                    : ''
                }
              />
              <CandidateItem
                label="추가 월액비용"
                value={
                  pdfExtractedData.customMonthlyFees?.length
                    ? pdfExtractedData.customMonthlyFees.map((fee) => `${fee.label} ${yen(fee.amount)}`).join(' / ')
                    : ''
                }
              />
            </div>
          </div>
        )}

        {pdfExtractedText && (
          <details style={styles.pdfPreviewBox}>
            <summary>추출된 PDF 텍스트 일부 보기</summary>
            <pre>{pdfExtractedText}</pre>
          </details>
        )}
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeaderRow}>
          <div>
            <h2 style={styles.panelTitle}>2. ChatGPT 추출 JSON 붙여넣기</h2>
            <p style={styles.panelSubText}>
              관리자 페이지 OCR이 깨지는 PDF는 이 ChatGPT 대화창에서 PDF를 분석한 뒤, JSON 결과를 여기에 붙여넣어 입력폼에 반영합니다.
            </p>
          </div>
          <button type="button" style={styles.secondaryButton} onClick={() => copyText('jsonPrompt', buildChatGptJsonExtractionPrompt())}>
            ChatGPT 추출 프롬프트 복사
          </button>
        </div>

        <textarea
          style={styles.jsonTextarea}
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          placeholder="ChatGPT가 출력한 JSON을 여기에 붙여넣으세요."
        />

        <div style={styles.jsonActionRow}>
          <button type="button" style={styles.primaryButton} onClick={applyPastedJson}>
            JSON 입력폼에 반영
          </button>
          <span>{jsonStatus || 'JSON을 붙여넣고 반영 버튼을 누르면 매물정보와 비용 항목이 자동 입력됩니다.'}</span>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>3. 고객 / 매물 기본정보</h2>

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
          <h2 style={styles.panelTitle}>4. 비용 입력</h2>

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
        <h2 style={styles.panelTitle}>5. 추가 비용 항목</h2>

        <div style={styles.customFeeGrid}>
          <CustomFeeList
            title="추가 초기비용"
            description="항균시공비, 소독비, 서류작성비 등 고정 항목에 없는 비용을 추가합니다."
            fees={form.customInitialFees}
            kind="initial"
            onAdd={() => addCustomFee('initial')}
            onUpdate={updateCustomFee}
            onRemove={removeCustomFee}
          />

          <CustomFeeList
            title="추가 월액비용"
            description="수도비, 인터넷비, 월액 보증료 등 매월 발생하는 비용을 추가합니다."
            fees={form.customMonthlyFees}
            kind="monthly"
            onAdd={() => addCustomFee('monthly')}
            onUpdate={updateCustomFee}
            onRemove={removeCustomFee}
          />
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>6. 자동 계산 보조</h2>

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

      <section style={styles.estimatePaper} className="estimate-print-area">
        <div style={styles.documentTopLine} />

        <div style={styles.documentHeader}>
          <div>
            <p style={styles.documentBrand}>OSAKA J REAL ESTATE</p>
            <h2 style={styles.documentTitle}>初期費用概算書</h2>
            <p style={styles.documentSubtitle}>초기비용 개산 견적서</p>
          </div>

          <div style={styles.documentMetaBox}>
            <div style={styles.documentMetaItem}>
              <span>작성일</span>
              <strong>{new Date().toLocaleDateString('ja-JP')}</strong>
            </div>
            <div style={styles.documentMetaItem}>
              <span>구분</span>
              <strong>概算 / Estimate</strong>
            </div>
          </div>
        </div>

        <div style={styles.noticePrintBox}>
          본 견적서는 현재 확인 가능한 관리회사 자료와 입력값을 기준으로 작성한 개산 견적입니다.
          최종 금액은 입주일, 보증회사 심사 결과, 관리회사 조건, 옵션 가입 여부에 따라 변동될 수 있습니다.
        </div>

        <div style={styles.documentSection}>
          <div style={styles.sectionTitleRow}>
            <span>01</span>
            <h3>매물 기본정보</h3>
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
        </div>

        <div style={styles.documentSection}>
          <div style={styles.sectionTitleRow}>
            <span>02</span>
            <h3>월액 비용</h3>
          </div>

          <div style={styles.monthlyCards}>
            <div style={styles.monthlyCard}>
              <span>賃料 / 월세</span>
              <strong>{yen(form.rent)}</strong>
            </div>
            <div style={styles.monthlyCard}>
              <span>共益費 / 관리비</span>
              <strong>{yen(form.managementFee)}</strong>
            </div>
            <div style={styles.monthlyCardStrong}>
              <span>月額合計 / 월액 합계</span>
              <strong>{yen(monthlyTotal)}</strong>
            </div>
          </div>
        </div>

        <div style={styles.documentSection}>
          <div style={styles.sectionTitleRow}>
            <span>03</span>
            <h3>초기비용 상세</h3>
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
        </div>

        <div style={styles.documentTotalBox}>
          <div>
            <span>月額合計</span>
            <strong>{yen(monthlyTotal)}</strong>
          </div>
          <div>
            <span>初期費用概算合計</span>
            <strong>{yen(initialTotal)}</strong>
          </div>
        </div>

        <div style={styles.documentSection}>
          <div style={styles.sectionTitleRow}>
            <span>04</span>
            <h3>비고</h3>
          </div>
          <textarea
            style={styles.memoTextarea}
            value={form.estimateMemo}
            onChange={(event) => update('estimateMemo', event.target.value)}
          />
        </div>

        <div style={styles.documentFooter}>
          <p>Osaka J Real Estate</p>
          <p>※ 본 견적서는 고객 안내용 개산자료이며, 계약 확정서가 아닙니다.</p>
        </div>
      </section>

      <section style={styles.grid}>
        <OutputPanel
          title="7. 고객 발송용 견적 안내문"
          value={customerMessage}
          copied={copied === 'customer'}
          onCopy={() => copyText('customer', customerMessage)}
        />
        <OutputPanel
          title="8. 고객용 매물 소개자료 초안"
          value={propertyIntro}
          copied={copied === 'intro'}
          onCopy={() => copyText('intro', propertyIntro)}
        />
      </section>

      <style>
        {`@media print {
          @page {
            size: A4;
            margin: 12mm;
          }

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
            border-radius: 0 !important;
            padding: 0 !important;
          }

          .estimate-print-area textarea {
            border: none !important;
            resize: none !important;
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

function CandidateItem({ label, value }: { label: string; value?: string }) {
  return (
    <div style={styles.candidateItem}>
      <span>{label}</span>
      <strong>{value || '미추출'}</strong>
    </div>
  );
}

function CustomFeeList({
  title,
  description,
  fees,
  kind,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  description: string;
  fees: CustomFee[];
  kind: 'initial' | 'monthly';
  onAdd: () => void;
  onUpdate: (kind: 'initial' | 'monthly', id: string, key: keyof CustomFee, value: string) => void;
  onRemove: (kind: 'initial' | 'monthly', id: string) => void;
}) {
  return (
    <div style={styles.customFeeCard}>
      <div style={styles.customFeeHeader}>
        <div>
          <h3 style={styles.helperTitle}>{title}</h3>
          <p style={styles.helperText}>{description}</p>
        </div>
        <button type="button" style={styles.secondaryButton} onClick={onAdd}>
          항목 추가
        </button>
      </div>

      {fees.length ? (
        <div style={styles.customFeeList}>
          {fees.map((fee) => (
            <div key={fee.id} style={styles.customFeeRow}>
              <label style={styles.label}>
                <span>항목명</span>
                <input
                  style={styles.input}
                  value={fee.label}
                  onChange={(event) => onUpdate(kind, fee.id, 'label', event.target.value)}
                />
              </label>

              <label style={styles.label}>
                <span>금액</span>
                <input
                  style={styles.input}
                  inputMode="numeric"
                  value={fee.amount ? fee.amount.toLocaleString() : ''}
                  placeholder="0"
                  onChange={(event) => onUpdate(kind, fee.id, 'amount', event.target.value)}
                />
              </label>

              <label style={styles.label}>
                <span>메모</span>
                <input
                  style={styles.input}
                  value={fee.memo}
                  onChange={(event) => onUpdate(kind, fee.id, 'memo', event.target.value)}
                  placeholder="예: 필수 여부 확인"
                />
              </label>

              <button type="button" style={styles.deleteButton} onClick={() => onRemove(kind, fee.id)}>
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={styles.emptyText}>추가된 항목이 없습니다.</p>
      )}
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
  estimatePaper: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #eadfd4',
    borderRadius: '22px',
    padding: '28px',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.16)',
    marginBottom: '18px',
  },
  documentTopLine: {
    height: '6px',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #8b5a2b, #d8b16a, #8b5a2b)',
    marginBottom: '22px',
  },
  documentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '18px',
    alignItems: 'flex-start',
    marginBottom: '18px',
  },
  documentBrand: {
    margin: '0 0 8px',
    color: '#8b5a2b',
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: '0.14em',
  },
  documentTitle: {
    margin: 0,
    color: '#241d18',
    fontSize: '32px',
    letterSpacing: '-0.04em',
    lineHeight: 1.1,
  },
  documentSubtitle: {
    margin: '7px 0 0',
    color: '#6f6258',
    fontSize: '14px',
    fontWeight: 800,
  },
  documentMetaBox: {
    minWidth: '210px',
    border: '1px solid #eadfd4',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#fffaf5',
  },
  documentMetaItem: {
    display: 'grid',
    gap: '4px',
    padding: '11px 13px',
    borderBottom: '1px solid #eadfd4',
    color: '#5b4432',
    fontSize: '12px',
  },
  noticePrintBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    border: '1px solid #eadfd4',
    background: '#fff8dc',
    color: '#5b4432',
    lineHeight: 1.65,
    fontSize: '13px',
    marginBottom: '20px',
  },
  documentSection: {
    marginBottom: '22px',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    borderBottom: '1px solid #eadfd4',
    paddingBottom: '8px',
  },
  monthlyCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
  },
  monthlyCard: {
    border: '1px solid #eadfd4',
    borderRadius: '16px',
    padding: '15px',
    background: '#fffaf5',
  },
  monthlyCardStrong: {
    border: '1px solid #8b5a2b',
    borderRadius: '16px',
    padding: '15px',
    background: '#8b5a2b',
    color: '#ffffff',
  },
  documentTotalBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    margin: '22px 0',
  },
  documentFooter: {
    borderTop: '1px solid #eadfd4',
    marginTop: '24px',
    paddingTop: '12px',
    color: '#7b716a',
    fontSize: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  panelTitle: {
    margin: '0 0 16px',
    fontSize: '20px',
    color: '#241d18',
    letterSpacing: '-0.03em',
  },
  panelSubText: {
    margin: '6px 0 0',
    color: '#7b716a',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  uploadButton: {
    border: 'none',
    borderRadius: '999px',
    padding: '10px 16px',
    background: '#8b5a2b',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  pdfStatusBox: {
    padding: '14px 16px',
    borderRadius: '16px',
    border: '1px solid #eadfd4',
    background: '#fffaf5',
    color: '#241d18',
    lineHeight: 1.6,
  },
  pdfPreviewBox: {
    marginTop: '12px',
    border: '1px solid #eadfd4',
    borderRadius: '16px',
    padding: '14px',
    background: '#fffdfb',
    color: '#51463d',
    maxHeight: '260px',
    overflow: 'auto',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  pdfCandidateBox: {
    marginTop: '12px',
    border: '1px solid #eadfd4',
    borderRadius: '16px',
    padding: '16px',
    background: '#fffaf5',
  },
  candidateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
  },
  candidateItem: {
    display: 'grid',
    gap: '5px',
    padding: '11px',
    borderRadius: '13px',
    border: '1px solid #eadfd4',
    background: '#ffffff',
    color: '#241d18',
    fontSize: '12px',
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
  customFeeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
  },
  customFeeCard: {
    padding: '16px',
    border: '1px solid #eadfd4',
    borderRadius: '18px',
    background: '#fffaf5',
  },
  customFeeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  customFeeList: {
    display: 'grid',
    gap: '12px',
  },
  customFeeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 150px 1fr auto',
    gap: '10px',
    alignItems: 'end',
    padding: '12px',
    borderRadius: '14px',
    border: '1px solid #eadfd4',
    background: '#fff',
  },
  deleteButton: {
    border: '1px solid #e0b4a8',
    borderRadius: '999px',
    padding: '10px 14px',
    background: '#fff6f3',
    color: '#a33c24',
    fontWeight: 900,
    cursor: 'pointer',
  },
  emptyText: {
    margin: 0,
    color: '#8a7b70',
    fontSize: '13px',
    lineHeight: 1.6,
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
  jsonTextarea: {
    width: '100%',
    minHeight: '220px',
    boxSizing: 'border-box',
    border: '1px solid #ded2c7',
    borderRadius: '13px',
    padding: '14px',
    lineHeight: 1.65,
    resize: 'vertical',
    color: '#241d18',
    background: '#fffdfb',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
  },
  jsonActionRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: '12px',
    color: '#6f6258',
    fontSize: '13px',
    lineHeight: 1.6,
  },
};
