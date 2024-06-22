// IntersectionObserver oluştur
var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            var visibleNode = entry.target;
            processNode(visibleNode);
        }
    });
}, { root: null, rootMargin: '0px', threshold: 0 });

// MutationObserver oluştur
var mutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                processNode(node);
            }
        });
    });
});

// MutationObserver'ı başlat
mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// IntersectionObserver'ı başlat
document.querySelectorAll('body *').forEach(function(node) {
    observer.observe(node);
});

// Metin veya element içeriğini işlemek için fonksiyon
function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        processElementNode(node);
    }
}

// Metin içeriğini işlemek için fonksiyon
function processTextNode(node) {
    var words = node.textContent.trim().split(/\s+/);

    var processedWords = new Set();

    words.forEach(function(word) {
        if (!processedWords.has(word)) {
            processedWords.add(word);
            sendWordToAPI(word.trim(), node);
        }
    });
}

// API'ye kelime göndermek için fonksiyon
function sendWordToAPI(word, node) {
    fetch('http://127.0.0.1:5000/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: word })
        })
        .then(response => response.json())
        .then(data => {
            if (data.prediction.includes("OTHER: False")) {
                coverWord(node, word);
            }
        })
        .catch(error => {
            console.error('Hata:', error);
        });
}

// Element içeriğini işlemek için fonksiyon
function processElementNode(element) {
    element.childNodes.forEach(function(child) {
        if (child.nodeType === Node.TEXT_NODE) {
            processTextNode(child);
        }
    });
}

// Kötü kelimeleri kapsamak için fonksiyon
function coverWord(node, word) {
    if (!node.parentNode) {
        return;
    }

    var regex = new RegExp('\\b(' + word + ')\\b', 'gi');
    var replacement = "<span class='cover-box'>" + word + "</span>";
    var newText = node.textContent.replace(regex, replacement);
    var newNode = document.createElement('span');
    newNode.innerHTML = newText;

    node.parentNode.replaceChild(newNode, node);
}

// CSS stilini ekleyelim
var style = document.createElement('style');
style.innerHTML = `
    .cover-box {
        background-color: black;
        color: black;
        display: inline-block;
        border-radius: 3px;
        padding: 0 2px;
    }
`;
document.head.appendChild(style);
