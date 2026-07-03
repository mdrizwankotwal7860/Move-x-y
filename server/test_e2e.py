import urllib.request
import json

BASE_URL = 'http://localhost:5000/api'

def post(endpoint, data, token=None):
    req = urllib.request.Request(f'{BASE_URL}{endpoint}', data=json.dumps(data).encode('utf-8'))
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} on POST {endpoint}: {e.read().decode()}")
        return None

def put(endpoint, data=None, token=None):
    data_bytes = json.dumps(data).encode('utf-8') if data else b''
    req = urllib.request.Request(f'{BASE_URL}{endpoint}', data=data_bytes, method='PUT')
    if data:
        req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} on PUT {endpoint}: {e.read().decode()}")
        return None

def get(endpoint, token=None):
    req = urllib.request.Request(f'{BASE_URL}{endpoint}')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error {e.code} on GET {endpoint}: {e.read().decode()}")
        return None

def run_tests():
    print("1. Registering Rider...")
    rider_res = post('/auth/register/user', {'name': 'Rider 1', 'email': 'rider1@test.com', 'password': 'pass'})
    print(rider_res)

    print("2. Registering Driver...")
    driver_res = post('/auth/register/driver', {'name': 'Driver 1', 'email': 'driver1@test.com', 'password': 'pass'})
    print(driver_res)

    print("3. Logging in Rider...")
    r_login = post('/auth/login', {'email': 'rider1@test.com', 'password': 'pass'})
    rider_token = r_login['token']
    
    print("4. Logging in Driver...")
    d_login = post('/auth/login', {'email': 'driver1@test.com', 'password': 'pass'})
    driver_token = d_login['token']
    driver_id = d_login['user']['id']
    
    print("5. Getting Driver Profile...")
    profile = get('/drivers/profile', token=driver_token)
    print(profile)

    print("6. Uploading Driver Documents...")
    docs_res = put('/drivers/documents/license', {'data': 'base64_fake_data'}, token=driver_token)
    print(docs_res)

    # 7. Add vehicle
    print("7. Adding Vehicle...")
    vehicle_res = post('/drivers/vehicle', {'make': 'Toyota', 'model': 'Camry', 'plate_number': 'XY123Z'}, token=driver_token)
    print(vehicle_res)

    print("8. Logging in Admin (using hack to promote rider to admin)...")
    get('/auth/hack-make-me-admin/rider1@test.com')
    a_login = post('/auth/login', {'email': 'rider1@test.com', 'password': 'pass'})
    admin_token = a_login['token']

    print("9. Admin reviewing driver documents...")
    doc_review = put(f'/admin/drivers/{driver_id}/documents/license/approve', token=admin_token)
    print(doc_review)

    print("10. Admin approving driver...")
    approve = put(f'/admin/drivers/{driver_id}/approve', token=admin_token)
    print(approve)

    print("11. Driver going online...")
    online = put('/drivers/status', {'is_online': True}, token=driver_token)
    print(online)

    print("12. Rider booking ride...")
    ride = post('/rides/request', {
        'pickup': {'lat': 12.9, 'lng': 77.5, 'address': 'A'},
        'destination': {'lat': 12.91, 'lng': 77.51, 'address': 'B'}
    }, token=rider_token)
    print(ride)
    if not ride: return
    ride_id = ride['ride']['id']

    print("13. Driver getting pending rides...")
    pending = get('/rides/driver/requests', token=driver_token)
    print(pending)

    print("14. Driver accepting ride...")
    accept = put(f'/rides/{ride_id}/accept', token=driver_token)
    print(accept)
    
    print("15. Driver verifying OTP...")
    # Get OTP from ride info
    ride_info = get(f'/rides/{ride_id}', token=rider_token)
    otp = ride_info['ride']['otp']
    verify = put(f'/rides/{ride_id}/verify-otp', {'otp': otp}, token=driver_token)
    print(verify)

    print("16. Driver starting ride...")
    start = put(f'/rides/{ride_id}/start', token=driver_token)
    print(start)

    print("17. Driver completing ride...")
    complete = put(f'/rides/{ride_id}/complete', token=driver_token)
    print(complete)

if __name__ == '__main__':
    run_tests()
