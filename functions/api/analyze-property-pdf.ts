type Env = {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      ...JSON_HEADERS,
      Allow: 'POST, OPTIONS',
    },
  });
};

export const onRequestPost = async (context: any) => {
  const env = context.env as Env;
  const request = context.request as Request;

  if (!env.OPENAI_API_KEY) {
    return jsonResponse(
      {
        error:
          'OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다. Cloudflare Pages 환경변수에 OPENAI_API_KEY를 추가해주세요.',
      },
      500,
    );
  }

  try {
    const formData = await request.formData();
    const pdf = formData.get('pdf');
    const inquiry = String(formData.get('inquiry') || '');

    if (!(pdf instanceof File)) {
      return jsonResponse({ error: 'PDF 파일이 전달되지 않았습니다.' }, 400);
    }

    if (!inquiry.trim()) {
      return jsonResponse({ error: '고객 조건 내용이 비어 있습니다.' }, 400);
    }

    if (!pdf.name.toLowerCase().endsWith('.pdf')) {
      return jsonResponse({ error: 'PDF 파일만 업로드할 수 있습니다.' }, 400);
    }

    const uploadedFile = await uploadFileToOpenAI(pdf, env.OPENAI_API_KEY);
    const fileId = uploadedFile.id;

    if (!fileId) {
      return jsonResponse({ error: 'OpenAI 파일 업로드 결과에서 file_id를 확인하지 못했습니다.' }, 502);
    }

    const model = env.OPENAI_MODEL || 'gpt-5.5';

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                file_id: fileId,
              },
              {
                type: 'input_text',
                text: buildPrompt(inquiry, pdf.name),
              },
            ],
          },
        ],
      }),
    });

    const responseJson: any = await response.json().catch(() => null);

    await safeDeleteOpenAIFile(fileId, env.OPENAI_API_KEY);

    if (!response.ok) {
      return jsonResponse(
        {
          error: 'OpenAI PDF 분석 요청에 실패했습니다.',
          detail: responseJson?.error?.message || responseJson,
        },
        502,
      );
    }

    const outputText = extractOutputText(responseJson);
    const parsed = parseJsonFromText(outputText);

    if (!parsed) {
      return jsonResponse(
        {
          error: 'AI 분석 결과를 JSON으로 해석하지 못했습니다.',
          rawOutput: outputText,
        },
        502,
      );
    }

    const normalized = normalizeAnalysis(parsed);

    return jsonResponse(normalized, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error?.message || 'PDF 분석 중 알 수 없는 오류가 발생했습니다.',
      },
      500,
    );
  }
};

async function uploadFileToOpenAI(file: File, apiKey: string) {
  const form = new FormData();
  form.append('purpose', 'user_data');
  form.append('file', file, file.name);

  const response = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  const json: any = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error?.message || 'OpenAI 파일 업로드에 실패했습니다.');
  }

  return json;
}

async function safeDeleteOpenAIFile(fileId: string, apiKey: string) {
  try {
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  } catch {
    // 분석은 이미 끝났으므로 삭제 실패는 사용자 화면을 막지 않습니다.
  }
}

function buildPrompt(inquiry: string, filename: string) {
  return `당신은 일본 임대 매물 PDF를 분석하는 부동산 업무 보조 AI입니다.

아래 고객 조건과 첨부된 RealnetPro/リアプロ PDF 파일을 비교해서, 고객에게 제안 가능한 매물을 추천도 순으로 정리하세요.

[PDF 파일명]
${filename}

[고객 조건]
${inquiry}

[분석 규칙]
1. PDF에서 가능한 한 많은 호실을 읽으세요.
2. 매물명, 호실, 주소, 노선, 역, 도보분수, 월세, 관리비, 총액, 타입, 면적, 층수, 구조, 축년, 향, 가스, 설비, 外国人契約可能 여부를 추출하세요.
3. 월세 조건은 반드시 "賃料 + 共益費/管理費" 합계 기준으로 판단하세요.
4. 고객이 월세+관리비 75,000엔 이하를 원하면, 賃料가 70,000~75,000엔이라도 共益費 포함 총액이 75,000엔을 넘으면 탈락입니다.
5. 고객이 3층 이상을 원하면 1~2층은 탈락입니다.
6. 고객이 1R/1K를 원하면 1LDK, 2K, 2DK, 3LDK 등은 탈락입니다.
7. 고객이 RC/철근콘크리트를 원하면 木造는 탈락입니다. 鉄筋コンクリート造 또는 鉄骨鉄筋コンクリート造는 적합합니다.
8. 고객이 북향 제외를 원하면 北向, 北西向, 西北向, 北東向 등 北이 들어간 향은 탈락 또는 강한 주의로 분류하세요.
9. 고객이 프로판가스 제외를 원하면 プロパンガス는 탈락입니다.
10. 고객이 오토록/宅配BOX를 원하면 本体設備와 設備欄에서 확인하세요.
11. "外国人契約可能"은 장점이지만, 워킹홀리데이 1년 심사 가능 여부는 별도 확인필요에 넣으세요.
12. 방음, 벌레, 겨울철 따뜻함, 치안, 선로 인접, 시야 차단, 주변 편의시설은 PDF만으로 확정하지 말고 확인필요에 넣으세요.
13. PDF OCR이 불완전하면 추정하지 말고 rawEvidence에 판독 근거를 남기세요.
14. 너무 많은 매물이 있으면 조건에 가장 가까운 상위 50건까지만 results에 넣으세요. 단, summary.totalRoomsAnalyzed에는 PDF에서 확인한 전체 호실 수 추정치를 넣으세요.
15. 같은 건물의 여러 호실도 조건이 다르면 각각 별도 결과로 넣으세요.

[추천도 기준]
- A추천: 주요 필수조건을 대부분 충족하고 바로 제안 가능한 후보
- B후보: 핵심 조건은 맞지만 일부 확인 필요
- C확인필요: 탈락은 아니지만 확인 항목이 많음
- 탈락: 예산 초과, 타입 불일치, 층수 불일치, 목조, 프로판, 북향, 제외지역 등 명확한 NG

[반환 형식]
반드시 아래 JSON 객체 하나만 반환하세요. 설명문, 마크다운, 코드블록은 붙이지 마세요.

{
  "summary": {
    "totalRoomsAnalyzed": 0,
    "recommendedCount": 0,
    "bCandidateCount": 0,
    "checkNeededCount": 0,
    "rejectedCount": 0,
    "pdfQualityMemo": ""
  },
  "results": [
    {
      "rank": "A추천",
      "score": 0,
      "buildingName": "",
      "roomNo": "",
      "address": "",
      "nearestStation": "",
      "lineName": "",
      "walkMinutes": null,
      "rent": null,
      "managementFee": null,
      "totalCost": null,
      "layout": "",
      "areaSqm": null,
      "floor": null,
      "structure": "",
      "builtYear": "",
      "facing": "",
      "gasType": "",
      "equipment": [],
      "strengths": [],
      "cautions": [],
      "checkNeeded": [],
      "rejectionReasons": [],
      "rawEvidence": ""
    }
  ],
  "customerMessage": "",
  "warnings": []
}`;
}

function extractOutputText(responseJson: any) {
  if (typeof responseJson?.output_text === 'string') {
    return responseJson.output_text;
  }

  const chunks: string[] = [];

  for (const item of responseJson?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join('\n');
}

function parseJsonFromText(text: string) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        // fall through
      }
    }

    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch?.[0]) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
}

function normalizeAnalysis(data: any) {
  const results = Array.isArray(data?.results) ? data.results : [];

  const normalizedResults = results.map((item: any) => {
    const rent = toNullableNumber(item.rent);
    const managementFee = toNullableNumber(item.managementFee);
    const totalCost = toNullableNumber(item.totalCost) ?? (rent !== null && managementFee !== null ? rent + managementFee : null);

    return {
      rank: normalizeRank(item.rank),
      score: toNumber(item.score, 0),
      buildingName: toStringValue(item.buildingName),
      roomNo: toStringValue(item.roomNo),
      address: toStringValue(item.address),
      nearestStation: toStringValue(item.nearestStation),
      lineName: toStringValue(item.lineName),
      walkMinutes: toNullableNumber(item.walkMinutes),
      rent,
      managementFee,
      totalCost,
      layout: toStringValue(item.layout),
      areaSqm: toNullableNumber(item.areaSqm),
      floor: toNullableNumber(item.floor),
      structure: toStringValue(item.structure),
      builtYear: toStringValue(item.builtYear),
      facing: toStringValue(item.facing),
      gasType: toStringValue(item.gasType),
      equipment: toStringArray(item.equipment),
      strengths: toStringArray(item.strengths),
      cautions: toStringArray(item.cautions),
      checkNeeded: toStringArray(item.checkNeeded),
      rejectionReasons: toStringArray(item.rejectionReasons),
      rawEvidence: toStringValue(item.rawEvidence),
    };
  });

  const recommendedCount = normalizedResults.filter((item: any) => item.rank === 'A추천').length;
  const bCandidateCount = normalizedResults.filter((item: any) => item.rank === 'B후보').length;
  const checkNeededCount = normalizedResults.filter((item: any) => item.rank === 'C확인필요').length;
  const rejectedCount = normalizedResults.filter((item: any) => item.rank === '탈락').length;

  return {
    summary: {
      totalRoomsAnalyzed: toNumber(data?.summary?.totalRoomsAnalyzed, normalizedResults.length),
      recommendedCount: toNumber(data?.summary?.recommendedCount, recommendedCount),
      bCandidateCount: toNumber(data?.summary?.bCandidateCount, bCandidateCount),
      checkNeededCount: toNumber(data?.summary?.checkNeededCount, checkNeededCount),
      rejectedCount: toNumber(data?.summary?.rejectedCount, rejectedCount),
      pdfQualityMemo: toStringValue(data?.summary?.pdfQualityMemo),
    },
    results: normalizedResults,
    customerMessage: toStringValue(data?.customerMessage) || buildFallbackMessage(normalizedResults),
    warnings: toStringArray(data?.warnings),
  };
}

function normalizeRank(value: any) {
  const rank = String(value || '');

  if (rank.includes('A')) return 'A추천';
  if (rank.includes('B')) return 'B후보';
  if (rank.includes('탈락') || rank.includes('NG')) return '탈락';
  return 'C확인필요';
}

function toStringValue(value: any) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function toStringArray(value: any) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function toNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: any) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function buildFallbackMessage(results: any[]) {
  const candidates = results.filter((item) => item.rank !== '탈락').slice(0, 8);

  if (!candidates.length) {
    return '현재 PDF 안에서 바로 추천 가능한 매물은 확인되지 않았습니다.';
  }

  return candidates
    .map((item, index) => {
      return `${index + 1}. ${item.buildingName} ${item.roomNo}호
- 추천도: ${item.rank} / ${item.score}점
- 월세+관리비: ${item.totalCost ? `${item.totalCost.toLocaleString()}엔` : '확인 필요'}
- 역: ${item.nearestStation || '확인 필요'} 도보 ${item.walkMinutes ?? '?'}분
- 확인 필요: ${(item.checkNeeded || []).slice(0, 3).join(' / ') || '별도 확인 필요'}`;
    })
    .join('\n\n');
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}
