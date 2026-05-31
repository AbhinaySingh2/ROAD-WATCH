import codecs

with codecs.open('backend/requirements.txt', 'r', 'utf-8', errors='ignore') as f:
    content = f.read()

content = content.replace('\x00', '').strip()

with codecs.open('backend/requirements.txt', 'w', 'utf-8') as f:
    f.write(content + '\n')
