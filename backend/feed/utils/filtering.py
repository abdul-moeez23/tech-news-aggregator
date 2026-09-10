import re
from preferences.models import Category

CATEGORY_KEYWORDS = {
    'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'openai', 'chatgpt', 'deep learning', 'neural network', 'deepmind', 'gemini'],
    'generative ai': ['generative ai', 'genai', 'llm', 'diffusion', 'midjourney', 'stable diffusion', 'dalle'],
    'machine learning': ['machine learning', 'ml', 'scikit', 'tensorflow', 'pytorch', 'model training'],
    'nlp': ['nlp', 'natural language', 'text processing', 'spacy', 'nltk', 'transformers'],
    
    'software engineering': ['software engineering', 'architecture', 'design patterns', 'microservices', 'system design', 'monolith'],
    'frontend': ['frontend', 'react', 'vue', 'angular', 'svelte', 'css', 'html', 'tailwind', 'bootstrap', 'ui', 'ux', 'dom'],
    'backend': ['backend', 'nodejs', 'django', 'flask', 'spring boot', 'laravel', 'express', 'fastapi', 'database', 'sql', 'nosql', 'postgres', 'mongodb', 'redis'],
    'fullstack': ['fullstack', 'full-stack', 'mern', 'mean', 'nextjs', 'nuxt'],
    'devops': ['devops', 'ci/cd', 'github actions', 'jenkins', 'gitlab ci', 'terraform', 'ansible', 'provisioning'],
    
    'cloud computing': ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'serverless', 'lambda', 'ec2', 's3'],
    
    'cybersecurity': ['security', 'cybersecurity', 'hacker', 'breach', 'vulnerability', 'malware', 'ransomware', 'encryption', 'patch'],
    'network security': ['network security', 'firewall', 'vpn', 'ddos', 'wireshark'],
    'cryptography': ['cryptography', 'encryption', 'hashing', 'rsa', 'aes', 'sha-256'],
    'ethical hacking': ['ethical hacking', 'penetration testing', 'pentest', 'bug bounty', 'kali linux', 'metasploit'],
    
    'programming': ['programming', 'developer', 'coding', 'software', 'api', 'framework', 'library', 'compiler'],
    'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'pip', 'pep'],
    'javascript': ['javascript', 'js', 'typescript', 'ts', 'node', 'npm', 'yarn', 'es6', 'es2015'],
    'rust': ['rust', 'cargo', 'crate', 'rustlang', 'memory safety', 'borrow checker'],
    'go': ['golang', 'go language', 'goroutine'],
    
    'developer tools': ['developer tools', 'devtool', 'github', 'gitlab', 'vs code', 'ide', 'compiler', 'testing'],
    'version control': ['git', 'github', 'gitlab', 'bitbucket', 'svn', 'version control', 'pull request', 'merge conflict'],
    
    'startups': ['startup', 'startups', 'founder', 'funding', 'seed round', 'venture capital', 'vc', 'y combinator', 'yc', 'acquired', 'bootstrapping', 'growth hacking'],
    'web3': ['web3', 'crypto', 'blockchain', 'nft', 'defi', 'ethereum', 'solana', 'smart contracts']
}

def categorize_article(title, summary):
    text_to_search = f"{title} {summary}".lower()
    
    categories = Category.objects.all()
    best_category = None
    max_score = 0
    
    for category in categories:
        name_lower = category.name.lower()
        keywords = CATEGORY_KEYWORDS.get(name_lower, [name_lower])
        
        score = 0
        for keyword in keywords:
            # Special case for very common words like 'go', require 'golang' or 'go language' 
            # but for our simple matching, let's just use the keyword. 
            # We'll rely on counts.
            pattern = r'\b' + re.escape(keyword) + r'\b'
            matches = len(re.findall(pattern, text_to_search))
            score += matches
            
        if score > max_score:
            max_score = score
            best_category = category
            
    return best_category
