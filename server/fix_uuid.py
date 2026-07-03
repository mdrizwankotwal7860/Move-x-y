import os, glob

os.chdir('e:/uber_clone/uber_clone/server/models')
for filepath in glob.glob('*.py'):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'str(str())' in content:
        content = content.replace('str(str())', 'str(uuid.uuid4())')
        if 'import uuid' not in content:
            content = "import uuid\n" + content
            
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
