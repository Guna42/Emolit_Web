from app.main import app
routes = []
for r in app.routes:
    routes.append(getattr(r, 'path', getattr(r, 'name', str(r))))
with open('c:/Users/GUNA/Videos/Emolit/route_results.txt', 'w') as f:
    f.write('\n'.join(routes))
