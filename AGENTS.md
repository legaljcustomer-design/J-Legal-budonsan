# Permanent Project Rules for AI Agents

이 프로젝트는 현재 **오사카J부동산**의 공식 홈페이지이며, **완전한 정적 사이트(Static Site)** 구조를 유지하고 있습니다. 앞으로의 모든 작업에서 다음 수칙을 반드시 지켜주세요.

## 1. 외부 백엔드 도입 엄격 금지
어떠한 경우에도 다음 서비스나 기술을 새로 추가하거나 복구하지 마세요.
- **Firebase** (Firestore, Auth, Functions 등 전체)
- **기타 외부 DB** (Supabase, MongoDB, SQL 등)
- **백엔드 런타임** (Node.js API, Cloudflare Workers/Functions 등)
- **인증 시스템** (로그인, 관리자 가입 등)

## 2. 데이터 관리 원칙 (Static First)
모든 비즈니스 데이터는 프로젝트 내부의 정적 타입스크립트 파일에서 관리합니다.
- 매물 정보: `src/data/properties.ts`
- 고객 후기: `src/data/reviews.ts`
- 오사카 정보: `src/data/osakaInfo.ts`
- 사이트 설정: `src/data/siteConfig.ts`

데이터 수정 요청이 들어오면 위의 파일들을 직접 수정하여 반영하세요.

## 3. 정적 호스팅 최적화
- 이 사이트는 **Cloudflare Pages**에서 호스팅됩니다.
- 브라우저 런타임에서 외부 데이터를 조회하는 코드를 작성하지 마세요.
- 모든 콘텐츠는 배포 시점에 정적으로 생성되어야 합니다.

## 4. 관리자 기능 부재
현재 온라인 관리자 대시보드 기능을 사용하지 않습니다. 홈페이지 관리는 이 AI Studio 채팅을 통한 코드 수정으로만 수행됩니다.

---
*이 규칙은 2026년 5월 13일에 사용자의 요청으로 고정되었습니다.*
