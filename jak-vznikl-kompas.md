# Jak vznikl Český kompas (a jak je naprogramovaný)

Na začátku bylo video britského youtubera Britmonkeyho, který si všiml, že klasický politický kompas — levice, pravice, autoritáři, liberálové — už nepopisuje svět, ve kterém žijeme. Sestavil vlastní, pro dnešní Británii, a napároval na něj reálné osobnosti. Skvělý nápad, říkal jsem si. Tohle by zasloužilo českou verzi. Kratší, drzejší, bez akademických ambicí. Hra, ne sociologie.

A taky experiment. Živím se tím, že učím lidi pracovat s umělou inteligencí, a Český kompas je ukázka řemesla, kterému se říká vibecoding: aplikaci jsem nenapsal, aplikaci jsem zadal. Kód programoval Claude Code od Anthropicu. Já dělal zadavatele, metodika, textaře a hlavního testera. Celé to vzniklo za pár dní, z toho většinu času zabraly debaty o otázkách a osách — tedy přesně to, co by zabralo většinu času i před třiceti lety. Technologie se mění, rozhodování zůstává.

## Nejdřív zadání, pak kód

Než padl první řádek kódu, vzniklo klasické zadání: co stavíme, co nestavíme, jak se počítá skóre, jaké texty kde budou. Zní to nudně, ale je to nejdůležitější krok. AI umí naprogramovat skoro cokoliv — o to důležitější je vědět co.

První funkční verze byla hotová za odpoledne. Pak přišlo to zajímavější: testování na kamarádech a známých a s ním vlna změn. Některé otázky byly návodné, jiné dvojznačné, jedna se ptala na dvě věci najednou. Každou vlnu připomínek jsme zapracovali, přeměřili a nasadili. Web, který právě vidíte, je zhruba desátá verze.

## Jak jsme zabili dvě osy

Původní návrh měl osy čtyři: Brusel–Trump, kavárna–zbytek Česka, bude líp–bylo líp a úspěch–solidarita. Vypadalo to učeně. Pak jsme spočítali, jak spolu osy souvisejí, a ukázalo se, že Brusel–Trump a kavárna–zbytek měří prakticky totéž (korelace 0,95). Kdo fandí Ukrajině, chodí i k volbám s Fialou, a naopak. Dvě osy, jedna informace.

Tak jsme je sloučili do jediné: **dezoláti versus lepšolidi**. Schválně necháváme obě nadávky — každá strana dostane tu svoji, to je fér.

O druhou osu se utkaly optimismus (bude líp / bylo líp) a ekonomika (každý sám za sebe / všichni společně). Rozhodla matematika: optimismus s první osou koreluje (0,57 — dezoláti jsou většinou pesimisti), takže by se mapa sesypala na diagonálu a půlka kvadrantů zela prázdnotou. Ekonomika je na první ose téměř dokonale nezávislá (0,06): komunistka Konečná a ultrakapitalista Klaus jsou na ose dezolátů sousedi, ekonomicky je dělí propast. Proto je svislá osa ekonomická a jmenuje se prostě **Já a My**. A protože otázka „Líp už bylo, nebo teprve bude?" je možná nejdůležitější otázka dneška, zůstala v testu jako bonusový rozstřel — jen se nepočítá do skóre.

Detail pro fajnšmekry: část výroků je obrácených (souhlas táhne doleva, jiný souhlas doprava), aby test nezvýhodňoval lidi, kteří ze zdvořilosti souhlasí se vším.

## Dvojník a 1 681 možných výsledků

Váš výsledek je bod na mapě. Politický dvojník je ta z 22 osobností, jejíž bod je nejblíž — obyčejná euklidovská vzdálenost, žádná magie. Procento shody říká, jak blízko jste: 100 % znamená stejné souřadnice.

Pozice osobností jsou můj subjektivní odhad (hra, ne sociologie, podruhé). Ale jejich rozmístění jsme ladili simulací: skript projede všech 1 681 možných výsledků testu a spočítá, jak často která osobnost „vyhrává". Hlídali jsme dvě věci — aby žádná figura nebyla nedosažitelná a žádná nedominovala. Teď je nejčastějším dvojníkem Petr Fiala s 10 % mapy a extrémy jako Okamura dostanou právem jen ti, kdo to myslí opravdu vážně.

## Technika: žádný framework, 55 kilobajtů

Celý web jsou tři soubory: HTML, CSS a JavaScript. Žádný framework, žádné externí knihovny, žádný build proces. Dohromady asi 55 kB — méně, než dnes váží průměrná cookie lišta. Sdílecí kartička se kreslí přímo v prohlížeči přes Canvas API a výsledek se do odkazu vejde jako šest znaků (dvě souřadnice a dvě bonusové odpovědi, zabalené do base64). Otázky i osobnosti jsou v jednom datovém souboru, který jde upravovat bez znalosti programování. A k tomu 33 automatických testů, které hlídají, že skórování počítá, co má.

## Data: žádné cookies, žádné sledování

Web nepoužívá cookies ani analytiku. Po dokončení testu se anonymně uloží výsledek a odpovědi do tabulky — bez jména, bez IP adresy, bez čehokoliv osobního. Demografické otázky na konci jsou dobrovolné. K čemu to je? Až odpoví dost lidí, napíšeme článek o tom, jak odpovídalo Česko. Na to se docela těším.

---

Ještě jedna věc. Kdyby vám výsledek nesedl: je to dvacet otázek a tři minuty, ne psychoanalýza. Ale podle dosavadního testování platí, že se lidi u výsledku nejdřív ošívají — a pak ho pošlou pěti kamarádům, ať se taky změří. Což je přesně ten důvod, proč tahle hra vznikla.
