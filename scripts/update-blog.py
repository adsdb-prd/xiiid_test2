"""Fetch Medium RSS and retain the three newest articles; keep cache on failure."""
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlparse

target = Path(__file__).resolve().parents[1] / 'site/content/blog.json'
try:
    if len(sys.argv) > 1:
        xml = Path(sys.argv[1]).read_bytes()
    else:
        request = urllib.request.Request('https://medium.com/feed/@xiiid', headers={'User-Agent': 'XIIID-Blog/1.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            xml = response.read()
    posts = []
    for item in ET.fromstring(xml).findall('./channel/item'):
        url = item.findtext('link', '').split('?')[0]
        title = item.findtext('title', '').strip()
        date = parsedate_to_datetime(item.findtext('pubDate')).astimezone(timezone.utc)
        if urlparse(url).hostname == 'medium.com' and urlparse(url).scheme == 'https' and title:
            posts.append({'title': title, 'url': url, 'date': date.strftime('%Y.%m.%d'), '_sort': date.timestamp()})
    posts.sort(key=lambda p: p['_sort'], reverse=True)
    posts = posts[:3]
    if len(posts) != 3:
        raise ValueError('Expected at least three valid posts')
    for post in posts:
        del post['_sort']
    target.write_text(json.dumps({'source': 'https://medium.com/@xiiid', 'posts': posts}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Updated latest 3 Medium posts')
except Exception as error:
    if not target.exists():
        raise
    print(f'::warning::Medium refresh failed; retaining published cache: {error}')
