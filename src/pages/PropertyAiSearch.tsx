import { useMemo, useState, type CSSProperties } from 'react';

type Rank = 'A추천' | 'B후보' | 'C확인필요' | '탈락';

type AnalysisResult = {
  rank: Rank;
  score: number;
  buildingName: string;
  roomNo: string;
  address: string;
  nearestStation: string;
  lineName: string;
  walkMinutes: number | null;
  rent: number | null;
  managementFee: number | null;
  totalCost: number | null;
  layout: string;
  areaSqm: number | null;
  floor: number | null;
  structure: string;
  builtYear: string;
  facing: string;
  gasType: string;
  equipment: string[];
  strengths: string[];
  cautions: string[];
  checkNeeded: string[];
  rejectionReasons: string[];
  rawEvidence: string;
};

type AnalysisResponse = {
  summary: {
    totalRoomsAnalyzed: number;
    recommendedCount: number;
    bCandidateCount: number;
    checkNeededCount: number;
    rejectedCount: number;
    pdfQualityMemo: string;
  };
  results: AnalysisResult[];
  customerMessage: string;
  warnings: string[];
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

function parseBudget(text: string) {
  const normalized = text
    .replace(/[：]/g, ':')
    .replace(/[，]/g, ',')
    .replace(/[〜～]/g, '~')
    .toLowerCase();

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
  ['1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK'].forEach((layout) => {
    if (new RegExp(layout, 'i').test(text)) layouts.push(layout);
  });

  if (text.includes('원룸') || text.includes('ワンルーム')) {
    layouts.push('1R');
  }

  return Array.from(new Set(layouts));
}

function parseMinFloor(text: string) {
  const match = text.match(/(\d+)\s*(층|階)\s*이상/);
  return match?.[1] ? Number(match[1]) : null;
}

function parseMaxWalkMinutes(text: string) {
  const rangeMatch = text.match(/도보\s*(\d+)\s*~\s*(\d+)\s*분/);
  if (rangeMatch?.[2]) return Number(rangeMatch[2]);

  const stationWalkRangeMatch = text.match(/역까지\s*도보\s*(\d+)\s*~\s*(\d+)\s*분/);
  if (stationWalkRangeMatch?.[2]) return Number(stationWalkRangeMatch[2]);

  const withinMatch = text.match(/도보\s*(\d+)\s*분\s*이내/);
  if (withinMatch?.[1]) return Number(withinMatch[1]);

  return null;
}

function buildConditionPreview(inquiry: string) {
  const budget = parseBudget(inquiry);
  const layouts = parseLayouts(inquiry);
  const minFloor = parseMinFloor(inquiry);
  const maxWalk = parseMaxWalkMinutes(inquiry);

  const must: string[] = [];
  const ng: string[] = [];
  const check: string[] = [];

  if (budget) must.push(`월세+관리비 ${budget.toLocaleString()}엔 이하`);
  if (layouts.length) must.push(`${layouts.join(' / ')} 타입`);
  if (minFloor) must.push(`${minFloor}층 이상`);
  if (maxWalk) must.push(`역 도보 ${maxWalk}분 이내`);
  if (inquiry.includes('오토록')) must.push('오토록');
  if (inquiry.includes('택배함') || inquiry.includes('무인택배')) must.push('택배BOX');
  if (inquiry.includes('철근콘크리트') || inquiry.toLowerCase().includes('rc')) must.push('RC/SRC/철근콘크리트 구조');
  if (inquiry.includes('도시가스')) must.push('도시가스');

  if (inquiry.includes('프로판')) ng.push('프로판가스');
  if (inquiry.includes('북향')) ng.push('북향');
  if (inquiry.includes('신이마미야')) ng.push('신이마미야 주변');
  if (inquiry.includes('선로')) ng.push('전철 선로 인접');
  if (inquiry.includes('시야') || inquiry.includes('고층건물')) ng.push('시야 차단');

  if (inquiry.includes('벌레')) check.push('벌레 리스크');
  if (inquiry.includes('방음')) check.push('방음');
  if (inquiry.includes('따뜻')) check.push('겨울철 단열/채광');
  if (inquiry.includes('24시간')) check.push('24시간 쓰레기');
  if (inquiry.includes('편의점') || inquiry.includes('마트') || inquiry.includes('약국')) check.push('주변 편의시설');

  return { budget, layouts, minFloor, maxWalk, must, ng, check };
}

function getRankStyle(rank: Rank): CSSProperties {
  if (rank === 'A추천') return styles.rankA;
  if (rank === 'B후보') return styles.rankB;
  if (rank === '탈락') return styles.rankFail;
  return styles.rankC;
}

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function buildResultsCsv(results: AnalysisResult[]) {
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
    '축년',
    '향',
    '가스',
    '설비',
    '장점',
    '주의',
    '확인필요',
    '탈락사유',
    '근거',
  ];

  const rows = results.map((result) => [
    result.rank,
    result.score,
    result.buildingName,
    result.roomNo,
    result.totalCost,
    result.rent,
    result.managementFee,
    result.address,
    result.lineName,
    result.nearestStation,
    result.walkMinutes,
    result.layout,
    result.areaSqm,
    result.floor,
    result.structure,
    result.builtYear,
    result.facing,
    result.gasType,
    result.equipment.join(' / '),
    result.strengths.join(' / '),
    result.cautions.join(' / '),
    result.checkNeeded.join(' / '),
    result.rejectionReasons.join(' / '),
    result.rawEvidence,
  ]);

  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

export default function PropertyAiSearch() {
  const [rawInquiry, setRawInquiry] = useState(sampleInquiry);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState('');

  const preview = useMemo(() => buildConditionPreview(rawInquiry), [rawInquiry]);

  const sortedResults = useMemo(() => {
    if (!analysis?.results) return [];

    const rankWeight: Record<Rank, number> = {
      A추천: 4,
      B후보: 3,
      C확인필요: 2,
      탈락: 1,
    };

    return [...analysis.results].sort((a, b) => {
      const rankDiff = rankWeight[b.rank] - rankWeight[a.rank];
      if (rankDiff !== 0) return rankDiff;
      return b.score - a.score;
    });
  }, [analysis]);

  const handleAnalyze = async () => {
    if (!pdfFile) {
      setErrorMessage('먼저 PDF 파일을 선택해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('inquiry', rawInquiry);

      const response = await fetch('/api/analyze-property-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `분석 요청 실패: ${response.status}`);
      }

      setAnalysis(data as AnalysisResponse);
    } catch (error: any) {
      setErrorMessage(error?.message || 'PDF 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      alert('복사에 실패했습니다. 직접 드래그해서 복사해주세요.');
    }
  };

  const downloadCsv = () => {
    const csv = buildResultsCsv(sortedResults);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `PDF매물분석_${new Date().toISOString().slice(0, 10)}.csv`;
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
            고객 문의 내용을 입력하고 RealnetPro PDF를 업로드하면, 서버 AI가 PDF를 읽어 조건에 가까운 매물을 자동 선별합니다.
          </p>
        </div>

        <div style={styles.statusBox}>
          <span style={styles.statusDot} />
          <div>
            <strong>서버 AI 분석 모드</strong>
            <p>브라우저 OCR 대신 서버 API가 PDF를 분석합니다. API 키는 서버 환경변수에만 저장합니다.</p>
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
            <h2 style={styles.panelTitle}>2. 조건 미리보기</h2>
            <p style={styles.panelSubText}>서버 AI 분석 전에 주요 조건을 간단히 확인합니다.</p>
          </div>

          <div style={styles.infoGrid}>
            <InfoItem label="월세+관리비 상한" value={preview.budget ? `${preview.budget.toLocaleString()}엔` : '미확인'} />
            <InfoItem label="희망 타입" value={preview.layouts.length ? preview.layouts.join(' / ') : '미확인'} />
            <InfoItem label="최소 층수" value={preview.minFloor ? `${preview.minFloor}층 이상` : '미확인'} />
            <InfoItem label="역 도보" value={preview.maxWalk ? `${preview.maxWalk}분 이내` : '미확인'} />
          </div>

          <div style={styles.conditionGridSmall}>
            <ConditionBox title="필수" items={preview.must} tone="must" />
            <ConditionBox title="NG" items={preview.ng} tone="ng" />
            <ConditionBox title="확인 필요" items={preview.check} tone="check" />
          </div>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeaderRow}>
          <div>
            <h2 style={styles.panelTitle}>3. RealnetPro PDF 서버 분석</h2>
            <p style={styles.panelSubText}>
              RealnetPro에서 「検索結果 PDF出力」로 받은 PDF를 업로드하세요. 분석은 서버에서 실행됩니다.
            </p>
          </div>

          {analysis && (
            <div style={styles.buttonRowNoMargin}>
              <button type="button" style={styles.secondaryButton} onClick={downloadCsv}>
                CSV 저장
              </button>
              <button type="button" style={styles.primaryButton} onClick={() => copyText('message', analysis.customerMessage)}>
                {copied === 'message' ? '복사 완료' : '추천문 복사'}
              </button>
            </div>
          )}
        </div>

        <div style={styles.uploadBox}>
          <input
            id="server-pdf-input"
            type="file"
            accept="application/pdf,.pdf"
            style={styles.hiddenInput}
            onChange={(event) => {
              setPdfFile(event.target.files?.[0] || null);
              setAnalysis(null);
              setErrorMessage('');
            }}
          />

          <button
            type="button"
            style={styles.uploadButton}
            onClick={() => document.getElementById('server-pdf-input')?.click()}
          >
            PDF 선택
          </button>

          <div style={styles.uploadInfo}>
            <strong>{pdfFile ? pdfFile.name : '선택된 PDF 없음'}</strong>
            <p style={styles.panelSubText}>
              82페이지처럼 큰 PDF는 분석에 시간이 걸릴 수 있습니다. 처음에는 같은 조건의 짧은 PDF로 테스트하면 더 빠릅니다.
            </p>
          </div>

          <button
            type="button"
            style={isAnalyzing ? styles.analyzeButtonDisabled : styles.analyzeButton}
            disabled={isAnalyzing}
            onClick={handleAnalyze}
          >
            {isAnalyzing ? '서버 분석 중...' : '서버 AI 분석 시작'}
          </button>
        </div>

        {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

        {analysis && (
          <>
            <div style={styles.resultSummaryGrid}>
              <SummaryCard label="분석 호실" value={analysis.summary.totalRoomsAnalyzed} />
              <SummaryCard label="A추천" value={analysis.summary.recommendedCount} />
              <SummaryCard label="B후보" value={analysis.summary.bCandidateCount} />
              <SummaryCard label="확인필요" value={analysis.summary.checkNeededCount} />
              <SummaryCard label="탈락" value={analysis.summary.rejectedCount} />
            </div>

            {analysis.summary.pdfQualityMemo && (
              <div style={styles.noticeBox}>
                <strong>PDF 판독 메모</strong>
                <p>{analysis.summary.pdfQualityMemo}</p>
              </div>
            )}

            {analysis.warnings?.length > 0 && (
              <div style={styles.warningBox}>
                <strong>주의사항</strong>
                <ul>
                  {analysis.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

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
                  {sortedResults.map((result, index) => (
                    <tr key={`${result.buildingName}-${result.roomNo}-${index}`}>
                      <td style={styles.td}>
                        <span style={{ ...styles.rankBadge, ...getRankStyle(result.rank) }}>
                          {result.rank}
                          <br />
                          {result.score}점
                        </span>
                      </td>
                      <td style={styles.td}>
                        <strong>{result.buildingName || '매물명 확인'}</strong>
                        <p style={styles.smallText}>{result.roomNo || '?'}호 · {result.address || '주소 확인'}</p>
                      </td>
                      <td style={styles.td}>
                        <strong>{result.totalCost ? `${result.totalCost.toLocaleString()}엔` : '확인'}</strong>
                        <p style={styles.smallText}>
                          {result.rent?.toLocaleString() ?? '?'} + {result.managementFee?.toLocaleString() ?? '?'}
                        </p>
                      </td>
                      <td style={styles.td}>
                        {result.nearestStation || '확인'}
                        <p style={styles.smallText}>{result.lineName || ''} · 도보 {result.walkMinutes ?? '?'}분</p>
                      </td>
                      <td style={styles.td}>
                        {result.layout || '확인'}
                        <p style={styles.smallText}>{result.areaSqm ?? '?'}㎡ · {result.structure || '구조 확인'}</p>
                      </td>
                      <td style={styles.td}>
                        {result.floor ?? '?'}층
                        <p style={styles.smallText}>{result.facing || '향 확인'}</p>
                      </td>
                      <td style={styles.td}>
                        <ul style={styles.compactList}>
                          {(result.strengths || []).slice(0, 4).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </td>
                      <td style={styles.td}>
                        <ul style={styles.compactList}>
                          {[...(result.rejectionReasons || []), ...(result.checkNeeded || []), ...(result.cautions || [])]
                            .slice(0, 5)
                            .map((item) => (
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
                  <p style={styles.panelSubText}>상위 후보 기준으로 자동 생성됩니다.</p>
                </div>
                <button type="button" style={styles.secondaryButton} onClick={() => copyText('message2', analysis.customerMessage)}>
                  {copied === 'message2' ? '복사 완료' : '복사'}
                </button>
              </div>
              <textarea style={styles.outputTextarea} value={analysis.customerMessage} readOnly />
            </div>
          </>
        )}
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>4. RealnetPro 검색 조건 후보</h2>
              <p style={styles.panelSubText}>PDF 출력 전 RealnetPro에서 입력하면 좋은 조건 후보입니다.</p>
            </div>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => copyText('realnet', buildRealnetMemo(rawInquiry))}
            >
              {copied === 'realnet' ? '복사 완료' : '조건 복사'}
            </button>
          </div>
          <textarea style={styles.outputTextareaSmall} value={buildRealnetMemo(rawInquiry)} readOnly />
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeaderRow}>
            <div>
              <h2 style={styles.panelTitle}>5. API 연결용 JSON</h2>
              <p style={styles.panelSubText}>서버로 전달되는 고객 조건 구조입니다.</p>
            </div>
            <button type="button" style={styles.secondaryButton} onClick={() => copyText('json', buildApiJson(rawInquiry))}>
              {copied === 'json' ? '복사 완료' : 'JSON 복사'}
            </button>
          </div>
          <pre style={styles.codeBox}>{buildApiJson(rawInquiry)}</pre>
        </div>
      </section>
    </section>
  );
}

function buildRealnetMemo(inquiry: string) {
  const preview = buildConditionPreview(inquiry);
  const lines: string[] = [];

  lines.push('RealnetPro PDF 출력 전 검색 조건 후보');
  lines.push('');

  if (preview.budget) {
    lines.push(`賃料+共益費 기준 희망 상한: ${preview.budget.toLocaleString()}円以下`);
    lines.push('주의: RealnetPro에서 賃料 조건만 넣으면 共益費 포함 총액 초과 매물이 섞일 수 있습니다.');
  }

  if (preview.layouts.length) lines.push(`間取り: ${preview.layouts.join(' / ')}`);
  if (preview.minFloor) lines.push(`所在階: ${preview.minFloor}階以上`);
  if (preview.maxWalk) lines.push(`駅徒歩: ${preview.maxWalk}分以内`);
  if (inquiry.includes('외국인') || inquiry.includes('外国人')) lines.push('フリーワード: 外国人');
  if (inquiry.includes('오토록')) lines.push('設備: オートロック');
  if (inquiry.includes('택배') || inquiry.includes('무인택배')) lines.push('設備: 宅配BOX');
  if (inquiry.includes('도시가스')) lines.push('設備/備考: 都市ガス');
  if (inquiry.includes('신이마미야')) lines.push('除外候補: 新今宮 / 動物園前 / 萩之茶屋 / 西成');

  return lines.join('\n');
}

function buildApiJson(inquiry: string) {
  const preview = buildConditionPreview(inquiry);

  return JSON.stringify(
    {
      inquiry,
      parsedPreview: preview,
    },
    null,
    2,
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

function ConditionBox({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'must' | 'ng' | 'check';
}) {
  const toneStyle = tone === 'must' ? styles.mustCard : tone === 'ng' ? styles.ngCard : styles.checkCard;

  return (
    <div style={{ ...styles.conditionBox, ...toneStyle }}>
      <strong>{title}</strong>
      {items.length ? (
        <ul style={styles.miniList}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={styles.emptyText}>자동 추출 없음</p>
      )}
    </div>
  );
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
  conditionGridSmall: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
    marginTop: '14px',
  },
  conditionBox: {
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #eadfd4',
  },
  mustCard: { background: '#eef7f0' },
  ngCard: { background: '#fff0ed' },
  checkCard: { background: '#fff8dc' },
  miniList: {
    margin: '8px 0 0',
    paddingLeft: '18px',
    lineHeight: 1.6,
  },
  uploadBox: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '16px',
    padding: '18px',
    borderRadius: '18px',
    border: '1px dashed #d3bda8',
    background: '#fffaf5',
  },
  uploadInfo: {
    minWidth: 0,
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
  analyzeButton: {
    border: 'none',
    borderRadius: '999px',
    padding: '13px 18px',
    background: '#8b5a2b',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  analyzeButtonDisabled: {
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
  errorBox: {
    marginTop: '16px',
    padding: '14px',
    borderRadius: '14px',
    background: '#fff0ed',
    border: '1px solid #e0b4a8',
    color: '#a33c24',
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
  noticeBox: {
    marginTop: '16px',
    padding: '14px',
    borderRadius: '14px',
    background: '#eef3ff',
    border: '1px solid #c7d7ff',
    lineHeight: 1.6,
  },
  warningBox: {
    marginTop: '16px',
    padding: '14px',
    borderRadius: '14px',
    background: '#fff8dc',
    border: '1px solid #ead2a8',
    lineHeight: 1.6,
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
  rankA: { background: '#e9f7ed', color: '#197b38' },
  rankB: { background: '#eef3ff', color: '#3157a5' },
  rankC: { background: '#fff6d7', color: '#8a6200' },
  rankFail: { background: '#fff0ed', color: '#b13b28' },
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
  emptyText: {
    margin: '8px 0 0',
    color: '#8a7b70',
    lineHeight: 1.6,
  },
};
