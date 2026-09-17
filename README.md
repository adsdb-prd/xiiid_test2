# XIIID AI Labs — GitHub 호스팅 패키지

## GitHub Pages에 올리기
1. GitHub에서 새 저장소를 만듭니다. 간단히 시작하려면 공개(Public) 저장소를 사용하세요.
2. ZIP을 풀고 **이 README.md와 package.json이 있는 폴더의 내용 전체**를 저장소 최상위에 업로드합니다. ZIP 파일 자체를 올리는 것이 아닙니다. `.github/workflows/deploy.yml`도 반드시 포함하세요. GitHub Desktop으로 폴더 전체를 커밋하면 누락을 줄일 수 있습니다.
3. 저장소의 **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택합니다.
4. **Actions → Deploy GitHub Pages → Run workflow**를 실행합니다. 이후 main 또는 master에 변경사항을 올리면 자동 배포됩니다.
5. 작업이 성공하면 Settings → Pages에 표시되는 사이트 주소로 접속합니다.

배포 과정에서 GitHub가 알려주는 저장소 경로를 자동 적용합니다. 사용자 사이트, `/저장소이름/` 주소, Pages에 연결한 커스텀 도메인을 지원합니다. 커스텀 도메인을 바꾸면 워크플로를 다시 실행하세요.

## 로컬 실행
Node.js 22 이상을 설치한 뒤 이 폴더에서 실행하세요. 추가 패키지 설치는 필요 없습니다.

```sh
npm run build
npm start
```

브라우저에서 http://127.0.0.1:4175 에 접속합니다. 종료는 Ctrl+C입니다.

## 파일 수정 위치
- `site/index.html`: HTML 및 메타 태그
- `site/brand/sections.js`: 섹션 문구, 팀, 뉴스, 링크, 팝업
- `site/brand/sections.css`, `site/brand/brand.css`: 스타일
- `site/brand/brand-x.js`: 3D 배경
- `site/brand/`: 이미지와 영상
- `site/content/home-response.json`, `site/_payload.json`: 저장된 콘텐츠
- `site/local.js`: 저장된 콘텐츠 연결 및 브라우저 보정
- `scripts/build.mjs`: 정적 파일 생성 및 배포 경로 변환
- `.github/workflows/deploy.yml`: GitHub Pages 자동 배포
- `dist/`: 루트 주소용 빌드 결과. 일반 정적 호스팅에 바로 업로드 가능

다른 Git 연동 정적 호스팅에서는 빌드 명령 `npm run build`, 출력 폴더 `dist`, Node.js 22 이상을 설정하세요.

## 제공 범위
원본 ZIP에 있던 Nuxt 실행 번들과 HTML/CSS/JavaScript를 보존한 정적 웹사이트입니다. 원본 `.vue` 파일 및 Nuxt 개발 프로젝트는 ZIP에 없으므로 복원된 개발 프로젝트는 아닙니다. 수정 가능한 사용자 정의 코드는 `site/brand/`에 있습니다.

백엔드나 CMS 서버가 필요하지 않습니다. Blog 외의 콘텐츠는 저장된 스냅샷입니다. Blog는 Medium RSS에서 최신 글 3개를 배포 시 가져옵니다. 외부 서비스 링크는 인터넷 연결이 필요합니다. 원본의 검색엔진 차단 메타 태그(noindex,nofollow)도 유지했습니다. 검색 노출이 필요하면 `site/index.html`과 `site/token.html`에서 해당 태그를 변경하세요.

누락되어 있던 공유 이미지 경로는 포함된 뉴스 이미지로 연결했습니다.

## 2026-09-17 수정
- 헤더 로고 확대, 헤더·푸터·Partners wall의 최대 폭을 본문과 같은 132rem으로 통일
- Partners wall을 3줄로 배치하고 기존 34개 로고 보존
- XClass Pro / XClass 명칭 적용, OPicUP 및 EOSaber 서비스 버튼 추가
- Projects / Ecosystem / News / Token 메뉴와 XClass 버튼
- Token 팝업 대신 `site/token.html` 별도 페이지 제공
- 섹션별 배경 효과를 공통 배경으로 통합해 단절 제거
- News 아래 작은 Blog 카드 3개: `site/content/blog.json`

### Medium 자동 갱신
`scripts/update-blog.py`가 공식 RSS를 읽어 발행일 내림차순으로 3개를 저장합니다. API 키나 유료 RSS 프록시는 필요하지 않습니다. GitHub Actions 배포 워크플로는 푸시·수동 실행 및 약 6시간 간격으로 작동하며, 배포 전에 글을 갱신합니다. 즉시 알림 방식은 아니며 GitHub 예약 실행은 지연될 수 있습니다. 공개 저장소의 예약 워크플로는 장기 비활동 시 중지될 수 있으므로 Actions 활성 상태를 유지하세요. RSS 실패 시 저장소에 포함된 글을 사용해 사이트 표시를 유지하고 Actions에 경고를 남깁니다.

로컬 갱신: `python scripts/update-blog.py` (Python 3.10 이상, 표준 라이브러리만 사용).

## 확인 결과
루트(`/`) 및 저장소 하위(`/xiiid-site/`) 빌드 성공. 검사 대상 로컬 정적 자산 경로 누락 없음. JavaScript 구문 검사 통과. 브라우저 주요 동작과 모바일 화면을 점검했습니다. 상세 결과는 FINAL-CHECK.md를 참고하세요. 실제 GitHub 배포 및 모든 외부 서비스 동작 검증은 별도입니다.

공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

