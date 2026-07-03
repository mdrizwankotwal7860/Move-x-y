import os, glob

def replace_in_files(pattern, replacements):
    for filepath in glob.glob(pattern, recursive=True):
        if not os.path.isfile(filepath): continue
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for old, new in replacements:
            content = content.replace(old, new)
            
        if original != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")

os.chdir('e:/uber_clone/uber_clone/server')

# In routes and sockets and models and seed
replacements = [
    ("str(", "str("),
    ("__import__('bson').str(", "str("),
    ("", "")
]

replace_in_files('**/*.py', replacements)

# Fix seed.py explicitly because it needs string IDs on inserts too
# Actually seed.py inserts dictionaries. They auto-get ObjectIds if _id isn't provided.
# Let's explicitly tell seed.py to provide string IDs!
with open('seed.py', 'r', encoding='utf-8') as f:
    seed_content = f.read()

# For seed.py, replace insert_one({ with insert_one({'_id': str(str()),
# Wait, ObjectId is removed from seed.py! We can use uuid!
seed_replacements = [
    ("import bcrypt", "import bcrypt\nimport uuid"),
    ("insert_one({", "insert_one({'_id': str(uuid.uuid4()),")
]
for old, new in seed_replacements:
    seed_content = seed_content.replace(old, new)
    
with open('seed.py', 'w', encoding='utf-8') as f:
    f.write(seed_content)
    
print("Patched all files!")
