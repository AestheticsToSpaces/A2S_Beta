import io, requests, json
from PIL import Image

# Create test image
img = Image.new("RGB", (512, 512), (180, 180, 180))
b = io.BytesIO()
img.save(b, format="JPEG")
b.seek(0)

# Token from the logs
token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyaXZhczIyNTU4OEBnbWFpbC5jb20iLCJpYXQiOjE3NzUxMjM4NzgsImV4cCI6MTc3NTIxMDI3OH0.b4xmb7WPUADiDVCTdPl53VzgcpLsoxUCJMxo9Mg5DLs"

files = [("images", ("test.jpg", b.getvalue(), "image/jpeg"))]
data = {
    "room_type": "Living Room",
    "facing_direction": "Auto detect",
    "floor": "1"
}
headers = {
    "Authorization": f"Bearer {token}"
}

# Test via nginx (frontend) reverse proxy
print("=== Testing via nginx (frontend reverseproxy) ===")
try:
    r = requests.post("http://a2s-frontend/api/vastu/analyse", data=data, files=files, headers=headers, timeout=60)
    print(f"STATUS CODE: {r.status_code}")
    print(f"RESPONSE HEADERS: {dict(r.headers)}")
    print(f"RESPONSE BODY:\n{r.text}")
except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
