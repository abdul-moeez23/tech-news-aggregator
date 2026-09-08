import hashlib
import re

def normalize_url(url):
    """
    Removes tracking parameters (utm_source) and normalizes the URL to generate a consistent hash.
    """
    # Remove query parameters and fragments (e.g., ?utm_source=twitter#comments)
    base_url = url.split('?')[0].split('#')[0]
    
    # Remove http/https and www. for consistency
    base_url = re.sub(r'^https?://', '', base_url)
    base_url = re.sub(r'^www\.', '', base_url)
    
    # Strip trailing slashes
    return base_url.rstrip('/').lower()

def generate_article_hash(url):
    """
    Generates a unique SHA-256 hash based on the normalized URL.
    This helps detect the exact same article shared across different domains via syndication.
    """
    normalized = normalize_url(url)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def levenshtein_distance(s1, s2):
    """
    Calculates the Levenshtein distance between two strings to measure similarity.
    (How many single-character edits are required to change one word into the other)
    """
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def is_title_similar(title1, title2, threshold=0.8):
    """
    Checks if two article titles are highly similar (e.g., >= 80% similar).
    Example: 
    "New AI Model Released by OpenAI" vs "OpenAI Releases New AI Model"
    """
    t1 = title1.lower().strip()
    t2 = title2.lower().strip()
    
    max_len = max(len(t1), len(t2))
    if max_len == 0:
        return True
        
    distance = levenshtein_distance(t1, t2)
    similarity = 1 - (distance / max_len)
    
    return similarity >= threshold
