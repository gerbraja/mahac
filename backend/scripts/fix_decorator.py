with open('backend/routers/admin.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicated blank line between decorator and function
old = '@router.get("/reports/country-stats")\n\ndef get_country_stats'
new = '@router.get("/reports/country-stats")\ndef get_country_stats'
if old in content:
    content = content.replace(old, new)
    print("Fixed extra blank line between decorator and function")
else:
    print("No fix needed")

with open('backend/routers/admin.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
