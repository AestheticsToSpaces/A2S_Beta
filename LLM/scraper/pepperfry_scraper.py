"""
Pepperfry India Product Scraper.

Uses category search pages and parses both JSON-LD and card HTML.
"""

import json
import re

from bs4 import BeautifulSoup

from scraper.base import (
    get_session,
    fetch_page,
    clean_price,
    clean_text,
    logger,
    extract_color,
    extract_material,
    map_aesthetic_style,
    build_affiliate_url,
)
from utils.product_mapper import map_product_type_to_room_types

PEPPERFRY_SEARCHES = {
    "sofa": [
        "https://www.pepperfry.com/site_product/search?q=sofa",
        "https://www.pepperfry.com/site_product/search?q=l%20shape%20sofa",
    ],
    "bed": [
        "https://www.pepperfry.com/site_product/search?q=bed",
        "https://www.pepperfry.com/site_product/search?q=queen%20bed",
    ],
    "table": [
        "https://www.pepperfry.com/site_product/search?q=coffee%20table",
        "https://www.pepperfry.com/site_product/search?q=dining%20table",
    ],
    "storage": [
        "https://www.pepperfry.com/site_product/search?q=wardrobe",
        "https://www.pepperfry.com/site_product/search?q=bookshelf",
    ],
    "decor": [
        "https://www.pepperfry.com/site_product/search?q=mirror",
        "https://www.pepperfry.com/site_product/search?q=wall%20decor",
    ],
    "lighting": [
        "https://www.pepperfry.com/site_product/search?q=lamp",
    ],
}


def _parse_json_ld(soup: BeautifulSoup, product_type: str) -> list[dict]:
    products = []

    for script in soup.find_all("script", type="application/ld+json"):
        raw = script.string or script.get_text() or ""
        if not raw.strip():
            continue

        try:
            data = json.loads(raw)
        except Exception:
            continue

        if isinstance(data, dict) and data.get("@type") == "ItemList":
            items = data.get("itemListElement", [])
        elif isinstance(data, list):
            items = []
            for entry in data:
                if isinstance(entry, dict) and entry.get("@type") == "ItemList":
                    items.extend(entry.get("itemListElement", []))
        else:
            items = []

        for item in items:
            obj = item.get("item") if isinstance(item, dict) else None
            if not isinstance(obj, dict):
                continue

            name = clean_text(obj.get("name", ""))
            url = obj.get("url", "")
            image = obj.get("image", "")
            offers = obj.get("offers", {}) if isinstance(obj.get("offers", {}), dict) else {}
            price = clean_price(offers.get("price", ""))

            if not name or not url or not price or price < 100:
                continue

            if url.startswith("/"):
                url = "https://www.pepperfry.com" + url

            color_name, color_hex = extract_color(name)
            material = extract_material(name)
            style = map_aesthetic_style(product_type, name, "")

            pid = f"PF_{abs(hash((name, url))) % 100000000}"
            room_types = map_product_type_to_room_types(product_type)
            
            products.append({
                "product_id": pid,
                "product_name": name,
                "brand": "Pepperfry",
                "price_value": price,
                "price_currency": "INR",
                "product_type": product_type,
                "room_type": room_types[0] if room_types else "Living Room",  # Primary room type
                "image_url": image,
                "affiliate_url": build_affiliate_url(url, "pepperfry.com"),
                "source_url": url,
                "dimensions": "",
                "color": color_name,
                "color_hex": color_hex,
                "material": material,
                "aesthetic_style": style,
                "source": "pepperfry.com",
            })

    return products


def scrape_pepperfry(max_per_category: int = 200) -> list[dict]:
    logger.info("Starting Pepperfry scraper...")
    session = get_session()
    all_products = []
    seen = set()

    for product_type, urls in PEPPERFRY_SEARCHES.items():
        for url in urls:
            html = fetch_page(url, session=session, delay=2.2)
            if not html:
                continue

            soup = BeautifulSoup(html, "lxml")
            products = _parse_json_ld(soup, product_type)

            count = 0
            for p in products:
                if p["product_id"] in seen:
                    continue
                seen.add(p["product_id"])
                all_products.append(p)
                count += 1
                if count >= max_per_category:
                    break

            logger.info(f"Pepperfry [{product_type}] -> {count} added (total: {len(all_products)})")

    logger.info(f"Pepperfry scraping complete: {len(all_products)} products")
    return all_products
