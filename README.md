# XIIID AI Labs — 정리된 웹사이트 소스

HTML·CSS·JavaScript로 동작하는 정적 웹사이트입니다. 브라우저용 CSS와 JS는 각각 한 파일입니다. 추가 npm 패키지 설치 없이 실행할 수 있습니다.

## 실행과 빌드

Node.js 22 이상에서 다음 명령을 실행합니다.

```sh
npm run build
npm start
```

브라우저에서 `http://127.0.0.1:4175`를 엽니다. 종료는 Ctrl+C입니다. HTML 파일을 직접 더블클릭하면 루트 경로의 자산과 Blog JSON을 읽을 수 없으므로 HTTP 서버를 사용하세요.

`site/`가 원본 소스이고 `dist/`는 빌드 결과입니다. 수정 후 `npm run build`를 다시 실행하세요. 빌드는 기존 `dist/`를 지우고 새로 만듭니다. `dist/`는 저장소에 커밋하지 않습니다.

하위 경로 테스트(PowerShell):

```powershell
$env:BASE_PATH = '/preview/'
npm run build
npm start
# http://127.0.0.1:4175/preview/ 에서 확인
```

루트 경로로 돌아갈 때는 `Remove-Item Env:BASE_PATH` 후 다시 빌드합니다.

## 파일 구조와 수정 위치

```text
.github/workflows/deploy.yml   GitHub Pages 배포 및 Blog 갱신 일정
scripts/build.mjs             site → dist 복사, BASE_PATH 반영
scripts/serve.mjs             로컬 HTTP 서버
scripts/update-blog.py        Medium RSS → Blog JSON
site/index.html              메인 페이지의 문구·카드·모달·링크
site/token.html              Token 명세·분배 SVG·자료 링크
site/brand/site.css          브라우저용 통합 CSS
site/brand/site.js           브라우저용 통합 JS
site/brand/                  사용 중인 이미지·영상·Pretendard 폰트
site/content/blog.json       Blog 목록 및 RSS 조회 실패 시 기존 데이터
CHANGELOG.md                 변경 범위와 검증 결과
cleanup-manifest.json        삭제한 CSS 규칙·자산의 상세 기록
```

## CSS 편집 규칙

`site/brand/site.css`에는 다음 순서로 주석이 구분되어 있습니다.

1. 기본 초기화와 스토리 레이아웃 — 기존 story.css
2. 브랜드 색상·폰트·배경 — 기존 brand.css
3. 메뉴·섹션·모달·반응형 스타일 — 기존 sections.css
4. 시세 티커와 활동 카운터 — 기존 updates.css
5. Token 전용 스타일 — 기존 token.css

이 순서는 기존 페이지의 스타일 우선순위를 보존합니다. 동일 선택자가 여러 번 등장해도 반응형 조건이나 덮어쓰기 목적이 다르면 필요한 규칙입니다. 파일 전체를 선택자 이름순으로 정렬하거나 `!important`를 일괄 삭제하지 마세요. Token 전용 선택자는 `.x-token-page`, `.x-donut` 등으로 구분됩니다.

새 색상이나 글꼴을 바꾸려면 2번 영역의 `:root`와 `@font-face`부터 확인하세요. 폰트 라이선스는 `brand/fonts/Pretendard-LICENSE.txt`에 있습니다.

## JavaScript 편집 규칙

`site/brand/site.js`는 두 페이지에서 `defer`로 한 번만 로드합니다. 세 영역은 각자의 IIFE(즉시 실행 함수)로 분리되어 있어 지역 변수가 충돌하지 않습니다.

1. **3D 배경:** WebGL 메시·셰이더·카메라와 스크롤/포인터 반응. `.rubiks-canvas`가 없는 Token 페이지에서는 초기화하지 않습니다. WebGL을 사용할 수 없을 때의 이미지 대체 배경도 유지합니다.
2. **공통 동작:** 모바일 메뉴, 로고, 앵커 이동, 모달, News 이동 버튼, Blog 조회, 푸터 영상, 스크롤 등장 효과. 문구는 JS 대신 HTML에서 수정합니다.
3. **활동 카운터·시세:** Coinbase, CoinGecko 대체 조회, DEX Screener, 60초 갱신, 오래된 시세 표시. 외부 서비스 응답과 브라우저 네트워크 정책에 따라 표시가 달라질 수 있습니다.

함수 내부 주석은 이벤트 흐름, 계산 이유, 대체 동작을 설명합니다. CSS·JS를 수정해 배포할 때는 두 HTML의 `site.css?v=1`, `site.js?v=1` 버전을 함께 올리면 브라우저 캐시 갱신에 도움이 됩니다.

## 콘텐츠 수정

- 프로젝트 모달: `href="#project-ai-tutor"` 링크와 `id="modal-project-ai-tutor"`의 접미사를 맞춥니다.
- 팀·뉴스·로드맵: 해당 HTML 블록을 복사한 뒤 문구·이미지·링크를 변경합니다.
- Roadmap의 `is-done`은 완료, `is-now`는 현재 연도 표시입니다.
- Partners의 `.x-marquee-run` 두 벌은 끊김 없는 무한 이동용입니다. 불필요한 중복이 아니므로 유지하고, 로고를 바꾸면 두 벌을 함께 바꿉니다.
- 시세의 `.x-ticker-run`은 HTML에 한 벌만 작성합니다. JS가 나머지 한 벌을 자동 복제합니다.
- Blog의 `.x-blog-list`는 비워 두고 `content/blog.json`에서 채웁니다.
- Token 분배율을 바꾸면 SVG의 각도·레이블, CSS의 해당 `@keyframes`, 정지 및 동작 줄이기 상태의 `stroke-dasharray` 값을 함께 수정합니다.

## Blog 자동 갱신과 배포

```sh
python scripts/update-blog.py
```

Python 3.10 이상과 표준 라이브러리로 Medium RSS의 최신 글 3개를 갱신합니다. 조회 실패 시 기존 JSON을 유지합니다.

원본의 GitHub Actions 설정을 보존했습니다. `main`/`master` 푸시, 수동 실행, 30분 간격 예약 실행 시 Blog 갱신과 빌드를 거쳐 Pages로 배포합니다. GitHub 저장소의 Settings → Pages에서 GitHub Actions를 선택하세요. `BASE_PATH`는 워크플로가 전달하며, 동일 배포 그룹의 진행 중 실행은 취소하도록 설정되어 있습니다. 예약 실행의 실제 동작은 저장소 설정과 GitHub 상태에 따릅니다.

## 운영 설정

원본의 두 HTML에 있는 `noindex,nofollow`, 소셜 공유 주소, 외부 링크, 시세 API 및 배포 일정은 그대로 유지했습니다. 정식 공개 시에는 운영자가 검색 허용 여부와 실제 도메인을 확인한 뒤 변경하세요.

정리 작업의 구체적인 결과와 검증 범위는 `CHANGELOG.md`를 확인하세요.
