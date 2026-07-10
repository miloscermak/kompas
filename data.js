// ============================================================
// Český kompas 2026 — DATA
// Tenhle soubor můžeš upravovat bez znalosti programování.
// Návod je v README.md. Logika se ničeho tady nedotýká.
// ============================================================

// --- Otázky ---
// axis: 1 = Dezoláti/Lepšolidi (X), 2 = My/Já (Y)
// pole: +1 když souhlas táhne ke kladnému pólu osy (Lepšolidi, Já),
//       -1 když souhlas táhne k zápornému pólu (Dezoláti, My)
const QUESTIONS = [
  // Osa X: DEZOLÁTI vs LEPŠOLIDI
  { id: 1,  axis: 1, text: "Rusko je agresor, napadlo Ukrajinu.", pole: 1 },
  { id: 2,  axis: 1, text: "Brusel je horší než Trump.", pole: -1 },
  { id: 3,  axis: 1, text: "Česko má přijmout euro.", pole: 1 },
  { id: 4,  axis: 1, text: "Přistěhovalci jsou pro Česko přínos.", pole: 1 },
  { id: 5,  axis: 1, text: "Čím víc solárních panelů a větrníků, tím líp.", pole: 1 },
  { id: 6,  axis: 1, text: "Radši Fiala než Babiš.", pole: 1 },
  { id: 7,  axis: 1, text: "Souhlasím s adopcí dětí homosexuálními páry.", pole: 1 },
  { id: 8,  axis: 1, text: "Veřejnoprávní média jsou přežitek.", pole: -1 },
  { id: 9,  axis: 1, text: "Kdo jí maso, přispívá k ničení planety.", pole: 1 },
  { id: 10, axis: 1, text: "Gender je pseudoproblém.", pole: -1 },
  // Osa Y: MY vs JÁ
  { id: 11, axis: 2, text: "Bohaté musíme víc zdanit.", pole: -1 },
  { id: 12, axis: 2, text: "Sociálních dávek je v Česku příliš moc, lidem to bere motivaci pracovat.", pole: 1 },
  { id: 13, axis: 2, text: "Lidi mají vlastnit jen byty, ve kterých sami bydlí.", pole: -1 },
  { id: 14, axis: 2, text: "Na vysokých školách se má platit školné.", pole: 1 },
  { id: 15, axis: 2, text: "Soukromé bazény a klimatizace jsou zlo.", pole: -1 },
  { id: 16, axis: 2, text: "Zdravotnictví má být zadarmo.", pole: -1 },
  { id: 17, axis: 2, text: "Kdo je chudý, může si za to většinou sám.", pole: 1 },
  { id: 18, axis: 2, text: "Úspěšní lidé si své bohatství zaslouží.", pole: 1 },
  { id: 19, axis: 2, text: "Je správné počítat pokuty a sankce podle příjmů.", pole: -1 },
  { id: 20, axis: 2, text: "Čím míň stát lidem zasahuje do života, tím líp.", pole: 1 },
];

// Pevné pořadí otázek (střídání os X a Y, aby nešly za sebou otázky stejné osy)
const ORDER = [1, 11, 6, 16, 2, 12, 7, 17, 3, 13, 8, 18, 4, 14, 9, 19, 5, 15, 10, 20];

// Škála odpovědí (shora dolů na mobilu, zleva doprava na desktopu)
const ANSWER_SCALE = [
  { label: "Rozhodně souhlasím",    value:  2 },
  { label: "Spíš souhlasím",        value:  1 },
  { label: "Nevím / je mi to jedno", value: 0 },
  { label: "Spíš nesouhlasím",      value: -1 },
  { label: "Rozhodně nesouhlasím",  value: -2 },
];

// Rozstřely (mimo skóre) — dvě bonusové otázky za sebou
const SHOOTOUTS = [
  { key: "threat", text: "Co je největší hrozba pro Česko?", options: [
    { label: "Rusko",          icon: "🐻" },
    { label: "Přistěhovalci",  icon: "🧳" },
    { label: "AI",             icon: "🤖" },
    { label: "Trump",          icon: "🧢" },
    { label: "Změna klimatu",  icon: "🔥" },
  ]},
  { key: "lip", text: "Líp už bylo, nebo teprve bude?", options: [
    { label: "Líp už bylo",     icon: "🕰️" },
    { label: "Líp teprve bude", icon: "🌅" },
  ]},
];

// Kvadranty (x = osa Dezoláti/Lepšolidi, y = osa My/Já)
// POZOR: popisky (desc) jsou první návrhy, Miloš je zreviduje.
const QUADRANTS = {
  byznysmen: { name: "Sluníčkový byznysmen", desc: "Věříš Evropě, trhu a hlavně sám sobě. Svět je podle tebe fér soutěž — zatím ti vychází." },
  rovnostar: { name: "Rovnostář z kavárny",  desc: "Solidarita pro tebe není sprosté slovo. Kávu piješ fér, daně platíš rád a svědomí máš čisté." },
  konzerva:  { name: "Pragmatická konzerva", desc: "Brusel ti nemá co mluvit do života a stát ti nemá sahat na peníze. Co je potřeba, zařídíš si sám." },
  socan:     { name: "Socan vlastenec",      desc: "Stát se má postarat o svoje lidi. O ty naše. Kdysi to tu drželo pohromadě líp — a šlo by to zas." },
  center:    { name: "Chameleon středu",     desc: "Vidíš argumenty všech stran. To je buď moudrost, nebo alibismus, a ty sám nevíš, co z toho." },
};

// --- Ukládání výsledků (Google Apps Script) ---
// URL webhooku z nasazení apps-script/webhook.gs (návod v README.md).
// Prázdný řetězec = nic se neodesílá (vývojový režim, payload jde do konzole).
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbygBajv80ZLv16LYZTQo8EV1d-W67TkclOLNBVI-axQscFik8LqHiig4Y1jNZbgbB9O/exec";

// --- Demografický průzkum (dobrovolný, na výsledkovce) ---
const DEMOGRAPHICS = [
  { id: "age", label: "Kolik ti je?", options: [
    { value: "u25",   label: "Do 25" },
    { value: "26_40", label: "26–40" },
    { value: "41_60", label: "41–60" },
    { value: "60p",   label: "Přes 60" },
  ]},
  { id: "gender", label: "Jsi…", options: [
    { value: "muz",  label: "Muž" },
    { value: "zena", label: "Žena" },
    { value: "jine", label: "Jiné" },
    { value: "na",   label: "Nechci uvést" },
  ]},
  { id: "place", label: "Kde bydlíš?", options: [
    { value: "praha",   label: "Praha" },
    { value: "krajske", label: "Krajské město" },
    { value: "mesto",   label: "Menší město" },
    { value: "vesnice", label: "Vesnice" },
  ]},
  { id: "education", label: "Nejvyšší dokončené vzdělání?", options: [
    { value: "zs", label: "Základní" },
    { value: "ss", label: "Střední" },
    { value: "vs", label: "Vysokoškolské" },
  ]},
];

// --- Figury ---
// scores: [x, y] — x: Dezoláti (-20) až Lepšolidi (+20), y: My (-20) až Já (+20)
// POZOR: první subjektivní odhady, před spuštěním ruční revize!
const FIGURES = [
  { name: "Petr Pavel",              desc: "prezident, generál ve výslužbě",  scores: [ 13,   3] },
  { name: "Andrej Babiš",            desc: "premiér, šéf ANO",                scores: [-10,  -5] },
  { name: "Petr Fiala",              desc: "expremiér, šéf ODS",              scores: [ 12,  14] },
  { name: "Tomio Okamura",           desc: "šéf SPD",                         scores: [-18,  -8] },
  { name: "Filip Turek",             desc: "Motoristé, europoslanec",         scores: [-15,  12] },
  { name: "Kateřina Konečná",        desc: "šéfka Stačilo!, europoslankyně",  scores: [-14, -16] },
  { name: "Danuše Nerudová",         desc: "ekonomka, europoslankyně",        scores: [ 17,   1] },
  { name: "Zdeněk Hřib",             desc: "Piráti, náměstek primátora",      scores: [ 13,  -3] },
  { name: "Vít Rakušan",             desc: "šéf STAN",                        scores: [  7,   1] },
  { name: "Markéta Pekarová Adamová", desc: "TOP 09",                         scores: [ 14,   8] },
  { name: "Alena Schillerová",       desc: "ANO, ekonomika",                  scores: [ -7,  -9] },
  { name: "Karel Havlíček",          desc: "ANO, průmysl",                    scores: [ -5,   0] },
  { name: "Miloš Zeman",             desc: "exprezident",                     scores: [-14,  -6] },
  { name: "Václav Klaus",            desc: "exprezident",                     scores: [-12,  15] },
  { name: "Jindřich Rajchl",         desc: "šéf PRO",                         scores: [-17,   5] },
  { name: "Mikuláš Minář",           desc: "aktivista, Milion chvilek",       scores: [ 11,  -8] },
  { name: "Olga Richterová",         desc: "Piráti",                          scores: [ 13, -12] },
  { name: "Marian Jurečka",          desc: "KDU-ČSL",                         scores: [  2,  -2] },
  { name: "Lubomír Zaorálek",        desc: "sociální demokrat",               scores: [  1, -11] },
  { name: "Xaver Veselý",            desc: "moderátor",                       scores: [-13,   0] },
  { name: "Daniel Kroupa",           desc: "filozof, disident",               scores: [  7,   6] },
  { name: "Erik Best",               desc: "komentátor, Fleet Sheet",         scores: [ -6,   4] },
];

// Export pro node (testy); v prohlížeči jsou proměnné globální
if (typeof module !== "undefined") {
  module.exports = { QUESTIONS, ORDER, ANSWER_SCALE, SHOOTOUTS, QUADRANTS, FIGURES, DEMOGRAPHICS, WEBHOOK_URL };
}
