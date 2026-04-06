import urllib.request, json, urllib.error
req = urllib.request.Request(
    'https://suyambu08.pythonanywhere.com/api/gemini-chat/', 
    data=json.dumps({'contents': [{'parts': [{'text': 'hi'}]}]}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}, 
    method='POST'
)
try:
    resp = urllib.request.urlopen(req)
    print('SUCCESS:', resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('FAIL:', e.read().decode('utf-8'))
