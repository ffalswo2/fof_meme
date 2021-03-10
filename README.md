# NPM, Node, Template

> NPM : Node Package Manager
```text
Node에서 라이브러리, 프레임워크들을 편하게 쓸 수 있도록 관리해주는 이름 그대로 노드 패키지 매니저이다.
```

> Node : 구글 크롬의 V8 가상머신, 자바스크립트 실행 환경에 기반을 둔 빠르고 확장성 있는 네트워크 어플리케이션을 위한 Platform
```text
실질적으로 서버를 구동하는 주체, Javascript 파일을 실행시켜주는 서버 프레임워크
```

> Node의 작동 방식
```text
package.json에 dependencies를 npm을 통해서 install 하면, node_modules 라는 폴더 아래에 라이브러리 소스들이 다운로드 받아지고
index.js 내에서 Route 혹은 Controller 등의 Javascript 소스에서 require(import) 하여 사용하는 것이다.
따라서 index.js를 실행시키는 것 자체는 packaga.json과는 아무 상관이 없다.
```

---
```text
소프트스퀘어드 노드 템플릿 에서는 Node, Express Framwork, MVC (Route, Controller) 로 구성되어있고,
데이터베이스 모듈(= 라이브러리)는 mysql2 을 사용하여 DB와 통신하고있다. 설정파일은 /config/database.js 에 있다.

그리고 winston 이라는 모듈와 winston-daily-rotate-file 이라는 모듈 사용하여 Logger (=/config/winston.js) 를 구축해놓았다.
Firebase나 토큰이나 누군가에게 공개해선 안되는 키값들은 /config/secret.js 라는 곳에 모아놓고있다.

jwt 는 /config/jwtMiddleware.js 에서 검증을 jwtMiddleware 라는 자체모듈로 만들어서 사용하고있다. 이거는 route 파일에서 체이닝 방식으로 사용하고있다. (예제는 /app/routes/* 에 있는 파일을 참고하면 된다.)

express 는 /config/express.js 에 설정 값들이 모여있다. 기본 설정들은 해놓았는데 필요한 설정이 있다면 이 파일로 가서 추가/수정/삭제를 하면 된다.
```
