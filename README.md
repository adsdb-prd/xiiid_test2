# XIIID AI Labs — 웹사이트

HTML · CSS · JavaScript로 된 정적 사이트입니다. 빌드 도구나 프레임워크,
백엔드, CMS 없이 동작합니다. Blog 목록만 Medium에서 자동으로 갱신됩니다.

---

## 1. 내용을 고치고 싶을 때

**거의 모든 글자는 `site/index.html` 한 파일 안에 있습니다.** 파일을 열고
해당 문장을 찾아 고치면 됩니다. 섹션마다 앞에 "무엇을 어떻게 바꾸면 되는지"가
주석으로 적혀 있습니다.

| 고치고 싶은 것 | 파일 |
|---|---|
| 모든 섹션의 문구, 팀, 뉴스, 로드맵, 링크, 팝업 내용 | `site/index.html` |
| 페이지 제목 · 공유 썸네일(OG 태그) | `site/index.html` 상단 `<head>` |
| Token 페이지 | `site/token.html` |
| 색상 · 글꼴 · 여백 등 디자인 토큰 | `site/brand/brand.css` |
| 섹션 스타일 | `site/brand/sections.css` |
| 상단 스토리 블록 스타일 | `site/brand/story.css` |
| 동작(메뉴·스크롤·팝업·슬라이드) | `site/brand/sections.js` |
| 배경 3D X | `site/brand/brand-x.js` |
| 이미지 · 영상 · 폰트 | `site/brand/`, `site/webfonts/` |

### 자주 쓰는 규칙

- 팀원·뉴스·로드맵 항목을 추가하려면 기존 블록을 **통째로 복사**한 뒤 내용만 바꿉니다.
- Roadmap 항목에 `is-done` → 점이 채워짐 / 연도 블록에 `is-now` → "Now" 배지
- Ecosystem 배포 현황에 `is-live` → 초록색 "Live" 배지
- Partners 로고 벽은 한 벽 안에 `<div class="x-marquee-run">`이 **두 개** 있습니다.
  이어 붙여 무한 루프처럼 보이게 하는 구조라, 로고는 **두 곳 모두**에 넣어야 합니다.
- 프로젝트 카드의 "See more"는 `href="#project-ai-tutor"` →
  `id="modal-project-ai-tutor"` 팝업을 엽니다. 새 팝업은 이 두 id만 맞추면 됩니다.
- **Blog 섹션(`<div class="x-blog-list"></div>`)은 비워 두세요.** 아래 3번 참고.

---

## 2. 스타일시트 로드 순서

```
story.css  →  brand.css  →  sections.css
```

순서가 곧 우선순위입니다. `sections.css`가 마지막이므로, 다른 규칙을 이겨야 할
때는 여기에 씁니다. 각 파일 맨 위에 그 파일이 무엇을 담당하는지 주석이 있습니다.

---

## 3. Blog 자동 갱신

`scripts/update-blog.py`가 Medium 공식 RSS(`medium.com/feed/@xiiid`)를 읽어
최신 글 3개를 `site/content/blog.json`에 저장합니다. 페이지가 열릴 때
`sections.js`가 이 파일을 읽어 Blog 목록을 채웁니다.

- API 키나 유료 서비스가 필요 없습니다. Python 표준 라이브러리만 씁니다.
- 배포 워크플로가 **30분 간격**으로 실행되며, 배포 직전에 글을 갱신합니다.
- RSS를 못 읽으면 저장소에 들어 있는 기존 목록을 그대로 씁니다.
- 로컬에서 직접 갱신: `python scripts/update-blog.py` (Python 3.10+)

> GitHub의 예약 실행은 지연될 수 있고, 공개 저장소에서 오래 활동이 없으면
> 중지될 수 있습니다. Actions 탭이 활성 상태인지 가끔 확인해 주세요.

---

## 4. 배포

`main`(또는 `master`)에 올리면 GitHub Actions가 자동 배포합니다.

1. **Settings → Pages → Build and deployment → Source → GitHub Actions** 선택
2. 파일을 올리면 자동 배포. 수동 실행은 **Actions → Deploy GitHub Pages → Run workflow**
3. Settings → Pages에 표시되는 주소로 접속

저장소 경로(`/저장소이름/`)는 빌드가 자동으로 붙여줍니다. 사용자 사이트,
하위 경로, 커스텀 도메인 모두 지원합니다. 커스텀 도메인을 바꾸면 워크플로를
다시 실행하세요.

### ⚠️ 파일을 올릴 때 한 번에 올리세요

배포 워크플로는 30분마다도 돌기 때문에, 커밋을 여러 번 나눠 올리면 배포가
겹칩니다. 이때 **나중에 끝난 오래된 빌드가 최신 빌드를 덮어써서**, 분명히
고쳤는데 화면이 그대로인 현상이 생깁니다.

바꾼 파일은 **한꺼번에 드래그해서 한 번에 커밋**하고, Actions 탭에서 초록
체크를 확인한 뒤 다음 작업을 하세요.

---

## 5. 로컬에서 보기

Node.js 22 이상이 필요합니다. 추가 패키지 설치는 없습니다.

```sh
npm run build
npm start
```

http://127.0.0.1:4175 에서 확인합니다. 종료는 Ctrl+C.

- `npm run build` → `site/`를 `dist/`로 복사하면서 배포 경로를 붙입니다.
- `dist/`는 빌드 결과라 저장소에 올리지 않습니다(`.gitignore`).

---

## 6. 정식 오픈 전 확인할 것

- [ ] **검색엔진 차단 해제** — `site/index.html`과 `site/token.html`의
      `<meta name="robots" content="noindex,nofollow">` 한 줄씩을 삭제합니다.
      두 파일 모두 그 자리에 안내 주석이 달려 있습니다.
- [ ] **도메인 확인** — `site/index.html`의 `og:url`, `og:image`,
      `twitter:image`가 `https://xiiid.ai/` 기준으로 적혀 있습니다. 실제 주소가
      다르면 여기를 고쳐야 카카오톡·슬랙 공유 시 썸네일이 뜹니다.

---

## 7. 폴더 구조

```
.github/workflows/deploy.yml   GitHub Pages 배포
scripts/build.mjs              site/ → dist/ 빌드 (배포 경로 변환)
scripts/serve.mjs              로컬 미리보기 서버
scripts/update-blog.py         Medium RSS → content/blog.json
site/index.html                메인 페이지 (본문 전체가 여기 있습니다)
site/token.html                Token 페이지
site/content/blog.json         Blog 목록 (자동 생성, 직접 수정하지 마세요)
site/brand/                    CSS · JS · 이미지 · 영상
site/webfonts/                 Token 페이지용 ABC Repro
```

---

## 8. 이 사이트의 이력

원본은 Nuxt 실행 번들(약 1.9MB)이 CMS에서 받아둔 JSON을 읽어 화면을 그리는
구조였습니다. 문구 한 줄을 바꾸려면 JSON을 고쳐야 했고, 페이지 내용이
JavaScript 없이는 아무것도 보이지 않았습니다.

번들을 걷어내고 모든 내용을 `index.html`에 정적 HTML로 옮겼습니다. 그 결과:

- 본문 수정이 HTML 편집으로 끝납니다
- JavaScript가 꺼져 있어도 페이지 전체가 보입니다 (검색엔진·미리보기 봇 포함)
- 저장소에서 약 2.9MB가 사라졌고, 첫 로딩에서 받는 양도 크게 줄었습니다

`sections.js`는 화면을 그리지 않고 **동작만** 담당합니다 — 모바일 메뉴, 로고
클릭, 앵커 스크롤, 팝업, News 슬라이드, Blog 목록 로딩, 푸터 영상 재생,
스크롤 등장 효과. 파일 맨 위에 목록이 있습니다.
