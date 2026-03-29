const VENDOR_BASE_URLS = {
    'Pepperfry': 'https://www.pepperfry.com/',
    'Urban Ladder': 'https://www.urbanladder.com/',
    'IKEA': 'https://www.ikea.com/in/en/',
    'Asian Paints': 'https://www.asianpaints.com/',
    'Amazon India': 'https://www.amazon.in/',
    'Jaipur Rugs': 'https://www.jaipurtugs.com/',
    'Kapoor Lights': 'https://www.amazon.in/',
    'Wooden Street': 'https://www.woodenstreet.com/',
    'Fab India': 'https://www.fabindia.com/',
    'Sleek': 'https://www.sleekkitchens.com/',
    'Franke': 'https://www.franke.com/in/en/ks.html',
    'Philips': 'https://www.lighting.philips.co.in/',
};

export function getProductShopUrl(product) {
    const affiliateLink = product.affiliateLink || product.affiliate_link || product.source_url;
    if (affiliateLink && affiliateLink !== '#') {
        return affiliateLink;
    }
    return VENDOR_BASE_URLS[product.vendor] || '#';
}

export function openProductInNewTab(product) {
    const url = getProductShopUrl(product);
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
}
