# NPM, Node, Template 관련한 설명 

> NPM = Node Package Manager
```text
NPM 을 통해서 Node에서 편하게 쓸 수 있는 라이브러리, 프레임워크들을 관리(다운로드,삭제,etc) 할 수 있다.
근데, 실질적으로 서버를 구동하는건 NPM이 아니고 Node 다.
NPM은 그냥 Node를 편하게 쓸 수 있게해주는 서포터다.
자바스크립트 파일을 짰을때 구동시켜주는건 Node다.
```

> Node = 구글 크롬의 V8 가상머신 자바스크립트 실행 환경에 기반을 둔 빠르고 확장성 있는 네트워크 애플리케이션을 만들기 위한 플랫폼
```text
쉽게 요약하면, 자바스크립트 파일을 실행(= 번역) 시켜주는 서버프레임워크
```

> 그래서 Node가 어떻게 돌아가는거야?
```text
# 개념버전
node index.js 를 통해서 js 파일을 실행(=번역) 해주는 건데, package.json 이라는 파일을 통해서 번역 할 때 어떤 라이브러리들을 썼는지, 어떤 환경으로 구동하는지 등의 기초적인 설정값들을 참고해서 실행(=번역) 하는 것이다.
    
# 실제버전
package.json에 dependencies 를 npm을 통해서 install 하면, node_modules 라는 폴더 아래에 라이브러리 소스들이 다운로드 받아지고,
index.js 내에 Route 혹은 Controller 등의 자바스크립트 소스에서 require (=import) 하여 사용하고 있는 것이다.
그래서 index.js 를 실행(=번역) 시키는건 사실 package.json 과는 상관이 없다.
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
