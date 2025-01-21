import os
from datetime import datetime

BASE_URL = "https://cineverse.linkpc.net"
OUTPUT_FILE = "sitemap.xml"

def generate_sitemap():
    urls = []
    for root, _, files in os.walk("."):
        for file in files:
            if file.endswith(".html"):
                path = os.path.relpath(os.path.join(root, file), ".")
                if path == "index.html":
                    url = f"{BASE_URL}/"
                else:
                    url = f"{BASE_URL}/{path.replace(os.sep, '/')}"
                urls.append(f"""
    <url>
        <loc>{url}</loc>
        <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>""")

    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{''.join(urls)}
</urlset>"""

    with open(OUTPUT_FILE, "w") as f:
        f.write(sitemap)

if __name__ == "__main__":
    generate_sitemap()
