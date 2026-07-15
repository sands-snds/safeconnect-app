<?php
// link_scraper.php
// Fetches a news article URL and pulls its headline + photo from
// Open Graph / Twitter meta tags (works for most PH news sites:
// ABS-CBN, GMA News, Rappler, Inquirer, PhilStar, PAGASA advisories, etc.)

function fetch_article_preview(string $url): ?array {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return null;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SafeConnectBot/1.0)',
    ]);
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$html || $httpCode >= 400) {
        return null;
    }

    // Suppress warnings from malformed HTML on real-world news sites.
    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    $doc->loadHTML($html);
    libxml_clear_errors();

    $xpath = new DOMXPath($doc);

    $getMeta = function (string $property) use ($xpath) {
        $node = $xpath->query("//meta[@property='$property']")->item(0)
            ?? $xpath->query("//meta[@name='$property']")->item(0);
        return $node ? trim($node->getAttribute('content')) : null;
    };

    $title = $getMeta('og:title') ?? $getMeta('twitter:title');
    $image = $getMeta('og:image') ?? $getMeta('twitter:image');
    $site  = $getMeta('og:site_name');
    $description = $getMeta('og:description') ?? $getMeta('description');

    // Fallbacks if OG tags are missing.
    if (!$title) {
        $titleNode = $xpath->query('//title')->item(0);
        $title = $titleNode ? trim($titleNode->textContent) : null;
    }
    if (!$site) {
        $host = parse_url($url, PHP_URL_HOST);
        $site = $host ? preg_replace('/^www\./', '', $host) : null;
    }

    if (!$title && !$image) {
        return null;
    }

    return [
        'title' => $title,
        'image' => $image,
        'site' => $site,
        'description' => $description,
        'url' => $url,
    ];
}