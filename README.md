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

백엔드나 CMS 서버가 필요하지 않습니다. 콘텐츠는 저장된 스냅샷이며 자동 갱신되지 않습니다. 외부 서비스 링크는 인터넷 연결이 필요하고 원본의 외부 페이지 이동 동작을 유지했습니다. 원본의 검색엔진 차단 메타 태그(noindex,nofollow)도 유지했습니다. 검색 노출이 필요하면 `site/index.html`에서 해당 태그를 변경하세요.

누락되어 있던 공유 이미지 경로는 포함된 뉴스 이미지로 연결했습니다. 실제 GitHub 계정에 업로드하거나 배포하지는 않았습니다.

## 확인 결과
루트(`/`) 및 저장소 하위(`/xiiid-site/`) 빌드 성공. 검사 대상 로컬 정적 자산 경로 누락 없음. JavaScript 구문 검사 통과. 실제 GitHub 배포 및 브라우저 전체 동작 검증은 별도입니다.

공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
