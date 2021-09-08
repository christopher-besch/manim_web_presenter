/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (() => {

eval("\n// download file and parse json\nfunction get_json(url, callback) {\n    let request = new XMLHttpRequest();\n    // set callback\n    request.onreadystatechange = () => {\n        // when a response has been received\n        if (request.readyState == 4) {\n            try {\n                // 200 is success\n                callback(JSON.parse(request.responseText), request.status == 200);\n            }\n            catch (error) {\n                callback(error, false);\n            }\n        }\n    };\n    request.open(\"GET\", url, true);\n    request.send();\n}\ndocument.body.onload = () => {\n    get_json(\"index.json\", (response, success) => {\n        console.log(response);\n    });\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvaW5kZXgudHMuanMiLCJtYXBwaW5ncyI6IkFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCIsInNvdXJjZXMiOlsid2VicGFjazovL21hbmltX3dlYl9wcmVzZW50ZXIvLi9zcmMvaW5kZXgudHM/ZTk0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbi8vIGRvd25sb2FkIGZpbGUgYW5kIHBhcnNlIGpzb25cbmZ1bmN0aW9uIGdldF9qc29uKHVybCwgY2FsbGJhY2spIHtcbiAgICBsZXQgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIC8vIHNldCBjYWxsYmFja1xuICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAvLyB3aGVuIGEgcmVzcG9uc2UgaGFzIGJlZW4gcmVjZWl2ZWRcbiAgICAgICAgaWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIDIwMCBpcyBzdWNjZXNzXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlVGV4dCksIHJlcXVlc3Quc3RhdHVzID09IDIwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvciwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdXJsLCB0cnVlKTtcbiAgICByZXF1ZXN0LnNlbmQoKTtcbn1cbmRvY3VtZW50LmJvZHkub25sb2FkID0gKCkgPT4ge1xuICAgIGdldF9qc29uKFwiaW5kZXguanNvblwiLCAocmVzcG9uc2UsIHN1Y2Nlc3MpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgIH0pO1xufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/index.ts\n");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/index.ts"]();
/******/ 	
/******/ })()
;