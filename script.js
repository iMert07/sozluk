let allWords = [];
let lastSelectedWord = null;
let isGreek = false;
let currentSelectedLetter = null;
let sortConfig = { key: 'harf', direction: 'asc' }; 
let etySortConfig = { key: 'label', direction: 'asc' }; 
let searchHistory = JSON.parse(localStorage.getItem('orum_history')) || [];

const PAGE_SIZE = 36;
const customAlphabet = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVXYZ".split("");
const latinToGreekMap = { "a":"Α","A":"Α", "e":"Ε","E":"Ε", "i":"Ͱ","İ":"Ͱ", "n":"Ν","N":"Ν", "r":"Ρ","R":"Ρ", "l":"L","L":"L", "ı":"Ь","I":"Ь", "k":"Κ","Κ":"Κ", "d":"D","D":"D", "m":"Μ","M":"Μ", "t":"Τ","T":"Τ", "y":"R","Y":"R", "s":"S","S":"S", "u":"U","U":"U", "o":"Q","Q":"Q", "b":"Β","B":"Β", "ş":"Ш","Ş":"Ш", "ü":"Υ","Ü":"Υ", "z":"Ζ","Z":"Ζ", "g":"G","G":"G", "ç":"C","Ç":"C", "ğ":"Γ","Ğ":"Γ", "v":"V","V":"V", "c":"J","C":"J", "h":"Η","H":"Η", "p":"Π","P":"Π", "ö":"Ω","Ö":"Ω", "f":"F","F":"F", "x":"Ψ","X":"Ψ", "j":"Σ","J":"Σ" };

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

        const resultDiv = document.getElementById('result');
        if (lastSelectedWord && resultDiv && resultDiv.innerHTML.trim() !== "") {
            showResult(lastSelectedWord);
        }

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

function addToHistory(wordData, clickedText, subText = null) {
    searchHistory = searchHistory.filter(h => h.clickedText !== clickedText);
    searchHistory.unshift({ wordData, clickedText, subText });
    if (searchHistory.length > 12) searchHistory.pop();
    localStorage.setItem('orum_history', JSON.stringify(searchHistory));
}

function renderHistory() {
    const div = document.getElementById('suggestions');
    const cont = document.getElementById('suggestions-container');
    div.innerHTML = '';
    if (searchHistory.length === 0) return;
    searchHistory.forEach(item => {
        const d = document.createElement('div');
        d.className = 'suggestion cursor-pointer p-4 hover:bg-background-light dark:hover:bg-background-dark border-b border-subtle-light dark:border-subtle-dark last:border-b-0 select-none flex items-baseline gap-2 bg-transparent';
        const display = isGreek ? convertToGreek(item.clickedText) : item.clickedText;
        const subDisplay = item.subText ? (isGreek ? convertToGreek(item.subText) : item.subText) : '';
        d.innerHTML = `<span class="font-bold text-foreground-light dark:text-foreground-dark">${display}</span>${item.subText ? `<span class="opacity-50 ml-2 text-sm text-muted-light dark:text-muted-dark">${subDisplay}</span>` : ''}`;
        d.onclick = () => selectWord(item.wordData, item.clickedText, false, item.subText, true);
        div.appendChild(d);
    });
    cont.classList.remove('hidden');
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    const container = document.getElementById('suggestions-container');

    input?.addEventListener('focus', () => { if (!input.value.trim()) renderHistory(); });

    input?.addEventListener('input', function () {
        const q = normalizeString(this.value.trim());
        if (!q) { renderHistory(); return; }
        const matches = allWords.filter(row => {
            const sozcuk = normalizeString(row.Sözcük || "");
            const bilimsel = normalizeString(row.Bilimsel || "");
            const esAnlam = normalizeString(row['Eş Anlamlılar'] || "");
            const synArray = esAnlam.split(',').map(s => s.trim());
            return sozcuk.startsWith(q) || bilimsel.startsWith(q) || synArray.some(s => s.startsWith(q));
        });
        displaySuggestions(matches, q);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.relative')) container.classList.add('hidden');
    });
}

function displaySuggestions(matches, q) {
    const div = document.getElementById('suggestions');
    const cont = document.getElementById('suggestions-container');
    div.innerHTML = '';
    if (matches.length === 0) { 
        div.innerHTML = `<div class="p-4 text-sm opacity-50 bg-transparent">Sonuç bulunamadı</div>`; 
        cont.classList.remove('hidden'); return; 
    }
    matches.slice(0, 15).forEach(m => {
        const d = document.createElement('div');
        d.className = 'suggestion cursor-pointer p-4 bg-transparent hover:bg-background-light dark:hover:bg-background-dark border-b border-subtle-light dark:border-subtle-dark last:border-b-0 select-none flex items-baseline gap-2';
        let displayMain = m.Sözcük;
        let displaySub = "";
        const sozcuk = normalizeString(m.Sözcük || "");
        const bilimsel = normalizeString(m.Bilimsel || "");
        if (!sozcuk.startsWith(q)) {
            if (bilimsel.startsWith(q)) {
                displayMain = m.Bilimsel; displaySub = m.Sözcük;
            } else {
                const foundSyn = m['Eş Anlamlılar']?.split(',').map(s => s.trim()).find(s => normalizeString(s).startsWith(q));
                if(foundSyn) { displayMain = foundSyn; displaySub = m.Sözcük; }
            }
        }
        const mainText = isGreek ? convertToGreek(displayMain) : displayMain;
        const subText = displaySub ? (isGreek ? convertToGreek(displaySub) : displaySub) : "";
        d.innerHTML = `<span class="font-bold text-foreground-light dark:text-foreground-dark">${mainText}</span>${subText ? `<span class="opacity-50 ml-2 text-sm text-muted-light dark:text-muted-dark">${subText}</span>` : ''}`;
        d.onclick = () => selectWord(m, displayMain, false, displaySub, true);
        div.appendChild(d);
    });
    cont.classList.remove('hidden');
}

function selectWord(wordData, pText, forceNoHistory = false, subText = null, fromSearch = false) { 
    lastSelectedWord = wordData; 
    document.getElementById('searchInput').value = isGreek ? convertToGreek(pText) : pText; 
    document.getElementById('suggestions-container').classList.add('hidden'); 
    if (!forceNoHistory) addToHistory(wordData, pText, subText);
    if (fromSearch) {
        hideAllSections();
    } else {
        document.getElementById('welcome-box')?.classList.add('hidden');
        document.getElementById('stats-card')?.classList.add('hidden');
    }
    showResult(wordData); 
    setTimeout(() => { document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); 
}

function hideAllSections() {
    ['welcome-box', 'stats-card', 'alphabet-section', 'stats-section', 'ety-section'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });
    const res = document.getElementById('result');
    if(res) res.innerHTML = '';
}

function showPage(pageId) {
    hideAllSections();
    if (pageId === 'home') {
        document.getElementById('welcome-box').classList.remove('hidden');
        document.getElementById('stats-card').classList.remove('hidden');
        document.getElementById('searchInput').value = '';
    }
}

function showKelimelerPage() { 
    hideAllSections(); 
    document.getElementById('alphabet-section').classList.remove('hidden'); 
    currentSelectedLetter = "A"; 
    renderAlphabet(); 
    showLetterResults("A", 0); 
}

function showStatsPage() { hideAllSections(); document.getElementById('stats-section').classList.remove('hidden'); renderAlphabetStats(); }
function showEtyPage() { hideAllSections(); document.getElementById('ety-section').classList.remove('hidden'); renderEtymologyStats(); }

function showResult(word) {
    const resultDiv = document.getElementById('result');
    const convert = (val) => isGreek ? convertToGreek(val) : val;
    resultDiv.innerHTML = `<div class="bg-subtle-light dark:bg-subtle-dark rounded-lg sm:rounded-xl overflow-hidden p-4 sm:p-6 shadow-md border border-subtle-light dark:border-subtle-dark mt-8"><div class="mb-5"><h2 class="text-4xl font-bold text-primary">${convert(word.Sözcük)}</h2>${word.Bilimsel ? `<p class="text-base text-muted-light dark:text-muted-dark opacity-70 mt-1">${convert(word.Bilimsel)}</p>` : ''}${word.Tür ? `<p class="text-sm opacity-60 mt-0.5">${convert(word.Tür)}</p>` : ''}</div><hr class="border-t border-subtle-light dark:border-subtle-dark my-5"><div class="space-y-6">${word.Açıklama ? `<div><h3 class="text-primary font-bold text-lg mb-1">Açıklama</h3><p class="text-base leading-relaxed">${convert(word.Açıklama)}</p></div>` : ''}${word.Köken ? `<div><h3 class="text-primary font-bold text-lg mb-1">Köken</h3><p class="text-base leading-relaxed">${convert(word.Köken)}</p></div>` : ''}${word.Örnek ? `<div><h3 class="text-primary font-bold text-lg mb-1">Örnek</h3><p class="text-base border-l-4 border-primary/40 pl-4 py-1">${convert(word.Örnek)}</p></div>` : ''}${word['Eş Anlamlılar'] ? `<div><h3 class="text-primary font-bold text-lg mb-1">Eş Anlamlılar</h3><p class="text-base">${convert(word['Eş Anlamlılar'])}</p></div>` : ''}</div></div>`;
}

function renderEtymologyStats() {
    const container = document.getElementById('ety-container'); if (!container) return;
    let etyMap = {}; let totalValidEntries = 0;
    allWords.forEach(w => {
        if (!w.Sözcük || w.Sözcük.trim() === "") return;
        totalValidEntries++;
        let origin = "Türkçe"; let etyText = w.Köken ? w.Köken.trim() : "";
        if (etyText !== "") {
            if (etyText.toLowerCase().includes("kökenli")) {
                let parts = etyText.split(/kökenli/i);
                origin = parts[parts.length - 1].trim() || parts[parts.length - 2].trim().split(" ").pop();
            } else { origin = etyText; }
            if (origin.toLowerCase() === "türkçe") origin = "Türkçe (Melez)";
        }
        etyMap[origin] = (etyMap[origin] || 0) + 1;
    });
    let etyData = Object.keys(etyMap).map(key => ({ label: key, count: etyMap[key], percent: (etyMap[key] / totalValidEntries * 100).toFixed(1) }));
    etyData.sort((a, b) => etySortConfig.key === 'label' ? (etySortConfig.direction === 'asc' ? a.label.localeCompare(b.label, 'tr') : b.label.localeCompare(a.label, 'tr')) : (etySortConfig.direction === 'asc' ? b.count - a.count : a.count - b.count));
    const t_dil = isGreek ? convertToGreek('Dil') : 'Dil';
    const t_adet = isGreek ? convertToGreek('Adet') : 'Adet';
    const t_oran = isGreek ? convertToGreek('Oran') : 'Oran';
    container.innerHTML = `<div class="col-span-full mb-8 flex justify-center items-center select-none"><div class="inline-flex items-center bg-subtle-light dark:bg-subtle-dark p-1.5 rounded-2xl border border-subtle-light dark:border-subtle-dark shadow-sm gap-2"><button onclick="setEtySort('label')" class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${etySortConfig.key === 'label' ? 'bg-primary text-white shadow-md' : 'opacity-50 hover:opacity-100'}">${t_dil}</button><button onclick="setEtySort('count')" class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${etySortConfig.key === 'count' ? 'bg-primary text-white shadow-md' : 'opacity-50 hover:opacity-100'}">${t_adet}</button><div class="h-8 w-[1px] bg-foreground-light/10 dark:bg-foreground-dark/10 mx-1"></div><button onclick="toggleEtyDirection()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-md"><span class="text-xl font-bold">${etySortConfig.direction === 'asc' ? '↓' : '↑'}</span></button></div></div>`;
    etyData.forEach(item => {
        const box = document.createElement('div'); box.className = "bg-subtle-light dark:bg-subtle-dark rounded-xl border border-subtle-light dark:border-subtle-dark overflow-hidden shadow-sm select-none hover:border-primary/50 transition-colors flex flex-col h-full";
        box.innerHTML = `<div class="bg-primary text-white text-center py-2 px-1 font-bold text-[13px] sm:text-sm leading-tight flex items-center justify-center min-h-[44px]">${isGreek ? convertToGreek(item.label) : item.label}</div><div class="flex divide-x divide-subtle-light dark:divide-subtle-dark text-center mt-auto"><div class="flex-1 py-2 leading-tight"><p class="text-[9px] opacity-50 uppercase font-bold mb-0.5">${t_adet}</p><p class="text-base font-bold text-primary">${item.count}</p></div><div class="flex-1 py-2 leading-tight"><p class="text-[9px] opacity-50 uppercase font-bold mb-0.5">${t_oran}</p><p class="text-base font-bold">%${item.percent}</p></div></div>`;
        container.appendChild(box);
    });
}
function setEtySort(key) { etySortConfig.key = key; renderEtymologyStats(); }
function toggleEtyDirection() { etySortConfig.direction = etySortConfig.direction === 'asc' ? 'desc' : 'asc'; renderEtymologyStats(); }

function renderAlphabetStats() {
    const container = document.getElementById('stats-container'); if (!container) return;
    let totalChars = 0; let totalEntries = 0;
    allWords.forEach(w => { if (w.Sözcük) { totalEntries++; totalChars += w.Sözcük.replace(/\s/g, '').length; } });
    let statsData = customAlphabet.filter(h => h !== " ").map(harf => {
        const startsWithCount = allWords.filter(w => w.Sözcük && normalizeString(w.Sözcük).startsWith(normalizeString(harf))).length;
        let totalOccurrence = 0; allWords.forEach(w => { if (w.Sözcük) totalOccurrence += (normalizeString(w.Sözcük).split(normalizeString(harf)).length - 1); });
        return { harf, başta: startsWithCount, baştaPct: (startsWithCount / totalEntries * 100).toFixed(1), toplam: totalOccurrence, toplamPct: (totalOccurrence / totalChars * 100).toFixed(1) };
    });
    statsData.sort((a, b) => sortConfig.key === 'harf' ? (sortConfig.direction === 'asc' ? a.harf.localeCompare(b.harf, 'tr') : b.harf.localeCompare(a.harf, 'tr')) : (sortConfig.direction === 'asc' ? b[sortConfig.key] - a[sortConfig.key] : a[sortConfig.key] - b[sortConfig.key]));
    const t_harf = isGreek ? convertToGreek('Harf') : 'Harf';
    const t_basta = isGreek ? convertToGreek('Başta') : 'Başta';
    const t_toplam = isGreek ? convertToGreek('Toplam') : 'Toplam';
    container.innerHTML = `<div class="col-span-full mb-8 flex justify-center items-center select-none"><div class="inline-flex items-center bg-subtle-light dark:bg-subtle-dark p-1.5 rounded-2xl border border-subtle-light dark:border-subtle-dark shadow-sm gap-2"><div class="flex gap-1"><button onclick="setSortKey('harf')" class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${sortConfig.key === 'harf' ? 'bg-primary text-white shadow-md' : 'opacity-50 hover:opacity-100'}">${t_harf}</button><button onclick="setSortKey('başta')" class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${sortConfig.key === 'başta' ? 'bg-primary text-white shadow-md' : 'opacity-50 hover:opacity-100'}">${t_basta}</button><button onclick="setSortKey('toplam')" class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${sortConfig.key === 'toplam' ? 'bg-primary text-white shadow-md' : 'opacity-50 hover:opacity-100'}">${t_toplam}</button></div><div class="h-8 w-[1px] bg-foreground-light/10 dark:bg-foreground-dark/10 mx-1"></div><button onclick="toggleSortDirection()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-md"><span class="text-xl font-bold">${sortConfig.direction === 'asc' ? '↓' : '↑'}</span></button></div></div>`;
    statsData.forEach(item => {
        const box = document.createElement('div'); box.className = "bg-subtle-light dark:bg-subtle-dark rounded-xl border border-subtle-light dark:border-subtle-dark overflow-hidden shadow-sm select-none";
        box.innerHTML = `<div class="bg-primary text-white text-center py-2 font-bold text-xl">${isGreek ? convertToGreek(item.harf) : item.harf}</div><div class="flex divide-x divide-subtle-light dark:divide-subtle-dark text-center"><div class="flex-1 py-3 leading-tight"><p class="text-[10px] opacity-50 uppercase font-bold mb-1">${t_basta}</p><p class="text-lg font-bold text-primary">${item.başta}</p><p class="text-[11px] opacity-70 mt-0.5">%${item.baştaPct}</p></div><div class="flex-1 py-3 leading-tight"><p class="text-[10px] opacity-50 uppercase font-bold mb-1">${t_toplam}</p><p class="text-lg font-bold">${item.toplam}</p><p class="text-[11px] opacity-70 mt-0.5">%${item.toplamPct}</p></div></div>`;
        container.appendChild(box);
    });
}
function setSortKey(k) { sortConfig.key = k; renderAlphabetStats(); }
function toggleSortDirection() { sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc'; renderAlphabetStats(); }

function renderAlphabet() {
    const list = document.getElementById('alphabet-list'); if (!list) return;
    list.innerHTML = ""; list.className = "grid grid-cols-5 md:grid-cols-10 gap-2 justify-items-center";
    customAlphabet.forEach(harf => {
        if(harf === " ") return;
        const btn = document.createElement('button');
        const isActive = currentSelectedLetter === harf;
        btn.className = `w-10 h-10 flex items-center justify-center font-bold rounded transition-all select-none ${isActive ? 'bg-primary text-white shadow-md scale-110' : 'bg-subtle-light/50 dark:bg-subtle-dark hover:bg-primary hover:text-white'}`;
        btn.innerText = isGreek ? convertToGreek(harf) : harf;
        btn.onclick = () => { currentSelectedLetter = harf; document.getElementById('result').innerHTML = ''; renderAlphabet(); showLetterResults(harf, 0); };
        list.appendChild(btn);
    });
}

function showLetterResults(harf, page, showAll = false) {
    const resultsDiv = document.getElementById('letter-results'); const pagDiv = document.getElementById('alphabet-pagination');
    resultsDiv.innerHTML = ""; pagDiv.innerHTML = "";
    const filtered = allWords.filter(w => w.Sözcük && normalizeString(w.Sözcük).startsWith(normalizeString(harf))).sort((a,b) => a.Sözcük.localeCompare(b.Sözcük, 'tr'));
    const start = page * PAGE_SIZE; const end = showAll ? filtered.length : start + PAGE_SIZE;
    filtered.slice(start, end).forEach(item => {
        const b = document.createElement('button'); b.className = "text-left p-3 rounded bg-white/5 border border-subtle-light dark:border-subtle-dark hover:border-primary transition-all truncate font-semibold text-sm select-none text-foreground-light dark:text-foreground-dark";
        b.innerText = isGreek ? convertToGreek(item.Sözcük) : item.Sözcük;
        b.onclick = () => selectWord(item, item.Sözcük, false, null, false); 
        resultsDiv.appendChild(b);
    });
    if (filtered.length > 0) {
        pagDiv.classList.remove('hidden');
        if (!showAll && filtered.length > PAGE_SIZE) {
            for (let i = 0; i < Math.ceil(filtered.length / PAGE_SIZE); i++) {
                const pBtn = document.createElement('button'); pBtn.className = `w-10 h-10 flex items-center justify-center rounded font-bold transition-all select-none ${i === page ? 'bg-primary text-white' : 'bg-subtle-light/50 dark:bg-subtle-dark hover:bg-primary/20'}`;
                pBtn.innerText = i + 1; pBtn.onclick = () => { showLetterResults(harf, i); document.getElementById('alphabet-menu').scrollIntoView({ behavior: 'smooth' }); };
                pagDiv.appendChild(pBtn);
            }
        }
    }
}

function toggleFeedbackForm() { 
    const modal = document.getElementById('feedbackModal');
    modal.classList.toggle('hidden');
    
    const messageInput = document.getElementById('feedback-message');
    const contactInput = document.getElementById('feedback-contact');

    if (!modal.classList.contains('hidden')) {
        messageInput.value = '';
        contactInput.value = '';
        messageInput.placeholder = "Mesajınız...";
        contactInput.placeholder = "İsteğe bağlı";
    }
}

function submitFeedback() {
    const message = document.getElementById('feedback-message').value.trim();
    const contact = document.getElementById('feedback-contact').value.trim();
    const scriptURL = 'https://script.google.com/macros/s/AKfycbww1GhijmHLc81d6-K7lp6muodrlxk_PKm71S1inisYwZ_sAPgBj5l5iondTPTShZnV/exec';

    if (!message) { alert("Lütfen bir mesaj yazın."); return; }

    const btn = document.getElementById('feedback-submit-btn');
    btn.disabled = true; btn.innerText = "Gönderiliyor...";

    const params = new URLSearchParams();
    params.append('message', message);
    params.append('contact', "'" + contact);

    fetch(scriptURL, { 
        method: 'POST', 
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString() 
    })
    .then(() => { 
        alert("Geri bildiriminiz başarıyla iletildi. Teşekkür ederiz!"); 
        toggleFeedbackForm(); 
    })
    .catch(() => { 
        alert("Bir sorun oluştu."); 
    })
    .finally(() => { 
        btn.disabled = false; 
        btn.innerText = "Gönder"; 
    });
}

function calculateStats() {
    const s = document.getElementById('stats-sentence'); if (!s) return;
    const valid = allWords.filter(r => r.Sözcük && r.Sözcük.trim() !== "");
    const eCount = valid.length; let tWord = 0;
    valid.forEach(r => { tWord += 1; if (r['Eş Anlamlılar']) tWord += r['Eş Anlamlılar'].split(',').filter(x => x.trim() !== '').length; });
    let sent = `Şu an bu sözlükte ${eCount} madde altında toplam ${tWord} kelime bulunmaktadır.`;
    if (isGreek) sent = convertToGreek(sent);
    s.innerHTML = sent.replace(eCount, `<span class="text-primary font-bold">${eCount}</span>`).replace(tWord, `<span class="text-primary font-bold">${tWord}</span>`);
}

function normalizeString(str) { return str ? str.toLocaleLowerCase('tr-TR') : ''; }
function convertToGreek(str) { if(!str) return ""; return str.split('').map(char => latinToGreekMap[char] || char).join(''); }
function updateText(lang) { document.querySelectorAll('[data-key]').forEach(el => { const key = el.getAttribute('data-key'); if (translations['tr'][key]) { let f = translations['tr'][key]; if (lang === 'gr') f = convertToGreek(f); if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = f; else el.textContent = f; } }); }
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }

async function fetchWords() { 
    const url = `https://opensheet.elk.sh/1R01aIajx6dzHlO-KBiUXUmld2AEvxjCQkUTFGYB3EDM/Sözlük`; 
    try { 
        const res = await fetch(url); allWords = await res.json(); 
        initButtons(); setupSearch(); calculateStats(); updateText('tr');
    } catch (e) { console.error(e); } 
}
fetchWords();
