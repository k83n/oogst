/* Werkt de statusregels op een tipspagina bij met de actuele stand uit
   Notion. De pagina's zelf zijn statisch en worden nooit opnieuw
   gerenderd; deze haak houdt ze bij de tijd. Gegenereerd door
   Vrijdag-Administratie/scripts/tips_status.py — niet met de hand wijzigen. */
(function () {
  var basis = location.pathname.indexOf("/oogst/") === 0
    ? "/oogst/" : location.pathname.replace(/[^/]*$/, "../");
  fetch(basis + "kijkstatus.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { if (data) werkBij(data); })
    .catch(function () { /* stil: de bevroren regel blijft dan gewoon staan */ });

  function norm(s) {
    return (s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/['’‘`´]/g, "")
      .replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  function sterren(score) {
    if (!score) return "";
    return " · ★" + String(score).replace(".", ",");
  }

  function zin(item, isSerie, seizoen) {
    var st = item.status, s = sterren(item.score);
    var sz = isSerie && seizoen ? "seizoen " + seizoen + " " : "";
    if (st === "Watched" || st === "Completed")
      return { klasse: "aanwezig", tekst: "✓ Gezien" + (sz ? " — " + sz.trim() : "") + s };
    if (st === "Watching")
      return { klasse: "aanwezig", tekst: "▶ Kijk ik nu" + (sz ? " — " + sz.trim() : "") + s };
    if (st === "To Watch" || st === "Upcoming" || st === "Currently Broadcasting")
      return { klasse: "aanwezig", tekst: "◷ Staat op mijn lijst" + (sz ? " — " + sz.trim() : "") };
    return null;
  }

  function werkBij(data) {
    var kaarten = document.querySelectorAll("section.artiest");
    var gewijzigd = 0;
    kaarten.forEach(function (kaart) {
      var regel = kaart.querySelector(".notion-status");
      var kop = kaart.querySelector("h2");
      if (!regel || !kop) return;
      // games/boeken hebben een eigen bron; alleen Notion-regels aanraken
      if (regel.textContent.indexOf("Notion") === -1) return;

      var sleutel = norm(kop.textContent);
      var meta = (kaart.querySelector(".albumtitel") || {}).textContent || "";
      var isSerie = /serie/i.test(meta);
      var m = meta.match(/seizoen\s+(\d+)/i);
      var seizoen = m ? m[1] : null;

      var item = null;
      if (isSerie && data.series[sleutel]) {
        var g = data.series[sleutel];
        item = (seizoen && g.seizoenen[seizoen]) || g.laatste;
        if (seizoen && !g.seizoenen[seizoen]) seizoen = item && item.seizoen;
      } else if (data.films[sleutel]) {
        item = data.films[sleutel];
      } else if (data.series[sleutel]) {
        // mediumtype ontbreekt of staat er verkeerd in
        isSerie = true;
        item = data.series[sleutel].laatste;
        seizoen = item && item.seizoen;
      }
      if (!item) return;

      var nieuw = zin(item, isSerie, seizoen);
      if (!nieuw) return;
      var was = regel.textContent.trim();
      if (was === nieuw.tekst) return;
      regel.textContent = nieuw.tekst;
      regel.className = "notion-status " + nieuw.klasse;
      regel.title = "Bijgewerkt op " + data.bijgewerkt;
      gewijzigd++;
    });
    if (gewijzigd) {
      var voet = document.querySelector("footer");
      if (voet) {
        var el = document.createElement("div");
        el.style.cssText = "margin-top:6px;opacity:.75";
        el.textContent = "Statussen bijgewerkt op " + data.bijgewerkt;
        voet.appendChild(el);
      }
    }
  }
})();
