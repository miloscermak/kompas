// ============================================================
// Český kompas 2026 — DATA
// Tenhle soubor můžeš upravovat bez znalosti programování.
// Návod je v README.md. Logika se ničeho tady nedotýká.
// ============================================================

// --- Otázky ---
// axis: 1 = Brusel/Trump, 2 = Kavárna/Zbytek, 3 = Bude líp/Bylo líp, 4 = Úspěch/Solidarita
// pole: +1 když souhlas táhne ke kladnému pólu osy (Brusel, Kavárna, Bude líp, Úspěch),
//       -1 když souhlas táhne k zápornému pólu
const QUESTIONS = [
  // Osa 1: BRUSEL vs TRUMP
  { id: 1,  axis: 1, text: "Česko má podporovat Ukrajinu, i zbraněmi.", pole: 1 },
  { id: 2,  axis: 1, text: "Nevadí mi, když na úřadech a školách visí ukrajinské vlajky.", pole: 1 },
  { id: 3,  axis: 1, text: "Česko má přijmout euro.", pole: 1 },
  { id: 4,  axis: 1, text: "Přistěhovalci jsou pro Česko přínos.", pole: 1 },
  { id: 5,  axis: 1, text: "Čím víc solárních panelů a větrníků, tím líp.", pole: 1 },
  // Osa 2: KAVÁRNA vs ZBYTEK ČESKA
  { id: 6,  axis: 2, text: "Radši Fiala než Babiš.", pole: 1 },
  { id: 7,  axis: 2, text: "Stejnopohlavní páry mají mít manželství včetně adopcí.", pole: 1 },
  { id: 8,  axis: 2, text: "Veřejnoprávní média jsou přežitek.", pole: -1 },
  { id: 9,  axis: 2, text: "Školy mají s dětmi víc mluvit o genderu a rozmanitosti.", pole: 1 },
  { id: 10, axis: 2, text: "Piráti a spol. řeší gender a inkluzi místo skutečných problémů lidí.", pole: -1 },
  // Osa 3: BUDE LÍP vs BYLO LÍP
  { id: 11, axis: 3, text: "Dnešní dvacátníci se budou mít hůř než jejich rodiče.", pole: -1 },
  { id: 12, axis: 3, text: "AI sebere víc práce, než kolik jí vytvoří.", pole: -1 },
  { id: 13, axis: 3, text: "Za deset let bude Česko lepší místo k životu než dnes.", pole: 1 },
  { id: 14, axis: 3, text: "Do deseti let bude Evropa ve válce s Ruskem.", pole: -1 },
  { id: 15, axis: 3, text: "Mobily mají být ve školách plošně zakázané.", pole: -1 },
  // Osa 4: ÚSPĚCH vs SOLIDARITA
  { id: 16, axis: 4, text: "Česko má zavést majetkovou daň pro nejbohatší.", pole: -1 },
  { id: 17, axis: 4, text: "Kdo odmítne nabízenou práci, má přijít o dávky.", pole: 1 },
  { id: 18, axis: 4, text: "Stát má sám stavět nájemní byty, i za cenu vyšších daní.", pole: -1 },
  { id: 19, axis: 4, text: "Na vysokých školách se má platit školné.", pole: 1 },
  { id: 20, axis: 4, text: "Absolventi by prvních pět let po škole neměli platit daň z příjmu.", pole: -1 },
];

// Pevné pořadí otázek (rotace os A-C-B-D, aby nešly za sebou otázky stejné osy)
const ORDER = [1, 11, 6, 16, 2, 12, 7, 17, 3, 13, 8, 18, 4, 14, 9, 19, 5, 15, 10, 20];

// Škála odpovědí (shora dolů na mobilu, zleva doprava na desktopu)
const ANSWER_SCALE = [
  { label: "Rozhodně souhlasím",    value:  2 },
  { label: "Spíš souhlasím",        value:  1 },
  { label: "Nevím / je mi to jedno", value: 0 },
  { label: "Spíš nesouhlasím",      value: -1 },
  { label: "Rozhodně nesouhlasím",  value: -2 },
];

// Rozstřel (mimo skóre)
const SHOOTOUT_TEXT = "Co je největší hrozba pro Česko?";
const THREATS = [
  { label: "Rusko",          icon: "🐻" },
  { label: "Přistěhovalci",  icon: "🧳" },
  { label: "AI",             icon: "🤖" },
  { label: "Trump",          icon: "🧢" },
  { label: "Změna klimatu",  icon: "🔥" },
];

// Kvadranty (x = osa 1, y = osa 3)
const QUADRANTS = {
  bruselBudelip: { name: "Bruselský sluníčkář", desc: "Věříš Evropě, budoucnosti a tomu, že se to nakonec nějak vyřeší. Kéž bys měl pravdu." },
  bruselBylolip: { name: "Ustaraný demokrat",   desc: "Fandíš Západu, ale v noci nespíš. Piješ kávu a scrolluješ zprávy, i když víš, že nemáš." },
  trumpBudelip:  { name: "Národní buditel 2.0", desc: "Evropě nevěříš, sobě jo. Až se to celé sesype, ty budeš připravený." },
  trumpBylolip:  { name: "Hospodský prorok",    desc: "Všechno jsi říkal předem a nikdo tě neposlouchal. Aspoň že to pivo ještě stojí za to." },
  center:        { name: "Chameleon středu",    desc: "Vidíš argumenty všech stran. To je buď moudrost, nebo alibismus, a ty sám nevíš, co z toho." },
};

// Odznaky pro osy 2 a 4 (při |skóre| <= 2 je odznak "Nerozhodnutý")
const BADGES = {
  axis2plus:  "Tým Kavárna",
  axis2minus: "Tým Zbytek Česka",
  axis4plus:  "Meritokrat",
  axis4minus: "Solidarista",
  undecided:  "Nerozhodnutý",
};

// --- Ukládání výsledků (Google Apps Script) ---
// URL webhooku z nasazení apps-script/webhook.gs (návod v README.md).
// Prázdný řetězec = nic se neodesílá (vývojový režim, payload jde do konzole).
const WEBHOOK_URL = "";

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
// scores: [osa1, osa2, osa3, osa4], každá -10 až +10
// POZOR: první subjektivní odhady, před spuštěním ruční revize!
const FIGURES = [
  { name: "Petr Pavel",              desc: "prezident, generál ve výslužbě",  scores: [ 8,  5,  3,  2] },
  { name: "Andrej Babiš",            desc: "premiér, šéf ANO",                scores: [-4, -7,  2, -3] },
  { name: "Petr Fiala",              desc: "expremiér, šéf ODS",              scores: [ 7,  6, -1,  6] },
  { name: "Tomio Okamura",           desc: "šéf SPD",                         scores: [-9, -9, -6, -2] },
  { name: "Filip Turek",             desc: "Motoristé, europoslanec",         scores: [-8, -8, -2,  5] },
  { name: "Kateřina Konečná",        desc: "šéfka Stačilo!, europoslankyně",  scores: [-8, -6, -4, -8] },
  { name: "Danuše Nerudová",         desc: "ekonomka, europoslankyně",        scores: [ 8,  8,  4, -2] },
  { name: "Zdeněk Hřib",             desc: "Piráti, náměstek primátora",      scores: [ 7,  7,  2, -1] },
  { name: "Vít Rakušan",             desc: "šéf STAN",                        scores: [ 7,  5,  1,  0] },
  { name: "Markéta Pekarová Adamová", desc: "TOP 09",                         scores: [ 7,  6,  0,  6] },
  { name: "Alena Schillerová",       desc: "ANO, ekonomika",                  scores: [-3, -6,  1, -3] },
  { name: "Karel Havlíček",          desc: "ANO, průmysl",                    scores: [-2, -4,  2,  0] },
  { name: "Miloš Zeman",             desc: "exprezident",                     scores: [-7, -8, -3, -1] },
  { name: "Václav Klaus",            desc: "exprezident",                     scores: [-6, -7, -5,  7] },
  { name: "Jindřich Rajchl",         desc: "šéf PRO",                         scores: [-9, -9, -7,  1] },
  { name: "Mikuláš Minář",           desc: "aktivista, Milion chvilek",       scores: [ 6,  6, -2, -4] },
  { name: "Olga Richterová",         desc: "Piráti",                          scores: [ 7,  7,  1, -5] },
  { name: "Marian Jurečka",          desc: "KDU-ČSL",                         scores: [ 4, -2,  0, -1] },
  { name: "Lubomír Zaorálek",        desc: "sociální demokrat",               scores: [ 2,  0, -2, -5] },
  { name: "Xaver Veselý",            desc: "moderátor",                       scores: [-6, -8, -3,  1] },
  { name: "Daniel Kroupa",           desc: "filozof, disident",               scores: [ 7,  4, -1,  3] },
  { name: "Erik Best",               desc: "komentátor, Fleet Sheet",         scores: [-4, -3, -1,  2] },
];

// Export pro node (testy); v prohlížeči jsou proměnné globální
if (typeof module !== "undefined") {
  module.exports = { QUESTIONS, ORDER, ANSWER_SCALE, SHOOTOUT_TEXT, THREATS, QUADRANTS, BADGES, FIGURES, DEMOGRAPHICS, WEBHOOK_URL };
}
