import re
from preferences.models import Category

CATEGORY_KEYWORDS = {
    'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'openai', 'chatgpt', 'deep learning', 'neural network', 'deepmind', 'gemini'],
    'startups': ['startup', 'startups', 'founder', 'funding', 'seed round', 'venture capital', 'vc', 'y combinator', 'yc', 'acquired'],
    'cybersecurity': ['security', 'cybersecurity', 'hacker', 'breach', 'vulnerability', 'malware', 'ransomware', 'encryption', 'patch'],
    'gadgets': ['gadget', 'device', 'smartphone', 'hardware', 'wearable', 'headphones', 'tablet', 'spectrum'],
    'cloud': ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'serverless'],
    'programming': ['programming', 'developer', 'coding', 'software engineering', 'python', 'javascript', 'rust', 'go', 'java', 'typescript', 'api', 'framework', '1-bit'],
    'developer tools': ['developer tools', 'devtool', 'github', 'gitlab', 'vs code', 'ide', 'compiler', 'testing'],
    'apple': ['apple', 'iphone', 'macbook', 'ios', 'mac', 'ipad', 'apple watch'],
    'google': ['google', 'alphabet', 'android', 'chrome', 'pixel', 'search'],
    'microsoft': ['microsoft', 'windows', 'xbox', 'office 365', 'azure', 'copilot'],
    'open source': ['open source', 'oss', 'linux', 'apache', 'mozilla'],
    'fintech': ['fintech', 'finance', 'crypto', 'bitcoin', 'ethereum', 'stripe', 'payments', 'stablecoin'],
    'robotics': ['robotics', 'robot', 'automation', 'drone', 'autonomous'],
    'web3': ['web3', 'crypto', 'blockchain', 'nft', 'defi', 'ethereum', 'solana']
}

def categorize_article(title, summary):
    text_to_search = f"{title} {summary}".lower()
    
    categories = Category.objects.all()
    for category in categories:
        name_lower = category.name.lower()
        keywords = CATEGORY_KEYWORDS.get(name_lower, [name_lower])
        
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text_to_search):
                return category
            
    return None
