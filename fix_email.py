content = open('app/services/email_service.py', 'r', encoding='utf-8').read()
marker = '</html>"""'
first  = content.find(marker)
second = content.find(marker, first + 1)
if second != -1:
    after = content.find('\n', second) + 1
    clean = content[:first + len(marker)] + '\n\n\n' + content[after:]
    open('app/services/email_service.py', 'w', encoding='utf-8').write(clean)
    print('Fixed! Lines between the two closing markers removed.')
else:
    print('No duplicate found — file is already clean.')
