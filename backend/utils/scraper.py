import httpx
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# Tags unlikely to contain JD content — stripped before parsing
BOILERPLATE_TAGS = ["script", "style", "nav", "footer", "header", "aside", "form"]


def scrape_jd_from_url(url: str, timeout: int = 15) -> str:
    """
    Fetches a job posting URL and returns cleaned plain text.
    Raises ValueError on fetch failure or if extracted text is too short.
    """
    
    if 'linkedin' in url or 'Workday' in url or 'Greenhouse' in url:
        return "LinkedIn/Workday/Greenhouse requires login — paste the JD text directly Try pasting the JD text directly."
    
    try:
        with httpx.Client(headers=HEADERS, follow_redirects=True, timeout=timeout) as client:
            response = client.get(url)
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise ValueError(f"HTTP error fetching URL ({e.response.status_code}): {url}") from e
    except httpx.RequestError as e:
        raise ValueError(f"Network error fetching URL: {url}") from e

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove boilerplate tags in-place
    for tag in soup(BOILERPLATE_TAGS):
        tag.decompose()

    # Prefer semantic content containers if present
    content = (
        soup.find("main")
        or soup.find("article")
        or soup.find(id="job-description")
        or soup.find(class_="job-description")
        or soup.find(class_="description")
        or soup.body
        or soup
    )

    raw_text = content.get_text(separator="\n")
    cleaned = _clean_text(raw_text)

    if len(cleaned) < 200:
        raise ValueError(
            "Extracted text is too short — the page may require JavaScript or block scraping. "
            "Try pasting the JD text directly."
        )

    return cleaned


def _clean_text(text: str) -> str:
    """Strips blank lines and excessive whitespace."""
    lines = (line.strip() for line in text.splitlines())
    non_empty = (line for line in lines if line)
    return "\n".join(non_empty)