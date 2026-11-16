/* Lader: kiest het klimaatbestand (weer.js) van het station van het actieve project (zie hanzedorp-projecten.js). */
(function () {
  const st = (window.HANZEDORP_DATA && window.HANZEDORP_DATA.project && window.HANZEDORP_DATA.project.station) || "278";
  if (typeof document !== "undefined" && document.readyState === "loading") document.write('<script src="weer/' + st + '/weer.js"><\/script>');
  else if (typeof require !== "undefined") require(__dirname + "/weer/" + st + "/weer.js");
})();
