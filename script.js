// --- DEĞİŞKENLER VE AYARLAR ---
let allWords = [];
let lastSelectedWord = null;
let isGreek = false;
let currentSelectedLetter = null;

const PAGE_SIZE = 36;
const customAlphabet = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVX YZ".split("");

const latinToGreekMap = { "a":"Α","A":"Α", "e":"Ε","E":"Ε", "i":"Ͱ","İ":"Ͱ", "n":"Ν","N":"Ν", "r":"Ρ","R":"Ρ", "l":"L","L":"L", "ı":"Ь","I":"Ь", "k":"Κ","K":"Κ", "d":"D","D":"D", "m":"Μ","M":"Μ", "t":"Τ","T":"Τ", "y":"R","Y":"R", "s":"S","S":"S", "u":"U","U":"U", "o":"Q","Q":"Q", "b":"Β","B":"Β", "ş":"Ш","Ş":"Ш", "ü":"Υ","Ü":"Υ", "z":"Ζ","Z":"Ζ", "g":"G","G":"G", "ç":"C","Ç":"C", "ğ":"Γ","Ğ":"Γ", "v":"V","V":"V", "c":"J","C":"J", "h":"Η","H":"Η", "p":"Π","P":"Π", "ö":"Ω","Ö":"Ω", "f":"F","F":"F", "x":"Ψ","X":"Ψ", "j":"Σ","J":"Σ", "0":"θ" };

const translations = { 
    'tr': { 
        'title': 'Orum Dili', 
        'about_page_text': 'Çeviri', 
        'feedback_button_text': 'Geri Bildirim', 
        'search_placeholder': 'Kelime ara...', 
        'about_title': 'Hoş Geldiniz', 
        'about_text_1': 'Bu sözlük, Orum Diline ait kelimeleri ve kökenlerini keşfetmeniz için hazırlanmıştır. Bu dil, Anadolu Türkçesinin özleştirilmesiyle ve kolaylaştırılmasıyla ve ayrıca Azerbaycan Türkçesinden esintilerle oluşturulan yapay bir dildir. Amacım, dilimizin öz zenginliğini kanıtlamaktır. Ancak yapay etkiler görebileceğinizi de unutmayın.',
        'about_text_2': 'Herhangi bir geri bildiriminiz, öneriniz veya yeni sözcük ekleme isteğiniz varsa; lütfen yukarıdaki menüden "Geri Bildirim" butonunu kullanarak bana ulaşın. Katkılarınızla bu sözlüğü daha da zenginleştirebiliriz!',
        'feedback_title': 'Geri Bildirim', 
        'feedback_placeholder': 'Mesajınız...', 
        'feedback_cancel': 'İptal', 
        'feedback_send': 'Gönder', 
        'synonyms_title': 'Eş Anlamlılar', 
        'description_title': 'Açıklama', 
        'example_title': 'Örnek', 
        'etymology_title': 'Köken', 
        'no_result': 'Sonuç bulunamadı' 
    } 
};

// --- 1. ETKİLEŞİMLİ BUTONLAR ---
function initButtons() {
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
        updateThemeIcons();
    });

    const alphabetBtn = document.getElementById('alphabet-toggle');
    alphabetBtn?.addEventListener('click', () => {
        isGreek = !isGreek;
        document.getElementById('alphabet-toggle-latin')?.classList.toggle('hidden', isGreek);
        document.getElementById('alphabet-toggle-cyrillic')?.classList.toggle('hidden', !isGreek);
        updateText(isGreek ? 'gr' : 'tr');
        calculateStats();
        if (lastSelectedWord) showResult(lastSelectedWord);
        if (!document.getElementById('alphabet-section').classList.contains('hidden')) {
            renderAlphabet();
            if (currentSelectedLetter) showLetterResults(currentSelectedLetter, 0);
        }
    });
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('theme-toggle-dark-icon')?.classList.toggle('hidden', isDark);
    document.getElementById('theme-toggle-light-icon')?.classList.toggle('hidden', !isDark);
}

// --- 2. KELİME SEÇİMİ VE OTOMATİK KAYDIRMA ---
function selectWord(wordData, pText) {
    lastSelectedWord = wordData;
    document.getElementById('searchInput').value = isGreek ? convertToGreek(pText) : pText;
    document.getElementById('suggestions-container').classList.add('hidden');
    
    showResult(wordData);

    setTimeout(() => {
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// --- 3. HARF VE KELİME LİSTESİ ---
function showKelimelerPage() {
    currentSelectedLetter = null;
    lastSelectedWord = null;
    document.getElementById('welcome-box').classList.add('hidden');
    document.getElementById('stats-card').classList.add('hidden');
    document.getElementById('result').innerHTML = '';
    document.getElementById('alphabet-section').classList.remove('hidden');
    document.getElementById('letter-results').innerHTML = '';
    const pagDiv = document.getElementById('alphabet-pagination');
    if(pagDiv) { pagDiv.innerHTML = ''; pagDiv.classList.add('hidden'); }
    renderAlphabet();
}

function renderAlphabet() {
    const list = document.getElementById('alphabet-list');
    if (!list) return;
    list.innerHTML = "";
    
    // Bilgisayarda (md) 10 sütun (3x10), mobilde 5 sütun (6x5) düzeni
    list.className = "grid grid-cols-5 md:grid-cols-10 gap-2 justify-items-center";

    customAlphabet.forEach(harf => {
        if(harf === " ") return;
        const btn = document.createElement('button');
        btn.className = "w-10 h-10 flex items-center justify-center font-bold rounded bg-subtle-light/50 dark:bg-subtle-dark hover:bg-primary hover:text-white transition-all select-none";
        btn.innerText = isGreek ? convertToGreek(harf) : harf;
        btn.onclick = () => {
            currentSelectedLetter = harf;
            document.getElementById('result').innerHTML = '';
            showLetterResults(harf, 0);
        };
        list.appendChild(btn);
    });
}

function showLetterResults(harf, page, showAll = false) {
    const resultsDiv = document.getElementById('letter-results');
    const pagDiv = document.getElementById('alphabet-pagination');
    resultsDiv.innerHTML = "";
    pagDiv.innerHTML = "";

    const filtered = allWords.filter(w => w.Sözcük && normalizeString(w.Sözcük).startsWith(normalizeString(harf)))
                             .sort((a,b) => a.Sözcük.localeCompare(b.Sözcük, 'tr'));

    const start = page * PAGE_SIZE;
    const end = showAll ? filtered.length : start + PAGE_SIZE;
    const currentList = filtered.slice(start, end);

    currentList.forEach(item => {
        const b = document.createElement('button');
        b.className = "text-left p-3 rounded bg-white/5 border border-subtle-light dark:border-subtle-dark hover:border-primary transition-all truncate font-semibold text-sm select-none";
        b.innerText = isGreek ? convertToGreek(item.Sözcük) : item.Sözcük;
        b.onclick = () => selectWord(item, item.Sözcük);
        resultsDiv.appendChild(b);
    });

    if (filtered.length > 0) {
        pagDiv.classList.remove('hidden');
        if (!showAll && filtered.length > PAGE_SIZE) {
            const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
            for (let i = 0; i < pageCount; i++) {
                const pBtn = document.createElement('button');
                pBtn.className = `w-10 h-10 flex items-center justify-center rounded font-bold transition-all select-none ${i === page ? 'bg-primary text-white' : 'bg-subtle-light/50 dark:bg-subtle-dark hover:bg-primary/20'}`;
                pBtn.innerText = i + 1;
                pBtn.onclick = () => { 
                    showLetterResults(harf, i);
                    document.getElementById('alphabet-menu').scrollIntoView({ behavior: 'smooth' });
                };
                pagDiv.appendChild(pBtn);
            }
        }

        if (filtered.length > PAGE_SIZE) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = "px-6 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-sm hover:bg-primary hover:text-white transition-all ml-4 select-none";
            toggleBtn.innerText = showAll ? "Daralt" : "Tümünü Göster";
            toggleBtn.onclick = () => { 
                showLetterResults(harf, 0, !showAll);
            };
            pagDiv.appendChild(toggleBtn);
        }
    }
}

// --- 4. SONUÇ GÖSTERİMİ ---
function showResult(word) {
    const resultDiv = document.getElementById('result');
    const t = (key) => isGreek ? convertToGreek(translations['tr'][key]) : translations['tr'][key];
    const convert = (val) => isGreek ? convertToGreek(val) : val;

    resultDiv.innerHTML = `
        <div class="bg-subtle-light dark:bg-subtle-dark rounded-lg sm:rounded-xl overflow-hidden p-4 sm:p-6 shadow-md border border-subtle-light dark:border-subtle-dark mt-8">
            <div class="mb-5">
                <h2 class="text-4xl font-bold text-primary">${convert(word.Sözcük)}</h2>
                ${word.Bilimsel ? `<p class="text-base text-muted-light dark:text-muted-dark opacity-70 mt-1">${convert(word.Bilimsel)}</p>` : ''}
                ${word.Tür ? `<p class="text-sm opacity-60 mt-0.5">${convert(word.Tür)}</p>` : ''}
            </div>
            <hr class="border-t border-subtle-light dark:border-subtle-dark my-5">
            <div class="space-y-6">
                ${word.Açıklama ? `<div><h3 class="text-primary font-bold text-lg mb-1">${t('description_title')}</h3><p class="text-base leading-relaxed">${convert(word.Açıklama)}</p></div>` : ''}
                ${word.Köken ? `<div><h3 class="text-primary font-bold text-lg mb-1">${t('etymology_title')}</h3><p class="text-base leading-relaxed">${convert(word.Köken)}</p></div>` : ''}
                ${word.Örnek ? `<div><h3 class="text-primary font-bold text-lg mb-1">${t('example_title')}</h3><p class="text-base border-l-4 border-primary/40 pl-4 py-1">${convert(word.Örnek)}</p></div>` : ''}
                ${word['Eş Anlamlılar'] ? `<div><h3 class="text-primary font-bold text-lg mb-1">${t('synonyms_title')}</h3><p class="text-base">${convert(word['Eş Anlamlılar'])}</p></div>` : ''}
            </div>
        </div>`;
}

// --- 5. DİĞER FONKSİYONLAR ---
function showPage(pageId) { if (pageId === 'home') clearResult(); }
function clearResult() { lastSelectedWord = null; currentSelectedLetter = null; document.getElementById('result').innerHTML = ''; document.getElementById('searchInput').value = ''; document.getElementById('suggestions-container').classList.add('hidden'); document.getElementById('alphabet-section').classList.add('hidden'); document.getElementById('welcome-box').classList.remove('hidden'); document.getElementById('stats-card').classList.remove('hidden'); }
function setupSearch() { const searchInput = document.getElementById('searchInput'); searchInput?.addEventListener('input', function () { const query = normalizeString(this.value.trim()); if (!query) { document.getElementById('suggestions-container').classList.add('hidden'); return; } document.getElementById('alphabet-section').classList.add('hidden'); const matches = allWords.filter(row => row.Sözcük && normalizeString(row.Sözcük).startsWith(query)); displaySuggestions(matches); }); }
function displaySuggestions(matches) { const suggestionsDiv = document.getElementById('suggestions'); const container = document.getElementById('suggestions-container'); suggestionsDiv.innerHTML = ''; if (matches.length === 0) { suggestionsDiv.innerHTML = `<div class="p-4 text-sm opacity-50">Sonuç bulunamadı</div>`; container.classList.remove('hidden'); return; } matches.slice(0, 10).forEach(match => { const div = document.createElement('div'); div.className = 'suggestion cursor-pointer p-4 hover:bg-background-light dark:hover:bg-background-dark border-b border-subtle-light dark:border-subtle-dark last:border-b-0 select-none'; div.innerHTML = `<span class="font-bold">${isGreek ? convertToGreek(match.Sözcük) : match.Sözcük}</span>`; div.onclick = () => selectWord(match, match.Sözcük); suggestionsDiv.appendChild(div); }); container.classList.remove('hidden'); }
function calculateStats() { const statsSentence = document.getElementById('stats-sentence'); if (!statsSentence) return; const validEntries = allWords.filter(row => row.Sözcük && row.Sözcük.trim() !== ""); const entryCount = validEntries.length; let totalWordCount = 0; validEntries.forEach(row => { totalWordCount += 1; if (row['Eş Anlamlılar']) { const synonyms = row['Eş Anlamlılar'].split(',').filter(s => s.trim() !== ''); totalWordCount += synonyms.length; } }); let sentence = `Şu an bu sözlükte ${entryCount} madde altında toplam ${totalWordCount} kelime bulunmaktadır.`; if (isGreek) sentence = convertToGreek(sentence); statsSentence.innerHTML = sentence.replace(entryCount, `<span class="text-primary font-bold">${entryCount}</span>`).replace(totalWordCount, `<span class="text-primary font-bold">${totalWordCount}</span>`); }
function normalizeString(str) { if (!str) return ''; return str.toLocaleLowerCase('tr-TR'); }
function updateText(lang) { const textElements = document.querySelectorAll('[data-key]'); textElements.forEach(el => { const key = el.getAttribute('data-key'); if (translations['tr'][key]) { let finalStr = translations['tr'][key]; if (lang === 'gr') finalStr = convertToGreek(finalStr); if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { el.placeholder = finalStr; } else { el.textContent = finalStr; } } }); }
function toggleFeedbackForm() { document.getElementById('feedbackModal').classList.toggle('hidden'); }
function submitFeedback() { toggleFeedbackForm(); }
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }

initButtons();
async function fetchWords() { const url = `https://opensheet.elk.sh/1R01aIajx6dzHlO-KBiUXUmld2AEvxjCQkUTFGYB3EDM/Sözlük`; try { const response = await fetch(url); allWords = await response.json(); setupSearch(); calculateStats(); updateText('tr'); } catch (error) { console.error('Hata:', error); } }
fetchWords();
