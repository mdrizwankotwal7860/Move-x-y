import os

models = {
    'driver.py': [
        ("'documents': _empty_documents(),", "'_id': str(str()),\n        'documents': _empty_documents(),"),
        ('str(driver_id)', 'str(driver_id)')
    ],
    'user.py': [
        ("'role': 'user',", "'_id': str(str()),\n        'role': 'user',"),
        ('str(user_id)', 'str(user_id)')
    ],
    'vehicle.py': [
        ("'plate_number': data['plate_number'],", "'_id': str(str()),\n        'plate_number': data['plate_number'],"),
        ('str(vehicle_id)', 'str(vehicle_id)'),
        ('str(driver_id)', 'str(driver_id)')
    ],
    'admin.py': [
        ("'role': 'admin',", "'_id': str(str()),\n        'role': 'admin',"),
        ('str(admin_id)', 'str(admin_id)')
    ]
}

os.chdir('e:/uber_clone/uber_clone/server/models')
for file, replacements in models.items():
    if not os.path.exists(file): continue
    with open(file, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file, 'w') as f:
        f.write(content)
        
print('Replaced ObjectIds with str in models.')
