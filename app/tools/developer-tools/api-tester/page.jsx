'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reformatJson } from '../../../lib/jsonText';
import { buildApiRequest } from '../../../lib/apiTesterRequest';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function ApiTesterPage() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const send = async () => {
    setLoading(true);
    try {
      // Content-Type is sent only with a body (29/09): forcing it on every GET
      // made the browser send a CORS preflight, so APIs that allow simple
      // cross-origin GETs but not preflights failed here and nowhere else.
      // P37: a relative address is refused, and a typed Content-Type replaces
      // the default in any capitalization (app/lib/apiTesterRequest.js).
      const req = buildApiRequest({ url, method, headersText: headers, body });
      const res = await fetch(req.url, req.init);
      const text = await res.text();
      // The body is shown as received (re-indented when it is JSON), so a
      // 64-bit id is not rounded by JSON.parse + stringify.
      let data;
      try { data = reformatJson(text, 2); } catch { data = text; }
      setResponse({ status: res.status, statusText: res.statusText, data });
    } catch (e) { reportShownMessage(e); setResponse({ error: e.message }); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">API Tester</h1>
        <p className="text-neutral-500 text-center mb-8">Test REST API endpoints</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-3">
            <select aria-label="HTTP method" value={method} onChange={e => setMethod(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-semibold">
              {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
            </select>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="https://api.example.com/endpoint" />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Headers (JSON)</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm h-16 resize-none font-mono" placeholder='{"Authorization": "Bearer token"}' value={headers} onChange={e => setHeaders(e.target.value)} /></div>
          {method !== 'GET' && <div><label className="block text-sm text-neutral-500 mb-1">Body</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm h-32 resize-none font-mono" placeholder='{"key": "value"}' value={body} onChange={e => setBody(e.target.value)} /></div>}
          <button onClick={send} disabled={!url || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{loading ? 'Sending...' : 'Send Request'}</button>
          {response && <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2"><div className={response.error ? 'text-red-400' : response.status < 400 ? 'text-green-400' : 'text-yellow-400'}>{response.error ? response.error : `${response.status} ${response.statusText}`}</div><pre className="font-mono text-sm overflow-x-auto text-indigo-400">{response.data}</pre></div>}
        </div>
      </div>
      <SeoContent
        title="API Tester"
        description={"API Tester sends one HTTP request at a time from your browser, with its built-in fetch(), to the full http:// or https:// address you type, and shows the status code and the response body. The methods are GET, POST, PUT, DELETE and PATCH; headers are written as a JSON object, and a body can be added to every method except GET. A JSON response is re-indented from the text received, so long numbers keep every digit; any other body is shown as plain text. Response headers and timing are not displayed, and requests are not saved. Because the request leaves from your browser, the API's CORS rules decide whether the response can be read."}
        example={{
          caption: "How a JSON response body is displayed (the page’s own formatter, run on this body): the 64-bit id and the trailing zero of 1.10 stay exactly as sent.",
          inputLabel: "Response body as received",
          input: "{\"id\":9007199254740993,\"price\":1.10,\"tags\":[\"a\",\"b\"]}",
          outputLabel: "Shown under the status line",
          output: "{\n  \"id\": 9007199254740993,\n  \"price\": 1.10,\n  \"tags\": [\n    \"a\",\n    \"b\"\n  ]\n}",
        }}
        howToTitle={"How to send an API request from your browser"}
        howTo={[
          "Pick the method in the list (GET, POST, PUT, DELETE or PATCH) and type the full URL of the endpoint, starting with https:// or http://; any other address is refused and nothing is sent.",
          "Optionally fill \"Headers (JSON)\" with an object, for example {\"Authorization\": \"Bearer token\"}.",
          "For any method other than GET, type the request in \"Body\"; it is sent as application/json unless your headers set Content-Type, in any capitalization.",
          "Click \"Send Request\": the status appears in green below 400, in yellow from 400, or in red if the request failed, with the body underneath.",
        ]}
        specs={[
          { label: "Methods", value: "GET, POST, PUT, DELETE and PATCH (HEAD and OPTIONS are not offered)" },
          { label: "Address", value: "An absolute http:// or https:// URL; a relative address such as /api/users, or one typed without http:// or https://, is refused before sending" },
          { label: "Request headers", value: "A JSON object; if it is not valid JSON, or not an object, the request is not sent and a message says why" },
          { label: "Request body", value: "Any text, for every method except GET; Content-Type: application/json is added; a Content-Type key in your headers replaces it, whatever its capitalization" },
          { label: "Response shown", value: "Status code and status text, then the body (JSON re-indented, other text as received); response headers are not shown" },
          { label: "Timeout", value: "None: the page waits until the server answers or the browser gives up" },
        ]}
        privacyTitle={"Where your request goes"}
        privacy={"The request goes from your browser straight to the http:// or https:// address you type, not through our servers; an address without one of them is refused before anything is sent. A shown error’s cleaned message goes to our error log with the tool’s name and your browser’s name and version; URLs, quoted text and long numbers are removed, but a few characters of a mistyped header can remain."}
        faqs={[
          { q: "Can I call an API that does not allow cross-origin requests?", a: "No. The request runs in your browser, so the browser applies the API’s CORS rules: if the API does not allow this site, the response is blocked and only the browser’s network error message appears. Desktop clients such as curl or Postman are not subject to that check." },
          { q: "Does it show the response headers?", a: "No. The result shows the status code, the status text and the body only. To read a header such as a rate-limit counter, open your browser’s developer tools, where the network panel lists every header of the same request." },
          { q: "Is a Content-Type header added automatically?", a: "Yes, but only when a body is sent: POST, PUT, DELETE and PATCH requests with a body get Content-Type: application/json, and a Content-Type key in your headers replaces it, written in any capitalization, so only one value is sent. GET requests carry no Content-Type, so they do not trigger an extra CORS preflight." },
          { q: "Why is my address refused?", a: "It does not start with https:// or http://. A browser reads an address such as /api/users or api.example.com/users as a page of the site you are on, so the request would reach this site with your headers. The tool stops instead; add the scheme and send again." },
          { q: "Will large numbers in a JSON response be rounded?", a: "No. The body is re-indented from the exact text received instead of being parsed and rewritten, so an id such as 9007199254740993 or a price written 1.10 is shown exactly as the API sent it." },
        ]}
        tips={[
          "If the API returns a JWT, paste it into JWT Decoder to read its claims.",
          "When only a network error appears, open the same GET address in a new tab: if it loads there, the API is most likely refusing cross-origin reads.",
        ]}
      />
    </div>
  );
}