import urllib.request
import json

try:
    resp = urllib.request.urlopen("http://localhost:8000/openapi.json")
    data = json.loads(resp.read().decode("utf-8"))
    with open("routes.json", "w") as f:
        json.dump(list(data["paths"].keys()), f)
except Exception as e:
    with open("error.txt", "w") as f:
        f.write(str(e))
