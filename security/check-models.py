"""Read-only model availability check. Set GEMINI_API_KEY in your environment."""
import json, os, urllib.request, urllib.parse
key = os.environ.get('GEMINI_API_KEY')
if not key:
    raise SystemExit('Set GEMINI_API_KEY in the environment; do not paste it into this file.')
models = {}; page = ''
while True:
    url = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000'
    if page: url += '&pageToken=' + urllib.parse.quote(page, safe='')
    req = urllib.request.Request(url, headers={'x-goog-api-key':key})
    with urllib.request.urlopen(req, timeout=20) as res: data = json.load(res)
    for m in data.get('models',[]): models[m['name'].removeprefix('models/')] = m
    page = data.get('nextPageToken')
    if not page: break
for name in ['gemini-3.5-flash-lite','gemini-3.1-flash-lite','gemini-3.8-flash','gemini-2.5-flash-lite','gemini-3-flash-preview','gemini-2.5-flash','gemma-4-31b-it']:
    available = 'generateContent' in models.get(name,{}).get('supportedGenerationMethods',[])
    print(name + ': ' + ('listed with generateContent support' if available else 'NOT LISTED with generateContent support'))
print('Listing does not prove quota, billing access or successful generation. Test one real KGMU question after deployment.')
