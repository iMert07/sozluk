// --- DEĞİŞKENLER VE AYARLAR ---
let allWords = [];
let lastSelectedWord = null;
let isGreek = false;
let currentSelectedLetter = null;
let sortConfig = { key: 'harf', direction: 'asc' }; 
let etySortConfig = { key: 'label', direction: 'asc' }; // Varsayılan: Dil (Alfabetik) seçili

const PAGE_SIZE = 36;
const customAlphabet = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVX YZ".split("");
const latinToGreekMap = { "a":"Α","A":"Α", "e":"Ε","E":"Ε", "i":"Ͱ","İ":"Ͱ", "n":"Ν","N":"Ν", "r":"Ρ","R":"Ρ", "l":"L","L":"L", "ı":"Ь","I":"Ь", "k":"Κ","K":"Κ", "d":"D","D":"D", "m":"Μ","M":"Μ", "t":"Τ","T":"Τ", "y":"R","Y":"R", "s":"S","S":"S", "u":"U","U":"U", "o":"Q","Q":"Q", "b":"Β","B":"Β", "ş":"Ш","Ş":"Ш", "ü":"Υ","Ü":"Υ", "z":"Ζ","Z":"Ζ", "g":"G","G":"G", "ç":"C","Ç":"C", "ğ":"Γ","Ğ":"Γ", "v":"V","V":"V", "c":"J","C":"J", "h":"Η","H":"Η", "p":"Π","P":"Π", "ö":"Ω","Ö":"Ω", "f":"F","F":"F", "x":"Ψ","X":"Ψ", "j":"Σ","J":"Σ", "0":"θ" };

const translations = { 
    'tr': { 
        'title': 'Orum Dili', 'nav_words': 'Kelimeler', 'nav_stats': 'Harf Dağılımı', 'nav_ety': 'Köken Dağılımı',
        'about_page_text': 'Çeviri', 'feedback_button_text': 'Geri Bildirim', 
        'search_placeholder': 'Kelime ara...', 'about_title': 'Hoş Geldiniz', 
        'about_text_1': 'Bu sözlük, Orum Diline ait kelimeleri ve kökenlerini keşfetmeniz için hazırlanmıştır. Bu dil, Anadolu Türkçesinin özleştirilmesiyle ve kolaylaştırılmasıyla ve ayrıca Azerbaycan Türkçesinden esintilerle oluşturulan yapay bir dildir. Amacım, dilimizin öz zenginliğini kanıtlamaktır. Ancak yapay etkiler görebileceğinizi de unutmayın.',
        'about_text_2': 'Herhangi bir geri bildiriminiz, öneriniz veya yeni sözcük ekleme isteğiniz varsa; lütfen yukarıdaki menüden "Geri Bildirim" butonunu kullanarak bana ulaşın. Katkılarınızla bu sözlüğü daha da zenginleştirebiliriz!',
        'feedback_title': 'Geri Bildirim', 'feedback_placeholder': 'Mesajınız...', 
        'feedback_cancel': 'İptal', 'feedback_send': 'Gönder', 
        'synonyms_title': 'Eş Anlamlılar', 'description_title': 'Açıklama', 
        'example_title': 'Örnek', 'etymology_title': 'Köken', 'no_result': 'Sonuç bulunamadı' 
    } 
};

// --- 1. ETKİLEŞİMLİ BUTONLAR ---
function initButtons() {
    ['theme-toggle', 'alphabet-toggle'].forEach(id => {
        const btn = document.getElementById(id);
        if(btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        }
    });

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        updateThemeIcons();
    });

    document.getElementById('alphabet-toggle')?.addEventListener('click', () => {
        isGreek = !isGreek;
        document.getElementById('alphabet-toggle-latin')?.classList.toggle('hidden', isGreek);
        document.getElementById('alphabet-toggle-cyrillic')?.classList.toggle('hidden', !isGreek);
        updateText(isGreek ? 'gr' : 'tr');
        calculateStats();
        if (lastSelectedWord) showResult(lastSelectedWord);
        if (!document.getElementById('alphabet-section').classList.contains('hidden')) renderAlphabet();
        if (!document.getElementById('stats-section')?.classList.contains('hidden')) renderAlphabetStats();
        if (!document.getElementById('ety-section')?.classList.contains('hidden')) renderEtymologyStats();
    });
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('theme-toggle-dark-icon')?.classList.toggle('hidden', isDark);
    document.getElementById('theme-toggle-light-icon')?.classList.toggle('hidden', !isDark);
}

// --- 2. SAYFA YÖNETİMİ ---
function showKelimelerPage() { hideAllSections(); document.getElementById('alphabet-section').classList.remove('hidden'); renderAlphabet(); }
function showStatsPage() { hideAllSections(); document.getElementById('stats-section').classList.remove('hidden'); renderAlphabetStats(); }
function showEtyPage() { hideAllSections(); document.getElementById('ety-section').classList.remove('hidden'); renderEtymologyStats(); }

function hideAllSections() {
    ['welcome-box', 'stats-card', 'alphabet-section', 'stats-section', 'ety-section'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });
    document.getElementById('result').innerHTML = '';
}

function showPage(pageId) {
    if (pageId === 'home') {
        hideAllSections();
        document.getElementById('welcome-box').classList.remove('hidden');
        document.getElementById('stats-card').classList.remove('hidden');
        document.getElementById('searchInput').value = '';
    }
}

// --- 3. KÖKEN DAĞILIMI (GELİŞTİRİLMİŞ) ---
function renderEtymologyStats() {
    const container = document.getElementById('ety-container');
    if (!container) return;

    let etyMap = {};
    allWords.forEach(w => {
        if (!w.Sözcük || w.Sözcük.trim() === "") return;
        
        let origin = "Türkçe";
        let etyText = w.Köken ? w.Köken.trim() : "";

        if (etyText !== "") {
            if (etyText.includes("kökenli")) {
                let parts = etyText.split("kökenli");
                let potential = parts[parts.length - 1].trim();
                // "kökenli"den sonrası boşsa, öncesindeki son tamlamayı almaya çalış
                if (potential === "") {
                    let before = parts[parts.length - 2].trim();
                    origin = before.split(" ").pop();
                } else {
                    origin = potential;
                }
            } else {
                origin = etyText;
            }

            // Temizleme: Gereksiz son ekleri ve bağlaçları temizle, sadece dile odaklan
            // Ancak "Hint-Avrupa ana dili" gibi yapıları koru.
            if (origin.toLowerCase().includes("türkçe")) origin = "Türkçe (Melez)";
        }
        
        etyMap[origin] = (etyMap[origin] || 0) + 1;
    });

    let etyData = Object.keys(etyMap).map(key => ({ label: key, count: etyMap[key] }));

    etyData.sort((a, b) => {
        if (etySortConfig.key === 'label') {
            return etySortConfig.direction === 'asc' ? a.label.localeCompare(b.label, 'tr') : b.label.localeCompare(a.label, 'tr');
        }
        return etySortConfig.direction === 'asc' ? b.count - a.count : a.count - b.count;
    });

    container.innerHTML = `
        <div class="col-span-full mb-8 flex justify-center items-center select-none">
            <div class="inline-flex items-center bg-subtle-light dark:bg-subtle-dark p-1.5 rounded-2xl border border-subtle-light dark:border-subtle-dark shadow-sm gap-2">
                <button onclick="setEtySort('label')" class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${etySortConfig.key === 'label' ? 'bg-primary text-white shadow-md' : 'opacity-50 hover:opacity-100'}">${isGreek ? convertToGreek('Dil') : 'Dil'}</button>
                <button onclick="setEtySort('count')" class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${etySortConfig.key === 'count' ? 'bg-primary text-white shadow-md' : 'opacity-50 hover:opacity-100'}">${isGreek ? convertToGreek('Adet') : 'Adet'}</button>
                <div class="h-8 w-[1px] bg-foreground-light/10 dark:bg-foreground-dark/10 mx-1"></div>
                <button onclick="toggleEtyDirection()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-md">
                    <span class="text-xl font-bold">${etySortConfig.direction === 'asc' ? '↓' : '↑'}</span>
                </button>
            </div>
        </div>
    `;

    etyData.forEach(item => {
        const div = document.createElement('div');
        div.className = "bg-subtle-light dark:bg-subtle-dark p-4 rounded-xl border border-subtle-light dark:border-subtle-dark flex justify-between items-center shadow-sm select-none hover:border-primary/50 transition-colors";
        div.innerHTML = `<span class="font-bold text-sm">${isGreek ? convertToGreek(item.label) : item.label}</span><span class="bg-primary/20 text-primary font-bold px-3 py-1 rounded-lg text-xs">${item.count}</span>`;
        container.appendChild(div);
    });
}

function setEtySort(key) { etySortConfig.key = key; renderEtymologyStats(); }
function toggleEtyDirection() { etySortConfig.direction = etySortConfig.direction === 'asc' ? 'desc' : 'asc'; renderEtymologyStats(); }

// --- 4. HARF DAĞILIMI ---
function renderAlphabetStats() {
    const container = document.getElementById('stats-container');
    if (!container) return;

    let statsData = customAlphabet.filter(h => h !== " ").map(harf => {
        const startsWithCount = allWords.filter(w => w.Sözcük && normalizeString(w.Sözcük).startsWith(normalizeString(harf))).length;
        let totalOccurrence = 0;
        allWords.forEach(w => { if (w.Sözcük) totalOccurrence += (normalizeString(w.Sözcük).split(normalizeString(harf)).length - 1); });
        return { harf, başta: startsWithCount, toplam: totalOccurrence };
    });

    statsData.sort((a, b) => {
        let vA = a[sortConfig.key], vB = b[sortConfig.key];
        if (sortConfig.key === 'harf') return sortConfig.direction === 'asc' ? vA.localeCompare(vB, 'tr') : vB.localeCompare(vA, 'tr');
        return sortConfig.direction === 'asc' ? vB - vA : vA - vB;
    });

    container.innerHTML = `
        <div class="col-span-full mb-8 flex justify-center items-center select-none">
            <div class="inline-flex items-center bg-subtle-light dark:bg-subtle-dark p-1.5 rounded-2xl border border-subtle-light dark:border-subtle-dark shadow-sm gap-2">
                <div class="flex gap-1">
                    ${['harf', 'başta', 'toplam'].map(k => `<button onclick="setSortKey('${k}')" class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${sortConfig.key === k ? 'bg-primary text-white shadow-md' : 'opacity-50 hover:opacity-100'}">${isGreek ? convertToGreek(k) : k}</button>`).join('')}
                </div>
                <div class="h-8 w-[1px] bg-foreground-light/10 dark:bg-foreground-dark/10 mx-1"></div>
                <button onclick="toggleSortDirection()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-md"><span class="text-xl font-bold">${sortConfig.direction === 'asc' ? '↓' : '↑'}</span></button>
            </div>
        </div>
    `;

    statsData.forEach(item => {
        const box = document.createElement('div');
        box.className = "bg-subtle-light dark:bg-subtle-dark rounded-xl border border-subtle-light dark:border-subtle-dark overflow-hidden shadow-sm select-none";
        box.innerHTML = `<div class="bg-primary text-white text-center py-2 font-bold text-xl">${isGreek ? convertToGreek(item.harf) : item.harf}</div><div class="flex divide-x divide-subtle-light dark:divide-subtle-dark text-center"><div class="flex-1 py-3"><p class="text-[10px] opacity-50 uppercase font-bold">${isGreek ? convertToGreek('Başta') : 'Başta'}</p><p class="text-lg font-bold text-primary">${item.başta}</p></div><div class="flex-1 py-3"><p class="text-[10px] opacity-50 uppercase font-bold">${isGreek ? convertToGreek('Toplam') : 'Toplam'}</p><p class="text-lg font-bold">${item.toplam}</p></div></div>`;
        container.appendChild(box);
    });
}

function setSortKey(k) { sortConfig.key = k; renderAlphabetStats(); }
function toggleSortDirection() { sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc'; renderAlphabetStats(); }

// --- 5. KELİME LİSTELEME VE DİĞERLERİ ---
function renderAlphabet() {
    const list = document.getElementById('alphabet-list');
    if (!list) return;
    list.innerHTML = ""; list.className = "grid grid-cols-5 md:grid-cols-10 gap-2 justify-items-center";
    customAlphabet.forEach(harf => {
        if(harf === " ") return;
        const btn = document.createElement('button');
        btn.className = "w-10 h-10 flex items-center justify-center font-bold rounded bg-subtle-light/50 dark:bg-subtle-dark hover:bg-primary hover:text-white transition-all select-none";
        btn.innerText = isGreek ? convertToGreek(harf) : harf;
        btn.onclick = () => { currentSelectedLetter = harf; document.getElementById('result').innerHTML = ''; showLetterResults(harf, 0); };
        list.appendChild(btn);
    });
}

function showLetterResults(harf, page, showAll = false) {
    const resultsDiv = document.getElementById('letter-results');
    const pagDiv = document.getElementById('alphabet-pagination');
    resultsDiv.innerHTML = ""; pagDiv.innerHTML = "";
    const filtered = allWords.filter(w => w.Sözcük && normalizeString(w.Sözcük).startsWith(normalizeString(harf))).sort((a,b) => a.Sözcük.localeCompare(b.Sözcük, 'tr'));
    const start = page * PAGE_SIZE;
    const end = showAll ? filtered.length : start + PAGE_SIZE;
    filtered.slice(start, end).forEach(item => {
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
                pBtn.onclick = () => { showLetterResults(harf, i); document.getElementById('alphabet-menu').scrollIntoView({ behavior: 'smooth' }); };
                pagDiv.appendChild(pBtn);
            }
        }
        if (filtered.length > PAGE_SIZE) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = "px-6 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-sm hover:bg-primary hover:text-white transition-all ml-4 select-none";
            toggleBtn.innerText = showAll ? (isGreek ? convertToGreek("Daralt") : "Daralt") : (isGreek ? convertToGreek("Tümünü Göster") : "Tümünü Göster");
            toggleBtn.onclick = () => showLetterResults(harf, 0, !showAll);
            pagDiv.appendChild(toggleBtn);
        }
    }
}

// YARDIMCI VE ÇEKİRDEK FONKSİYONLAR
function selectWord(wordData, pText) { lastSelectedWord = wordData; document.getElementById('searchInput').value = isGreek ? convertToGreek(pText) : pText; document.getElementById('suggestions-container').classList.add('hidden'); showResult(wordData); setTimeout(() => { const res = document.getElementById('result'); if (res) res.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }
function showResult(word) { const resultDiv = document.getElementById('result'); const t = (key) => isGreek ? convertToGreek(translations['tr'][key]) : translations['tr'][key]; const convert = (val) => isGreek ? convertToGreek(val) : val; resultDiv.innerHTML = `<div class="bg-subtle-light dark:bg-subtle-dark rounded-lg sm:rounded-xl overflow-hidden p-4 sm:p-6 shadow-md border border-subtle-light dark:border-subtle-dark mt-8"><div class="mb-5"><h2 class="text-4xl font-bold text-primary">${convert(word.Sözcük)}</h2>${word.Bilimsel ? `<p class="text-base text-muted-light dark:text-muted-dark opacity-70 mt-1">${convert(word.Bilimsel)}</p>` : ''}${word.Tür ? `<p class="text-sm opacity-60 mt-0.5">${convert(word.Tür)}</p>` : ''}</div><hr class="border-t border-subtle-light dark:border-subtle-dark my-5"><div class="space-y-6">${word.Açıklama ? `<div><h3 class="text-primary font-bold text-lg mb-1">${t('description_title')}</h3><p class="text-base leading-relaxed">${convert(word.Açıklama)}</p></div>` : ''}${word.Köken ? `<div><h3 class="text-primary font-bold text-lg mb-1">${t('etymology_title')}</h3><p class="text-base leading-relaxed">${convert(word.Köken)}</p></div>` : ''}${word.Örnek ? `<div><h3 class="text-primary font-bold text-lg mb-1">${t('example_title')}</h3><p class="text-base border-l-4 border-primary/40 pl-4 py-1">${convert(word.Örnek)}</p></div>` : ''}${word['Eş Anlamlılar'] ? `<div><h3 class="text-primary font-bold text-lg mb-1">${t('synonyms_title')}</h3><p class="text-base">${convert(word['Eş Anlamlılar'])}</p></div>` : ''}</div></div>`; }
function setupSearch() { const input = document.getElementById('searchInput'); input?.addEventListener('input', function () { const q = normalizeString(this.value.trim()); if (!q) { document.getElementById('suggestions-container').classList.add('hidden'); return; } hideAllSections(); const matches = allWords.filter(row => row.Sözcük && normalizeString(row.Sözcük).startsWith(q)); displaySuggestions(matches); }); }
function displaySuggestions(matches) { const div = document.getElementById('suggestions'); const cont = document.getElementById('suggestions-container'); div.innerHTML = ''; if (matches.length === 0) { div.innerHTML = `<div class="p-4 text-sm opacity-50">Sonuç bulunamadı</div>`; cont.classList.remove('hidden'); return; } matches.slice(0, 10).forEach(m => { const d = document.createElement('div'); d.className = 'suggestion cursor-pointer p-4 hover:bg-background-light dark:hover:bg-background-dark border-b border-subtle-light dark:border-subtle-dark last:border-b-0 select-none'; d.innerHTML = `<span class="font-bold">${isGreek ? convertToGreek(m.Sözcük) : m.Sözcük}</span>`; d.onclick = () => selectWord(m, m.Sözcük); div.appendChild(d); }); cont.classList.remove('hidden'); }
function calculateStats() { const s = document.getElementById('stats-sentence'); if (!s) return; const valid = allWords.filter(r => r.Sözcük && r.Sözcük.trim() !== ""); const eCount = valid.length; let tWord = 0; valid.forEach(r => { tWord += 1; if (r['Eş Anlamlılar']) tWord += r['Eş Anlamlılar'].split(',').filter(x => x.trim() !== '').length; }); let sent = `Şu an bu sözlükte ${eCount} madde altında toplam ${tWord} kelime bulunmaktadır.`; if (isGreek) sent = convertToGreek(sent); s.innerHTML = sent.replace(eCount, `<span class="text-primary font-bold">${eCount}</span>`).replace(tWord, `<span class="text-primary font-bold">${tWord}</span>`); }
function normalizeString(str) { return str ? str.toLocaleLowerCase('tr-TR') : ''; }
function convertToGreek(str) { if(!str) return ""; return str.split('').map(char => latinToGreekMap[char] || char).join(''); }
function updateText(lang) { document.querySelectorAll('[data-key]').forEach(el => { const key = el.getAttribute('data-key'); if (translations['tr'][key]) { let f = translations['tr'][key]; if (lang === 'gr') f = convertToGreek(f); if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = f; else el.textContent = f; } }); }
function toggleFeedbackForm() { document.getElementById('feedbackModal').classList.toggle('hidden'); }
function submitFeedback() { toggleFeedbackForm(); }
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }

async function fetchWords() { 
    const url = `https://opensheet.elk.sh/1R01aIajx6dzHlO-KBiUXUmld2AEvxjCQkUTFGYB3EDM/Sözlük`; 
    try { 
        const res = await fetch(url); allWords = await res.json(); 
        initButtons(); setupSearch(); calculateStats(); updateText('tr');
    } catch (e) { console.error(e); } 
}
fetchWords();
