// École OS — petits dessins (SVG en ligne), dans l'esprit des cartes pastel illustrées :
// traits bruns arrondis, aplats pastel, pas d'emoji.
(function (root) {
  'use strict';
  var INK = '#8A6A5C';      // trait principal (brun doux)
  var LEAF = '#9CC896', LEAF2 = '#7FB27E', TRUNK = '#9A7262', CREAM = '#FBF5EA';

  function svg(w, h, body, cls) {
    return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  // ---------------------------------------------------------------- icônes d'étapes (24×24)
  var ICONS = {
    understand: function (c) { return '<path d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.7.5 1.1 1.2 1.1 2V17h4.2v-1.5c0-.8.4-1.5 1.1-2A5.5 5.5 0 0 0 12 3.5z" fill="' + c + '"/><path d="M10 19.5h4M10.6 21.5h2.8"/><path d="M19.5 4.5l.8-.8M20.5 9h1M3.5 9h-1M4.5 4.5l-.8-.8" stroke-width="1.3"/>'; },
    video: function (c) { return '<rect x="3" y="5" width="18" height="12.5" rx="3" fill="' + c + '"/><path d="M10.2 8.6v5.3l4.4-2.65z" fill="' + CREAM + '"/><path d="M8.5 21h7M12 17.5V21"/>'; },
    film: function (c) { return '<rect x="3" y="7" width="13" height="10" rx="2" fill="' + c + '"/><path d="M16 10.5l5-3v9l-5-3z" fill="' + CREAM + '"/><circle cx="7" cy="5" r="2" fill="' + CREAM + '"/><circle cx="12.5" cy="5" r="2" fill="' + CREAM + '"/><path d="M8 12h4" stroke-width="1.2"/>'; },
    write: function (c) { return '<path d="M5 19l1.2-4.4L15.8 5a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L9.4 17.8z" fill="' + c + '"/><path d="M14.3 6.5l3.2 3.2M5 19l3.6-1"/><path d="M12.5 20.5h7" stroke-width="1.3"/>'; },
    read: function (c) { return '<path d="M3 6.2c3-1.4 6-1.2 9 .6v12.4c-3-1.8-6-2-9-.6z" fill="' + c + '"/><path d="M21 6.2c-3-1.4-6-1.2-9 .6v12.4c3-1.8 6-2 9-.6z" fill="' + CREAM + '"/><path d="M14.5 10.2c1.4-.5 2.8-.5 4.2 0M14.5 13c1.4-.5 2.8-.5 4.2 0" stroke-width="1.2"/>'; },
    aiquiz: function (c) { return '<path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 20 17H10l-4.5 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5z" fill="' + c + '"/><path d="M10.2 9.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4"/><circle cx="12" cy="14.6" r=".6" fill="' + INK + '"/>'; },
    chat: function (c) { return '<path d="M3 6.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2V12a2 2 0 0 1-2 2H9l-3.5 3v-3H5a2 2 0 0 1-2-2z" fill="' + c + '"/><path d="M16 9h3a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-.5v2.5L15.5 17.5H12a2 2 0 0 1-2-2V14" fill="' + CREAM + '"/><circle cx="6.8" cy="9.3" r=".8" fill="' + INK + '"/><circle cx="9.5" cy="9.3" r=".8" fill="' + INK + '"/><circle cx="12.2" cy="9.3" r=".8" fill="' + INK + '"/>'; },
    notebooklm: function (c) { return '<rect x="5.5" y="3" width="14" height="18" rx="2.2" fill="' + c + '"/><path d="M3.5 7h3.5M3.5 11h3.5M3.5 15h3.5M3.5 19h3.5"/><path d="M10.5 8h6M10.5 11.5h6M10.5 15h4" stroke-width="1.2"/>'; },
    fiches: function (c) { return '<rect x="6.5" y="3.5" width="13" height="9.5" rx="1.8" fill="' + CREAM + '" transform="rotate(8 13 8)"/><rect x="3.5" y="9" width="14" height="10.5" rx="1.8" fill="' + c + '"/><path d="M6.5 13h8M6.5 16h5" stroke-width="1.2"/>'; },
    inclass: function (c) { return '<rect x="3" y="4" width="18" height="11.5" rx="1.8" fill="' + c + '"/><path d="M6.5 8.5c1.2-1 2.4 1 3.6 0s2.4 1 3.6 0M6.5 11.5h5" stroke-width="1.2"/><path d="M8 15.5L6 21M16 15.5l2 5.5M12 15.5V20"/>'; },
    test: function (c) { return '<rect x="4.5" y="5" width="15" height="10.5" rx="1.8" fill="' + c + '"/><path d="M2.5 18.5h19l-1.2 1.5H3.7z" fill="' + CREAM + '"/><path d="M9 10.3l2.1 2 4-4.2"/>'; },
    practice: function (c) { return '<path d="M6 3.5h9l3.5 3.5v13.5H6z" fill="' + c + '"/><path d="M15 3.5V7h3.5"/><path d="M8.8 11.5l1.3 1.3 2.2-2.4M8.8 16l1.3 1.3 2.2-2.4M14 12h2.3M14 16.6h2.3" stroke-width="1.2"/>'; },
    reading: function (c) { return '<rect x="4" y="13.5" width="16" height="4" rx="1" fill="' + c + '"/><rect x="5.5" y="9.5" width="13" height="4" rx="1" fill="' + CREAM + '"/><rect x="4.5" y="5.5" width="14" height="4" rx="1" fill="' + c + '"/><path d="M4 20.5h16"/>'; },
    prep: function (c) { return '<path d="M3.5 5h10a1.3 1.3 0 0 1 1.3 1.3v5.4A1.3 1.3 0 0 1 13.5 13H8l-3 2.5V13H3.5a1.3 1.3 0 0 1-1.3-1.3V6.3A1.3 1.3 0 0 1 3.5 5z" fill="' + c + '"/><path d="M17 9h3.5a1.3 1.3 0 0 1 1.3 1.3v5.4a1.3 1.3 0 0 1-1.3 1.3H20v2.5l-3-2.5h-4a1.3 1.3 0 0 1-1.3-1.3V15" fill="' + CREAM + '"/>'; },
    project: function (c) { return '<path d="M6 21V3.5"/><path d="M6 4h11.5l-2.4 3.6 2.4 3.6H6z" fill="' + c + '"/><path d="M3.5 21h5"/>'; },
    revision: function (c) { return '<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1"/><path d="M17.8 3.5v3.6h-3.6M6.2 20.5v-3.6h3.6"/><circle cx="12" cy="12" r="2.6" fill="' + c + '"/>'; },
    mine: function (c) { return '<path d="M12 3.5l2.4 5 5.4.7-4 3.7 1 5.4L12 15.7l-4.8 2.6 1-5.4-4-3.7 5.4-.7z" fill="' + c + '"/>'; },
    // interface
    sun: function (c) { return '<circle cx="12" cy="12" r="4.2" fill="' + (c || '#F6D27A') + '"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>'; },
    calendar: function (c) { return '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="' + (c || CREAM) + '"/><path d="M3.5 9.8h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14" r=".9" fill="' + INK + '"/><circle cx="12" cy="14" r=".9" fill="' + INK + '"/><circle cx="15.5" cy="14" r=".9" fill="' + INK + '"/>'; },
    map: function (c) { return '<path d="M3 6.5l5.5-2.5 7 2.5L21 4v13.5l-5.5 2.5-7-2.5L3 20z" fill="' + (c || CREAM) + '"/><path d="M8.5 4v13.5M15.5 6.5V20"/><circle cx="12" cy="11" r="1.2" fill="#E89BB4" stroke="none"/>'; },
    piggy: function (c) { return '<path d="M5 12.5c0-3.6 3.4-6 7.5-6 3.2 0 5.5 1.3 6.6 3.2l1.9-.4-.4 2.3c.3.5.4 1 .4 1.6 0 1.7-1 3.2-2.6 4.2V20h-2.6v-1.8c-.9.2-1.9.3-3 .3s-2-.1-2.9-.4V20H5.7v-2.8C5.2 15.8 5 14.3 5 12.5z" fill="' + (c || '#F6C3D2') + '"/><path d="M10.5 8.6h3.6"/><circle cx="16.5" cy="11.2" r=".7" fill="' + INK + '"/><path d="M5 12.5c-1.4 0-2.2-.8-2.2-1.8"/>'; },
    gear: function (c) { return '<circle cx="12" cy="12" r="3" fill="' + (c || '#BCDDB4') + '"/><path d="M12 2.8c1.2 1.8 1.2 3.4 0 4.6M12 21.2c-1.2-1.8-1.2-3.4 0-4.6M2.8 12c1.8-1.2 3.4-1.2 4.6 0M21.2 12c-1.8 1.2-3.4 1.2-4.6 0M5.5 5.5c2.1.4 3.2 1.6 3.3 3.3M18.5 18.5c-2.1-.4-3.2-1.6-3.3-3.3M18.5 5.5c-.4 2.1-1.6 3.2-3.3 3.3M5.5 18.5c.4-2.1 1.6-3.2 3.3-3.3"/>'; },
    coin: function (c) { return '<circle cx="12" cy="12" r="8" fill="' + (c || '#F6D27A') + '"/><circle cx="12" cy="12" r="5.6" stroke-width="1.2"/><path d="M13.6 9.6c-.4-.5-1-.8-1.7-.8-1 0-1.8.6-1.8 1.4 0 1.8 3.7.9 3.7 2.8 0 .8-.8 1.5-1.9 1.5-.8 0-1.5-.3-1.9-.9M12 7.6v1.2M12 15.5v1.1" stroke-width="1.3"/>'; },
    clock: function (c) { return '<circle cx="12" cy="12" r="8" fill="' + (c || CREAM) + '"/><path d="M12 7.5V12l3 2"/>'; },
    pin: function (c) { return '<path d="M12 21s-6.5-6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z" fill="' + (c || '#F2B6C8') + '"/><circle cx="12" cy="10.5" r="2.3" fill="' + CREAM + '"/>'; },
    plus: function () { return '<path d="M12 5v14M5 12h14"/>'; },
    leaf: function (c) { return '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" fill="' + (c || LEAF) + '"/><path d="M5 19c3-4 6-7 10-10"/>'; },
    bell: function (c) { return '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2H5z" fill="' + (c || '#F6D27A') + '"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'; },
    back: function () { return '<path d="M15 5l-7 7 7 7"/>'; }
  };
  function icon(name, color, size) {
    var f = ICONS[name] || ICONS.mine;
    var s = size || 24;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="' + INK + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + f(color || '#F6DCE5') + '</svg>';
  }

  // ---------------------------------------------------------------- symboles de matière (24×24)
  var SYMBOLS = {
    MA11: function (c) { return '<path d="M4 20L20 20 4 4z" fill="' + c + '"/><path d="M8 16h4.5L8 11.5z" fill="' + CREAM + '"/><path d="M4 8h2M4 12h2" stroke-width="1.2"/>'; },
    EC11: function (c) { return '<rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="' + c + '"/><path d="M6.5 16.5l3.5-4 3 2.5 4.5-6"/><path d="M15 9h2.5v2.5"/>'; },
    IR11: function (c) { return '<circle cx="12" cy="12" r="8.5" fill="' + c + '"/><path d="M3.5 12h17M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17"/>'; },
    MG11: function (c) { return '<rect x="3.5" y="8" width="17" height="12" rx="2.2" fill="' + c + '"/><path d="M9 8V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v2M3.5 13h17"/><rect x="10.5" y="11.6" width="3" height="2.8" rx=".6" fill="' + CREAM + '"/>'; },
    SK11: function (c) { return '<rect x="9" y="3" width="6" height="11" rx="3" fill="' + c + '"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>'; },
    LE11: function (c) { return '<path d="M5 4.5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" fill="' + c + '"/><path d="M5 17.5a2 2 0 0 1 2-2h11"/><path d="M9 8.5h5" stroke-width="1.2"/>'; },
    ZH: function (c) { return '<path d="M12 2.5v2.5"/><path d="M7.5 6h9l1.5 1.5v8L16.5 17h-9L6 15.5v-8z" fill="' + c + '"/><path d="M6 9.5h12M6 13h12" stroke-width="1.1"/><path d="M10 17v2.5M14 17v2.5M12 17v4"/>'; },
    IT: function (c) { return '<path d="M5 13c0-4.5 3.4-7.5 7.5-7.5S19.5 8.5 19.5 13s-3.1 6.5-7 6.5S5 17.5 5 13z" fill="' + c + '" transform="rotate(-20 12 12)"/><path d="M14.5 5.5c1-2 2.6-2.7 4.5-2.5-.3 1.8-1.8 3-4.5 2.5z" fill="' + LEAF + '"/>'; }
  };
  function symbol(id, color, size) {
    var f = SYMBOLS[id] || ICONS.mine, s = size || 22;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="' + INK + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + f(color || '#F6DCE5') + '</svg>';
  }

  // ---------------------------------------------------------------- décor de carte (coordonnées SVG)
  function tree(x, y, s) {
    s = s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" stroke="' + INK + '" stroke-width="1.4">' +
      '<path d="M0 0v16M0 7l-5-5M0 10l4.5-4.5" stroke="' + TRUNK + '" stroke-width="2"/>' +
      '<path d="M0-22c9 0 14 6 13 12-1 6-7 8-13 8s-12-2-13-8c-1-6 4-12 13-12z" fill="' + LEAF + '"/>' +
      '<path d="M0-10v10M0-6l-5-4M0-3l5-5" stroke="' + TRUNK + '" stroke-width="1.6"/></g>';
  }
  function pine(x, y, s) {
    s = s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" stroke="' + INK + '" stroke-width="1.4">' +
      '<path d="M0-26L10 2H-10z" fill="' + LEAF2 + '"/><path d="M0 2v10" stroke="' + TRUNK + '" stroke-width="2"/>' +
      '<path d="M0-18v18M0-10l-4-3M0-4l4-3" stroke="' + TRUNK + '" stroke-width="1.3"/></g>';
  }
  function flower(x, y, c) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.1">' +
      '<path d="M0 0v9" stroke="' + LEAF2 + '" stroke-width="1.6"/><path d="M0 6c-3-1-4-3-4-4 2 0 3.5 1 4 4z" fill="' + LEAF + '"/>' +
      '<circle cx="0" cy="-3.2" r="2.6" fill="' + c + '"/><circle cx="-3" cy="0" r="2.6" fill="' + c + '"/><circle cx="3" cy="0" r="2.6" fill="' + c + '"/><circle cx="0" cy="2.6" r="2.4" fill="' + c + '"/>' +
      '<circle cx="0" cy="-.2" r="1.6" fill="#F6D27A"/></g>';
  }
  function bush(x, y, w) {
    w = w || 30;
    return '<path d="M' + x + ' ' + y + 'c0-8 ' + (w * 0.2) + '-12 ' + (w * 0.35) + '-12s' + (w * 0.25) + ' 6 ' + (w * 0.3) + ' 6c4-7 ' + (w * 0.35) + '-5 ' + (w * 0.35) + ' 6z" fill="' + LEAF + '" stroke="' + INK + '" stroke-width="1.3"/>';
  }
  function tinyHouse(x, y, roof) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.2"><rect x="-6" y="-6" width="12" height="11" fill="' + CREAM + '"/><path d="M-8-5L0-14 8-5z" fill="' + roof + '"/><rect x="-1.8" y="0" width="3.6" height="5" fill="' + TRUNK + '"/></g>';
  }
  function fountain(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.4">' +
      '<ellipse cx="0" cy="8" rx="30" ry="11" fill="#E9DED0"/><ellipse cx="0" cy="5" rx="25" ry="8" fill="#A9D4EA"/>' +
      '<path d="M-4 5v-14h8V5" fill="#E9DED0"/><ellipse cx="0" cy="-9" rx="11" ry="3.5" fill="#E9DED0"/>' +
      '<path d="M0-13c-3-4 0-8 0-8s3 4 0 8z" fill="#A9D4EA"/><path d="M-11-8c-4 3-6 7-6 10M11-8c4 3 6 7 6 10" stroke="#A9D4EA" stroke-width="1.6"/></g>';
  }
  function bench(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.3"><path d="M-10-4h20v3h-20zM-10-9h20v3h-20z" fill="' + LEAF + '"/><path d="M-8-1v6M8-1v6"/></g>';
  }

  // Maisons de la carte, une par matière, façon conte de fées. (x, y) = bas-centre.
  function building(kind, x, y, c, soft) {
    var g = '<g transform="translate(' + x + ' ' + y + ')" fill="none" stroke="' + INK + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">';
    var DOOR = '#B8876F', WIN = '#BFE0F0';
    if (kind === 'cottage') { // maison champignon
      g += '<path d="M-13 0c-2-9-1-18 1-25h24c2 7 3 16 1 25z" fill="' + CREAM + '"/>' +
        '<path d="M-32-22c0-20 14-34 32-34s32 14 32 34c-12 5-52 5-64 0z" fill="' + c + '"/>' +
        '<circle cx="-16" cy="-38" r="4" fill="#FFFCF6"/><circle cx="2" cy="-47" r="5" fill="#FFFCF6"/><circle cx="18" cy="-34" r="3.6" fill="#FFFCF6"/><circle cx="-4" cy="-30" r="2.6" fill="#FFFCF6"/>' +
        '<path d="M-5 0v-9a5 5 0 0 1 10 0V0" fill="' + DOOR + '"/><circle cx="3" cy="-5" r=".8" fill="' + INK + '"/><circle cx="-1" cy="-17" r="3.4" fill="' + WIN + '"/>' +
        '<path d="M-20 0c1-4 3-6 3-9M20 0c-1-3-3-5-2-8" stroke="' + LEAF2 + '"/><circle cx="-17" cy="-10" r="2.4" fill="#F5D27E" stroke-width="1"/>';
    } else if (kind === 'stall') { // chapiteau rayé
      g += '<path d="M-24 0l3-28h42l3 28z" fill="' + CREAM + '"/><path d="M-12 0l1.5-28M0 0v-28M12 0l-1.5-28" stroke="' + c + '" stroke-width="5"/><path d="M-24 0l3-28h42l3 28z"/>' +
        '<path d="M-6 0c0-8 2-13 6-13s6 5 6 13z" fill="' + DOOR + '"/>' +
        '<path d="M-30-27L0-58 30-27c-5 5-10 5-15 0-5 5-10 5-15 0-5 5-10 5-15 0-5 5-10 5-15 0z" fill="' + c + '"/><path d="M0-58l-6 31M0-58l6 31" stroke="#FFFCF6" stroke-width="3"/><path d="M-30-27L0-58 30-27"/>' +
        '<path d="M0-58v-10"/><path d="M0-68l10 3-10 3z" fill="#F5D27E"/><circle cx="-22" cy="-24" r="1.6" fill="#F5D27E" stroke="none"/><circle cx="22" cy="-24" r="1.6" fill="#F5D27E" stroke="none"/>';
    } else if (kind === 'manor') { // tours de travers à chapeaux pointus
      g += '<path d="M-26 0l1-40h18l2 40z" fill="' + CREAM + '"/><path d="M-30-38c6-3 12-22 14-32 3 4 10 22 16 32-10 3-20 3-30 0z" fill="' + c + '"/><path d="M-16-70c2-4 6-5 8-3" fill="none"/>' +
        '<path d="M-6 0l1-28h28l1 28z" fill="' + CREAM + '"/><path d="M-10-26c8-5 14-20 18-26 4 6 10 21 18 26-12 4-24 4-36 0z" fill="' + soft + '"/><path d="M8-52v-8"/><path d="M8-60l9 3-9 3z" fill="' + c + '"/>' +
        '<circle cx="-16" cy="-26" r="4" fill="' + WIN + '"/><path d="M-20-26h8M-16-30v8" stroke-width="1"/><circle cx="14" cy="-17" r="3.4" fill="' + WIN + '"/>' +
        '<path d="M-1 0v-10a5 5 0 0 1 10 0V0" fill="' + DOOR + '"/><path d="M-26-4c3-6 2-12 5-16M-24-14l-3-2M-23-9l3-1" stroke="' + LEAF2 + '"/>';
    } else if (kind === 'shop') { // boutique bancale avec cheminée qui fume
      g += '<path d="M-22 0l-2-38c10-3 38-3 48 0l-2 38z" fill="' + CREAM + '"/><path d="M-28-36c4-16 52-16 56 0-8 3-48 3-56 0z" fill="' + c + '"/>' +
        '<path d="M12-46v-12h7v10" fill="' + soft + '"/><path d="M15-62c-4-3 2-6-1-9M19-64c3-3-1-6 2-8" fill="none" stroke-width="1.1"/>' +
        '<path d="M-24-22h48l-2 6c-4 3-7 3-9 0-3 3-7 3-9 0-3 3-7 3-9 0-3 3-7 3-9 0-3 3-6 3-8 0z" fill="' + soft + '"/>' +
        '<rect x="-17" y="-12" width="13" height="10" rx="2" fill="' + WIN + '"/><path d="M-13-6h5" stroke-width="1"/><path d="M4 0v-11a5 5 0 0 1 10 0V0" fill="' + DOOR + '"/><circle cx="0" cy="-30" r="4" fill="' + WIN + '"/>' +
        '<path d="M-19-2h11" stroke="' + LEAF2 + '" stroke-width="2.5"/><circle cx="-16" cy="-4" r="1.5" fill="#F2B6C8" stroke-width=".8"/><circle cx="-11" cy="-4" r="1.5" fill="#F5D27E" stroke-width=".8"/>';
    } else if (kind === 'gazebo') { // kiosque à musique à dôme
      g += '<path d="M-24-28c0-6 4-10 8-12 2-10 8-16 16-18 8 2 14 8 16 18 4 2 8 6 8 12z" fill="' + c + '"/><path d="M0-58v-6"/><circle cx="0" cy="-66" r="2.8" fill="#F5D27E"/>' +
        '<path d="M-26-28c4 5 9 5 13 0 4 5 9 5 13 0 4 5 9 5 13 0 4 5 9 5 13 0" fill="' + soft + '"/>' +
        '<path d="M-20-26v26M20-26v26M-7-24v24M7-24v24"/><path d="M-26 0h52" stroke-width="2"/>' +
        '<path d="M-36-40v-7l5-1v7" fill="none" stroke-width="1.1"/><circle cx="-37" cy="-39" r="2" fill="' + INK + '" stroke="none"/><circle cx="-32" cy="-40" r="2" fill="' + INK + '" stroke="none"/>' +
        '<path d="M32-44c-2-3 1-5 3-3 2-2 5 0 3 3l-3 3z" fill="#F2A3B6" stroke-width="1"/>';
    } else if (kind === 'nook') { // maison pile de livres
      g += '<rect x="-26" y="-12" width="50" height="12" rx="2" fill="' + c + '"/><path d="M-22-6h42" stroke="#FFFCF6" stroke-width="1.2"/>' +
        '<rect x="-21" y="-24" width="44" height="12" rx="2" fill="#F5D27E"/><path d="M-17-18h36" stroke="#FFFCF6" stroke-width="1.2"/>' +
        '<rect x="-24" y="-36" width="44" height="12" rx="2" fill="' + soft + '"/><path d="M-20-30h36" stroke="#FFFCF6" stroke-width="1.2"/>' +
        '<path d="M-22-36L-2-56 18-36z" fill="#A9CCE8"/><circle cx="-2" cy="-43" r="3" fill="' + WIN + '"/>' +
        '<path d="M-6 0v-8a4 4 0 0 1 8 0v8" fill="' + DOOR + '"/><circle cx="9" cy="-18" r="2.8" fill="' + WIN + '"/><path d="M14-36v12l2.5-2 2.5 2v-12" fill="#F2A3B6" stroke-width="1.1"/>';
    } else if (kind === 'teahouse') { // pagode aux toits recourbés
      g += '<rect x="-17" y="-20" width="34" height="20" fill="' + CREAM + '"/><path d="M-30-18c6 0 10-3 12-8h36c2 5 6 8 12 8-4-1-8 1-10 4H-20c-2-3-6-5-10-4z" fill="' + c + '"/>' +
        '<rect x="-11" y="-38" width="22" height="13" fill="' + CREAM + '"/><path d="M-22-36c5 0 8-3 10-7h24c2 4 5 7 10 7-3-1-6 1-8 3h-28c-2-2-5-4-8-3z" fill="' + c + '"/><path d="M0-43v-8"/><circle cx="0" cy="-53" r="2.4" fill="#F5D27E"/>' +
        '<path d="M-5 0v-12h10V0" fill="' + DOOR + '"/><circle cx="0" cy="-31" r="3" fill="' + WIN + '"/>' +
        '<path d="M-24-14v4M24-14v4" stroke-width="1"/><ellipse cx="-24" cy="-6" rx="3" ry="4" fill="#F3A08F"/><ellipse cx="24" cy="-6" rx="3" ry="4" fill="#F3A08F"/>';
    } else if (kind === 'piazza') { // maison citron
      g += '<path d="M-26-24c0-16 12-26 26-26s26 10 26 26-12 24-26 24-26-8-26-24z" fill="#F6E27A"/><path d="M-27-25l-4-1 4-2M27-25l4-1-4-2" fill="#F6E27A"/>' +
        '<path d="M0-50c0-6 3-9 6-10" fill="none"/><path d="M5-58c5-6 13-6 16-3-4 6-11 7-16 3z" fill="' + LEAF + '"/>' +
        '<path d="M-6 0v-12a6 6 0 0 1 12 0V0" fill="' + DOOR + '"/><circle cx="-12" cy="-28" r="4.4" fill="' + WIN + '"/><circle cx="11" cy="-30" r="4.4" fill="' + WIN + '"/>' +
        '<path d="M-16-30c2-2 6-2 8 0M7-32c2-2 6-2 8 0" fill="' + c + '" stroke-width="1"/><path d="M-22-8c3 0 4-3 6-3M18-6c2 0 3-2 5-2" stroke="' + LEAF2 + '"/>';
    }
    return g + '</g>';
  }
  // Petit logo : un arc-en-ciel sur un nuage.
  function brandMark() {
    return '<svg viewBox="0 0 56 44" width="52" height="41" fill="none" stroke="' + INK + '" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M8 32a20 20 0 0 1 40 0" stroke="#F2B6C8" stroke-width="5"/><path d="M14 32a14 14 0 0 1 28 0" stroke="#F5D27E" stroke-width="5"/><path d="M20 32a8 8 0 0 1 16 0" stroke="#A9D2EA" stroke-width="5"/>' +
      '<path d="M6 40c-4 0-5-6 0-7 0-5 7-6 9-2 3-3 9-1 8 4 4 0 4 5 0 5z" fill="#FFFCF6"/><path d="M33 40c-3 0-4-5 0-6 1-4 7-5 9-1 3-2 8 0 7 4 3 1 2 4-1 4z" fill="#FFFCF6"/>' +
      '<path d="M48 8l1.5-3M52 12h3M45 5V2" stroke-width="1.2"/></svg>';
  }

  // Grain de papier (à placer une fois dans une page SVG ou en fond CSS).
  var GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .42  0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

  // ---------------------------------------------------------------- petites scènes
  // Pot de fleur pour une routine : bouton fermé → fleur ouverte quand c'est fait.
  function pot(done, c) {
    var body = '<path d="M14 40h20l-2.5 12h-15z" fill="#E7B49A"/><path d="M12.5 36h23v4.5h-23z" fill="#EBC1AB"/>' +
      '<path d="M24 36V20" stroke="' + LEAF2 + '" stroke-width="2"/><path d="M24 30c-5-1-7-4-7-6 3 0 6 2 7 6zM24 27c5-1 7-4 7-6-3 0-6 2-7 6z" fill="' + LEAF + '"/>';
    if (done) {
      body += '<g transform="translate(24 14)"><circle cx="0" cy="-6" r="5" fill="' + c + '"/><circle cx="-6" cy="0" r="5" fill="' + c + '"/><circle cx="6" cy="0" r="5" fill="' + c + '"/><circle cx="-3.5" cy="6" r="5" fill="' + c + '"/><circle cx="3.5" cy="6" r="5" fill="' + c + '"/><circle cx="0" cy="1" r="3.4" fill="#F6D27A"/></g>' +
        '<path d="M6 8l1.5-3M41 9l2-2.5M43 18h3" stroke-width="1.2"/>';
    } else {
      body += '<path d="M24 20c-3.5-2-4-7 0-11 4 4 3.5 9 0 11z" fill="' + c + '"/>';
    }
    return svg(48, 54, body, 'pot');
  }
  // Maîtrise ressentie : graine → pousse → bouton → fleur.
  function plant(level, c) {
    var b = '<path d="M6 34c4-3 24-3 28 0" fill="#D8C2AE"/>';
    if (level >= 1) b += '<path d="M20 33V22" stroke="' + LEAF2 + '" stroke-width="2"/><path d="M20 26c-5-1-7-4-7-6 3 0 6 2 7 6z" fill="' + LEAF + '"/>';
    if (level >= 2) b += '<path d="M20 24c5-1 7-4 7-6-3 0-6 2-7 6z" fill="' + LEAF + '"/><path d="M20 22V15" stroke="' + LEAF2 + '" stroke-width="2"/>';
    if (level === 2) b += '<path d="M20 15c-3-2-3.5-6 0-9 3.5 3 3 7 0 9z" fill="' + c + '"/>';
    if (level >= 3) b += '<g transform="translate(20 11)"><circle cx="0" cy="-5" r="4" fill="' + c + '"/><circle cx="-5" cy="0" r="4" fill="' + c + '"/><circle cx="5" cy="0" r="4" fill="' + c + '"/><circle cx="0" cy="5" r="4" fill="' + c + '"/><circle cx="0" cy="0" r="2.6" fill="#F6D27A"/></g>';
    if (level === 0) b += '<ellipse cx="20" cy="31" rx="3" ry="2" fill="' + TRUNK + '"/>';
    return svg(40, 38, b, 'plant');
  }
  // Tirelire cochon avec pièces.
  function piggyBank(size) {
    var s = size || 150;
    return '<svg class="piggy" viewBox="0 0 160 130" width="' + s + '" height="' + Math.round(s * 130 / 160) + '" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<ellipse cx="82" cy="122" rx="52" ry="5" fill="#EBC9D2" stroke="none"/>' +
      '<path d="M36 72c0-24 21-40 48-40 20 0 34 8 41 20l12-3-2 15c2 3 3 7 3 11 0 11-7 21-17 27v18h-15v-11c-6 1-12 2-19 2s-13-1-19-3v12H53v-19c-11-7-17-17-17-29z" fill="#F6C3D2"/>' +
      '<path d="M66 40l-6-14c8 1 13 5 15 10" fill="#EFA9BE"/><path d="M70 46h22"/>' +
      '<circle cx="113" cy="66" r="2.6" fill="' + INK + '"/><ellipse cx="134" cy="78" rx="7" ry="9" fill="#EFA9BE"/><path d="M132 75v5M136 75v5" stroke-width="1.6"/>' +
      '<path d="M36 70c-9 0-14-6-12-12" /><path d="M96 92c4 3 10 3 14 0" stroke-width="1.6"/>' +
      '<g transform="translate(80 14)"><circle r="11" fill="#F6D27A"/><circle r="7.5" stroke-width="1.4"/><path d="M2 -3c-.6-.8-1.5-1.1-2.4-1.1-1.4 0-2.4.8-2.4 1.8 0 2.4 5 1.2 5 3.7 0 1.1-1.1 2-2.6 2-1.1 0-2-.4-2.6-1.2" stroke-width="1.4"/></g>' +
      '<path d="M64 12l3-5M96 10l4-3M100 24h5" stroke-width="1.5"/></svg>';
  }

  // ---------------------------------------------------------------- le jardin des routines
  // Une plante différente par routine. Pas faite : feuillage et boutons fermés ; faite : en fleur.
  var POTS = {
    terra: ['#E7B49A', '#EEC6B1'], rose: ['#EFB4C4', '#F5CCD8'], sky: ['#B5D2EA', '#CCE1F2'], cream: ['#E6D6C1', '#EFE3D3'],
    lilac: ['#CDBBE6', '#DDD0EF'], sage: ['#BCD8AE', '#CFE4C4'], honey: ['#EDCF86', '#F4DFA8']
  };
  function potShape(k) {
    var c = POTS[k] || POTS.terra;
    return '<path d="M18 47h20l-2.6 14H20.6z" fill="' + c[0] + '"/><path d="M16 42.5h24v5H16z" fill="' + c[1] + '"/>';
  }
  function lf(x, y, rot, sz, col) {
    sz = sz || 1;
    return '<path transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + sz + ')" d="M0 0c-2-5 1-10 7-11 1 6-2 10-7 11z" fill="' + (col || LEAF) + '"/>';
  }
  function stem(d, col) { return '<path d="' + d + '" stroke="' + (col || LEAF2) + '" stroke-width="1.8"/>'; }
  var BLOOM = {
    sunflower: function (x, y) {
      var p = ''; for (var i = 0; i < 10; i++) p += '<ellipse cx="' + x + '" cy="' + (y - 7) + '" rx="2.2" ry="4.2" fill="#F6CF5E" transform="rotate(' + (i * 36) + ' ' + x + ' ' + y + ')"/>';
      return p + '<circle cx="' + x + '" cy="' + y + '" r="4.2" fill="#A97E5C"/>';
    },
    tulip: function (x, y, c) { return '<path d="M' + (x - 4.5) + ' ' + (y - 6) + 'l2.2 3 2.3-4.2 2.3 4.2 2.2-3v5.2c0 3-2 4.8-4.5 4.8s-4.5-1.8-4.5-4.8z" fill="' + c + '"/>'; },
    lavender: function (x, y, c) { var p = ''; for (var i = 0; i < 5; i++) p += '<ellipse cx="' + (x + (i % 2 ? 1.6 : -1.6)) + '" cy="' + (y - i * 3.4) + '" rx="1.9" ry="2.3" fill="' + c + '" stroke-width="1"/>'; return p; },
    daisy: function (x, y) { var p = ''; for (var i = 0; i < 8; i++) p += '<ellipse cx="' + x + '" cy="' + (y - 4.4) + '" rx="1.6" ry="3" fill="#FFFDF7" stroke-width="1" transform="rotate(' + (i * 45) + ' ' + x + ' ' + y + ')"/>'; return p + '<circle cx="' + x + '" cy="' + y + '" r="2.2" fill="#F6CF5E" stroke-width="1"/>'; },
    rose: function (x, y, c) { return '<circle cx="' + x + '" cy="' + y + '" r="4.6" fill="' + c + '"/><path d="M' + (x - 1.8) + ' ' + y + 'a1.8 1.8 0 1 1 2 1.8M' + (x - 3) + ' ' + (y + 1) + 'c1 2.6 4.6 2.6 5.8-.4" stroke-width="1"/>'; },
    cactus: function (x, y, c) { var p = ''; for (var i = 0; i < 5; i++) p += '<ellipse cx="' + x + '" cy="' + (y - 2.6) + '" rx="1.5" ry="2.8" fill="' + c + '" stroke-width="1" transform="rotate(' + (i * 72) + ' ' + x + ' ' + y + ')"/>'; return p + '<circle cx="' + x + '" cy="' + y + '" r="1.2" fill="#F6CF5E" stroke="none"/>'; },
    forget: function (x, y, c) { var p = ''; for (var i = 0; i < 5; i++) p += '<circle cx="' + x + '" cy="' + (y - 2.2) + '" r="1.7" fill="' + c + '" stroke-width=".8" transform="rotate(' + (i * 72) + ' ' + x + ' ' + y + ')"/>'; return p + '<circle cx="' + x + '" cy="' + y + '" r="1" fill="#F6CF5E" stroke="none"/>'; },
    muguet: function (x, y) { return '<path d="M' + (x - 2.6) + ' ' + y + 'c0-3 1.2-4.2 2.6-4.2s2.6 1.2 2.6 4.2l-1 -.8-.8 1-.8-1-.8 1-.8-1z" fill="#FFFDF7" stroke-width="1"/>'; },
    poppy: function (x, y, c) { return '<circle cx="' + (x - 2.4) + '" cy="' + (y - 1) + '" r="3.4" fill="' + c + '"/><circle cx="' + (x + 2.4) + '" cy="' + (y - 1) + '" r="3.4" fill="' + c + '"/><circle cx="' + x + '" cy="' + (y + 1.8) + '" r="3.4" fill="' + c + '"/><circle cx="' + x + '" cy="' + y + '" r="1.5" fill="#6D4D57" stroke="none"/>'; },
    hydrangea: function (x, y, c) { var p = '<circle cx="' + x + '" cy="' + y + '" r="7" fill="' + c + '"/>'; [[-3, -3], [3, -3], [0, 0], [-3.6, 2.6], [3.6, 2.6], [0, -5.6], [0, 4.4]].forEach(function (d) { p += '<path d="M' + (x + d[0]) + ' ' + (y + d[1] - 1.3) + 'v2.6M' + (x + d[0] - 1.3) + ' ' + (y + d[1]) + 'h2.6" stroke-width=".9"/>'; }); return p; },
    lemon: function (x, y) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="3.4" ry="2.6" fill="#F6E27A" stroke-width="1.1"/>'; },
    peony: function (x, y, c) { return '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + c + '"/><path d="M' + (x - 4) + ' ' + (y + 1) + 'c1.5-4 6.5-4 8 0M' + (x - 2.4) + ' ' + (y - 1.4) + 'c1-2.4 3.8-2.4 4.8 0" stroke-width="1"/>'; },
    bell: function (x, y, c) { return '<path d="M' + (x - 3.4) + ' ' + (y + 2.6) + 'c0-4 1-7 3.4-7s3.4 3 3.4 7l-1.4-1-1 1.2-1-1.2-1 1.2-1-1.2z" fill="' + c + '" stroke-width="1"/>'; }
  };
  function bud(x, y, c) { return '<path d="M' + x + ' ' + (y + 2.5) + 'c-2.6-1.4-3-5 0-7.6 3 2.6 2.6 6.2 0 7.6z" fill="' + c + '" opacity=".75"/><path d="M' + (x - 2) + ' ' + (y + 2) + 'l2 1.4 2-1.4" stroke="' + LEAF2 + '" stroke-width="1.2"/>'; }
  var PLANTS = {
    sunflower: { name: 'Tournesol', c: '#F6CF5E', pot: 'terra', body: stem('M28 43V16') + lf(28, 34, -40, 1.1) + lf(28, 28, 140, 1.1, LEAF2) + lf(28, 22, -30, .8), at: [[28, 13]] },
    peony: { name: 'Pivoine', c: '#F4B2C6', pot: 'cream', body: stem('M28 43c0-8-6-12-8-20M28 43c0-8 6-12 8-22M28 43V28') + lf(23, 36, -60) + lf(33, 34, 150, 1, LEAF2) + lf(28, 32, -20, .8), at: [[20, 21], [36, 19], [28, 25]] },
    tulip: { name: 'Tulipes', c: '#F29FB5', pot: 'sky', body: stem('M22 43c0-8-2-14-3-22M28 43V17M34 43c0-8 2-13 3-20') + lf(25, 40, -80, 1.2) + lf(31, 40, 170, 1.2, LEAF2), at: [[19, 20], [28, 16], [37, 22]] },
    lavender: { name: 'Lavande', c: '#B9A1DE', pot: 'cream', body: stem('M22 43l-3-22M26 43V18M30 43V20M34 43l3-21') + lf(23, 40, -70, .9) + lf(33, 40, 160, .9, LEAF2), at: [[19, 21], [26, 18], [30, 20], [37, 22]] },
    lemon: { name: 'Citronnier', c: '#F6E27A', pot: 'terra', body: '<path d="M28 43V26M28 32l-4-4M28 30l4-4" stroke="' + TRUNK + '" stroke-width="2"/><circle cx="28" cy="18" r="12" fill="' + LEAF + '"/><path d="M22 14c2-2 4-3 6-3" stroke-width="1.1"/>', at: [[21, 20], [33, 15], [30, 24]] },
    daisy: { name: 'Marguerites', c: '#FFFDF7', pot: 'sage', body: stem('M21 43c0-7-1-12-2-19M28 43V18M35 43c0-7 1-12 2-18') + lf(24, 38, -70) + lf(32, 37, 160, 1, LEAF2), at: [[19, 21], [28, 16], [37, 22]] },
    hydrangea: { name: 'Hortensia', c: '#A9C9EA', pot: 'rose', body: stem('M28 43V24M28 36l-8-7M28 34l8-8') + lf(19, 31, -100, 1.3) + lf(37, 29, 170, 1.3, LEAF2), at: [[28, 18]] },
    muguet: { name: 'Muguet', c: '#FFFDF7', pot: 'lilac', body: '<path d="M22 43c-2-12 6-25 18-26" stroke="' + LEAF2 + '" stroke-width="1.8"/><path d="M30 43c-6-6-8-16-4-26 4 8 6 18 4 26z" fill="' + LEAF + '"/>', at: [[25, 26], [29, 21], [34, 18], [39, 18]] },
    rose: { name: 'Rosier', c: '#EE9FB4', pot: 'terra', body: '<path d="M16 43c0-12 6-20 12-20s12 8 12 20z" fill="' + LEAF + '"/><path d="M22 40l2-5M33 40l-2-6" stroke-width="1"/>', at: [[21, 28], [33, 26], [27, 22], [28, 33]] },
    forget: { name: 'Myosotis', c: '#9EC5EC', pot: 'honey', body: '<path d="M15 43c1-9 6-14 13-14s12 5 13 14z" fill="' + LEAF + '"/>' + stem('M22 34l-2-6M28 30v-6M34 34l2-6'), at: [[19, 27], [28, 23], [37, 27], [24, 31], [33, 31]] },
    cactus: { name: 'Cactus', c: '#F4A6BC', pot: 'honey', body: '<path d="M24 43V19a4 4 0 0 1 8 0v24z" fill="#A9CF9A"/><path d="M24 32h-4a3 3 0 0 1-3-3v-5a2 2 0 0 1 4 0v4h3M32 29h4v-6a2 2 0 0 1 4 0v6a3 3 0 0 1-3 3h-5" fill="#A9CF9A"/><path d="M28 21v18M26 25l-1-.5M30 30l1-.5M26 35l-1-.5" stroke-width=".9"/>', at: [[28, 14]] },
    poppy: { name: 'Coquelicots', c: '#F3A08F', pot: 'sage', body: stem('M21 43c0-8 0-14-2-21M28 43c0-10 1-17 0-25M35 43c0-8 1-13 3-19') + lf(24, 40, -60, .9) + lf(32, 40, 150, .9, LEAF2), at: [[19, 20], [28, 16], [38, 22]] },
    bell: { name: 'Campanules', c: '#B6A6E8', pot: 'sky', body: '<path d="M18 43c2-10 5-18 10-24M28 43c0-10 3-18 10-23" stroke="' + LEAF2 + '" stroke-width="1.8"/>' + lf(22, 38, -70) + lf(32, 38, 160, 1, LEAF2), at: [[22, 31], [26, 23], [33, 27], [38, 20]] }
  };
  function gardenPlant(kind, done) {
    var P = PLANTS[kind] || PLANTS.daisy, f = BLOOM[kind] || BLOOM.daisy, b = P.body;
    P.at.forEach(function (q) { b += done ? f(q[0], q[1], P.c) : bud(q[0], q[1], P.c); });
    if (done) b += '<path d="M6 10l1.6-2.6M48 9l2.4-2M50 20h3" stroke-width="1.2"/>';
    return svg(56, 64, b + potShape(P.pot), 'gplant');
  }

  // ---------------------------------------------------------------- la carte (décor)
  function rng(seed) { var x = seed; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
  function tuft(x, y, s) {
    s = s || 1;
    return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M-5 0c1-3 1.5-5 1-7M-1 0c0-3 .5-6 2-8M3 0c.5-2 2-4 4-5" stroke="#86B97F" stroke-width="1.2" fill="none"/>';
  }
  function roundTree(x, y, s, col) {
    s = s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" stroke="' + INK + '" stroke-width="1.2">' +
      '<path d="M0 0v-8" stroke="' + TRUNK + '" stroke-width="2.2"/>' +
      '<path d="M0-30c9 0 13 6 13 12 0 7-6 10-13 10s-13-3-13-10c0-6 4-12 13-12z" fill="' + (col || LEAF) + '"/>' +
      '<path d="M0-8v-14M0-14l-5-5M0-17l4-4" stroke="' + TRUNK + '" stroke-width="1.6"/></g>';
  }
  function darkPine(x, y, s) {
    s = s || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" stroke="' + INK + '" stroke-width="1.2">' +
      '<path d="M0-34c5 8 9 18 10 30H-10C-9-16-5-26 0-34z" fill="#6FA585"/><path d="M0 0v-26M0-10l-5-4M0-16l4-4M0-22l-3-3" stroke="#4E6F5E" stroke-width="1.3"/></g>';
  }
  function bushRow(x, y, n, s) {
    var g = '<g stroke="' + INK + '" stroke-width="1.2">';
    for (var i = 0; i < n; i++) {
      var cx = x + i * 17 * (s || 1), r = (7 + (i % 3) * 2) * (s || 1);
      g += '<path d="M' + (cx - r) + ' ' + y + 'a' + r + ' ' + r + ' 0 0 1 ' + (2 * r) + ' 0z" fill="' + (i % 2 ? LEAF : '#8CC08A') + '"/>';
    }
    return g + '</g>';
  }
  function sunFace(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.2">' +
      '<path d="M0-17v-4M0 17v4M-17 0h-4M17 0h4M-12-12l-3-3M12 12l3 3M-12 12l-3 3M12-12l3-3" stroke="#E9B44C" stroke-width="1.6"/>' +
      '<circle r="11" fill="#F8D774"/><circle cx="-3.6" cy="-1.5" r=".9" fill="' + INK + '"/><circle cx="3.6" cy="-1.5" r=".9" fill="' + INK + '"/>' +
      '<path d="M-3 3c1.6 1.6 4.4 1.6 6 0" stroke-width="1.1"/><circle cx="-6.5" cy="2.5" r="1.6" fill="#F3A9B9" stroke="none"/><circle cx="6.5" cy="2.5" r="1.6" fill="#F3A9B9" stroke="none"/></g>';
  }
  function deer(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.1">' +
      '<path d="M-14 0c0-6 6-9 14-9 6 0 9 3 9 6v3z" fill="#D9A47E"/><path d="M5-8c0-5 2-8 6-8 3 0 4 3 3 6-1 2-4 3-6 3" fill="#D9A47E"/>' +
      '<path d="M10-16l-2-5M10-21l-3-1M13-16l2-5M15-21l2-1" stroke-width="1"/><circle cx="12.5" cy="-12" r=".8" fill="' + INK + '"/>' +
      '<circle cx="-6" cy="-5" r="1" fill="#F7E6D6" stroke="none"/><circle cx="-1" cy="-6" r="1" fill="#F7E6D6" stroke="none"/><path d="M-16 0h28" stroke="#9CC896" stroke-width="2"/></g>';
  }
  function cat(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.1">' +
      '<path d="M-7 0c-1-6 1-11 7-11s8 5 7 11z" fill="#C9C1C6"/><path d="M7-2c5 0 7-3 6-6" fill="none"/>' +
      '<path d="M-6-11c0-6 2-8 6-8s6 2 6 8z" fill="#C9C1C6"/><path d="M-5-17l1-5 3 3M5-17l-1-5-3 3" fill="#C9C1C6"/>' +
      '<circle cx="-2.2" cy="-14" r=".8" fill="' + INK + '"/><circle cx="2.2" cy="-14" r=".8" fill="' + INK + '"/><path d="M-1-12l1 .8 1-.8" stroke-width=".9"/>' +
      '<path d="M-14-6c-1-1.6.6-3 2-2 1.4-1 3 .4 2 2l-2 2z" fill="#F2A3B6" stroke-width=".8"/><path d="M12-14c-1-1.6.6-3 2-2 1.4-1 3 .4 2 2l-2 2z" fill="#F2A3B6" stroke-width=".8"/></g>';
  }
  function bunny(x, y, c) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1">' +
      '<path d="M-3-9c-2-6-1-10 1-10s2 5 1 9M1-9c0-6 2-10 3.6-9.6S6-14 4-9" fill="' + (c || '#F7E9EC') + '"/>' +
      '<ellipse cx="0" cy="-5.5" rx="5" ry="4.5" fill="' + (c || '#F7E9EC') + '"/><path d="M-5 0c0-4 2-6 5-6s5 2 5 6z" fill="' + (c || '#F7E9EC') + '"/>' +
      '<circle cx="-1.8" cy="-6" r=".7" fill="' + INK + '"/><circle cx="1.8" cy="-6" r=".7" fill="' + INK + '"/></g>';
  }
  function chick(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1">' +
      '<circle cx="0" cy="-6" r="5.5" fill="#F8D774"/><path d="M5-6l3 1-3 1" fill="#F2A35E"/><circle cx="1.8" cy="-7.4" r=".7" fill="' + INK + '"/><path d="M-2 0v2M1 0v2"/></g>';
  }
  function waterfall(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.2">' +
      '<path d="M-12-46c4-6 20-6 24 0v44h-24z" fill="#A9D2EA"/><path d="M-6-40v34M0-44v40M6-40v34" stroke="#E2F0F8" stroke-width="1.6"/></g>';
  }
  function lake(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.2">' +
      '<path d="M-40 0c0-12 14-18 40-18s40 6 40 18-16 16-40 16-40-4-40-16z" fill="#A9D2EA"/>' +
      '<path d="M-24 -4c3-2 5 2 8 0s5 2 8 0M6 4c3-2 5 2 8 0s5 2 8 0" stroke="#E2F0F8" stroke-width="1.5"/></g>';
  }
  function bridge(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.2"><path d="M-14 3c5-7 23-7 28 0" fill="none" stroke-width="5" stroke="#E7CBB4"/><path d="M-14 3c5-7 23-7 28 0M-14-3c5-7 23-7 28 0" fill="none"/><path d="M-10-2v4M0-5v4M10-2v4" stroke-width="1"/></g>';
  }
  function openBook(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" stroke="' + INK + '" stroke-width="1.1"><path d="M-13 0c4-2 9-2 13 1 4-3 9-3 13-1v-14c-4-2-9-2-13 1-4-3-9-3-13-1z" fill="#FFFDF7"/><path d="M0 1v-14M-10-9h7M-10-6h6M3-9h7M3-6h6" stroke-width=".9"/><path d="M7 1v5l2-1.5 2 1.5V0" fill="#9EC5EC" stroke-width=".9"/></g>';
  }
  // Fond de la carte : l'île, le gazon, la rivière, les routes roses, les arbres et les animaux.
  // `roads` = liste de chemins SVG (routes roses) fournie par la vue, adaptée aux matières.
  function mapScene(roads) {
    var R = rng(7), g = '';
    var LAND = 'M44 58C64 28 140 26 200 32c50 4 80-4 102 0l16 38 18-40c34-8 58 8 62 40 6 50-6 98 0 148 6 60-2 120-6 158-4 30-42 34-92 32-70-2-140 4-200 0-50-2-74-16-74-50-2-60 6-110-4-160-8-50 2-110 18-140z';
    g += '<path d="' + LAND + '" fill="#FAF3E7" stroke="#EBCBD5" stroke-width="5"/>';
    // gazon : grandes plaques vert tendre + touffes
    g += '<g fill="#DDEDCB" stroke="none" opacity=".95"><path d="M30 300c40-20 90-10 120 10s20 70-30 80-100 10-100-40z"/><path d="M260 280c50-12 120 0 130 40s-20 70-80 70-90-30-80-60 10-44 30-50z"/>' +
      '<path d="M40 150c30-20 70-10 80 20s-20 50-50 50-40-50-30-70z"/><path d="M250 140c40-20 70 0 70 30s-30 40-60 30-30-50-10-60z"/><path d="M120 40c30-6 60 0 60 16s-40 20-60 14-20-26 0-30z"/></g>';
    g += '<path d="M28 380c40 14 110 8 130 4M260 396c50-2 110-6 132-14" stroke="#DDEDCB" stroke-width="18" fill="none" stroke-linecap="round"/>';
    for (var i = 0; i < 72; i++) {
      var tx = 40 + R() * 350, ty = 60 + R() * 340;
      g += tuft(Math.round(tx), Math.round(ty), 0.8 + R() * 0.5);
    }
    // eau
    g += waterfall(356, 76) + lake(356, 100);
    g += '<path d="M330 114c-14 22-24 44-20 74s-8 52-4 80 22 50 26 74" stroke="#A9D2EA" stroke-width="7" fill="none" stroke-linecap="round"/>';
    g += '<path d="M330 114c-14 22-24 44-20 74s-8 52-4 80 22 50 26 74" stroke="' + INK + '" stroke-width="1" fill="none" stroke-dasharray="2 9" opacity=".5"/>';
    // routes roses
    (roads || []).forEach(function (d) { g += '<path d="' + d + '" stroke="#EFB3C6" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; });
    (roads || []).forEach(function (d) { g += '<path d="' + d + '" stroke="#F7D3DE" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="1 10"/>'; });
    g += bridge(310, 212);
    // arbres
    [[150, 98, 0.9], [36, 158, 0.85], [150, 172, 0.8], [276, 160, 0.85], [44, 262, 0.8], [146, 300, 0.85], [286, 296, 0.8], [400 - 18, 262, 0.75], [140, 404, 0.75], [292, 404, 0.75], [270, 64, 0.75], [30, 222, 0.7]].forEach(function (t, i) {
      g += i % 3 === 1 ? darkPine(t[0], t[1], t[2]) : roundTree(t[0], t[1], t[2]);
    });
    [[178, 150, 0.6], [252, 300, 0.6], [384, 160, 0.7], [118, 252, 0.6], [56, 380, 0.65]].forEach(function (t) { g += darkPine(t[0], t[1], t[2]); });
    // fleurs
    [[126, 128, '#F2B6C8'], [262, 120, '#F5D27E'], [120, 190, '#C4ADE0'], [178, 262, '#F2B6C8'], [266, 262, '#A9D2EA'], [116, 370, '#F5D27E'], [316, 372, '#F2B6C8'], [176, 330, '#F3A08F'], [380, 300, '#C4ADE0'], [64, 196, '#F3A08F']].forEach(function (f) { g += flower(f[0], f[1], f[2]); });
    // animaux et petits trésors
    g += sunFace(148, 48) + deer(282, 96) + cat(172, 216) + bunny(300, 396) + bunny(318, 398, '#F3DDE3') + chick(334, 400) + openBook(40, 112);
    // haies au bord
    g += bushRow(34, 416, 7, 1) + bushRow(266, 416, 8, 1);
    return g;
  }

  // ---------------------------------------------------------------- le village d'une matière
  var FLOWER_COLS = ['#F2B6C8', '#F5D27E', '#C4ADE0', '#A9D2EA', '#F3A08F', '#FFFDF7', '#EE9FB4', '#B9A1DE'];
  function cottage(x, y, s, roof, wall, kind) {
    var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" stroke="' + INK + '" stroke-width="1.4">';
    if (kind === 1) { // tour ronde
      g += '<rect x="-10" y="-34" width="20" height="34" fill="' + wall + '"/><path d="M-13-32L0-52 13-32z" fill="' + roof + '"/><rect x="-3.5" y="-26" width="7" height="8" rx="3.5" fill="#BFE0F0"/><path d="M-4 0v-9a4 4 0 0 1 8 0V0" fill="' + TRUNK + '"/>';
    } else if (kind === 2) { // maison longue
      g += '<rect x="-24" y="-20" width="48" height="20" fill="' + wall + '"/><path d="M-28-18l6-14h44l6 14z" fill="' + roof + '"/><rect x="-17" y="-14" width="8" height="7" fill="#BFE0F0"/><rect x="9" y="-14" width="8" height="7" fill="#BFE0F0"/><rect x="-4" y="-12" width="8" height="12" fill="' + TRUNK + '"/><rect x="12" y="-36" width="5" height="8" fill="' + wall + '"/>';
    } else { // chaumière
      g += '<rect x="-15" y="-22" width="30" height="22" fill="' + wall + '"/><path d="M-19-20L0-40 19-20z" fill="' + roof + '"/><circle cx="0" cy="-27" r="3" fill="#BFE0F0"/><rect x="-4" y="-12" width="8" height="12" rx="4" fill="' + TRUNK + '"/><rect x="-12" y="-15" width="6" height="6" fill="#BFE0F0"/>';
    }
    return g + '</g>';
  }
  function flowerBed(x, y, w, cols) {
    var g = '<ellipse cx="' + x + '" cy="' + y + '" rx="' + w + '" ry="' + (w * 0.28) + '" fill="#EAD7C2" stroke="' + INK + '" stroke-width="1.2"/>';
    var n = Math.max(3, Math.round(w / 7));
    for (var i = 0; i < n; i++) {
      var fx = x - w + 7 + i * ((2 * w - 14) / (n - 1 || 1)), fy = y - 3 + (i % 2) * 4;
      g += flower(Math.round(fx), Math.round(fy - 6), cols[i % cols.length]);
    }
    return g;
  }
  function fence(x, y, n) {
    var g = '<g stroke="' + INK + '" stroke-width="1.1"><path d="M' + x + ' ' + (y - 6) + 'h' + (n * 8) + 'M' + x + ' ' + (y - 2) + 'h' + (n * 8) + '"/>';
    for (var i = 0; i <= n; i++) g += '<path d="M' + (x + i * 8) + ' ' + y + 'v-11l1.5-2 1.5 2" fill="#FFFCF6"/>';
    return g + '</g>';
  }
  // Scène 400×170 : collines, chemin, maisonnettes dans la couleur de la matière et jardins fleuris.
  function village(id, c, soft) {
    var seed = 0; for (var i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) % 9973;
    var R = rng(seed + 11), cols = FLOWER_COLS.slice(seed % 4).concat(FLOWER_COLS.slice(0, seed % 4));
    var roofs = [c, '#F4C095', '#C4ADE0', '#A9CCE8', '#F2B8C9', '#B6D39A'];
    var g = '<svg class="village" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    g += '<rect width="400" height="170" fill="' + soft + '"/>';
    g += '<g stroke="' + INK + '" stroke-width="1.2"><path d="M300 30c6-8 18-8 22 0 8-2 14 4 12 10h-38c-4-4-2-10 4-10z" fill="#FFFCF6"/><path d="M40 44c5-6 14-6 17 0 6-1 10 3 9 7H38c-3-3-2-7 2-7z" fill="#FFFCF6"/></g>';
    g += '<path d="M0 88c50-24 110-30 170-14s120 4 160-14 70-6 70-6v116H0z" fill="#D7E9C6" stroke="' + INK + '" stroke-width="1.2"/>';
    g += '<path d="M0 118c60-16 140-20 210-6s140 10 190-4v62H0z" fill="#E6F1DA" stroke="' + INK + '" stroke-width="1.2"/>';
    // chemin
    g += '<path d="M196 170c-8-18 14-26 4-42s-26-18-12-36" stroke="#EFB3C6" stroke-width="12" fill="none"/><path d="M196 170c-8-18 14-26 4-42s-26-18-12-36" stroke="#F7D3DE" stroke-width="3" stroke-dasharray="1 9" fill="none"/>';
    // maisons du village, au loin puis devant
    g += roundTree(26, 98, 0.9) + darkPine(372, 96, 0.9) + roundTree(394, 104, 0.7, '#8CC08A');
    var houses = [[96, 86, 0.95, 0], [140, 80, 0.8, 1], [248, 82, 0.9, 2], [312, 84, 0.85, 0], [174, 92, 0.7, 2]];
    houses.forEach(function (h, k) { g += cottage(h[0], h[1], h[2], roofs[(k + seed) % roofs.length === 0 ? 0 : (k === 0 || k === 3 ? 0 : (k + seed) % roofs.length)], '#FFFCF6', (h[3] + seed) % 3); });
    g += darkPine(212, 86, 0.6) + roundTree(286, 90, 0.6);
    // jardins
    g += flowerBed(64, 140, 40, cols) + flowerBed(150, 150, 30, cols.slice(2).concat(cols.slice(0, 2))) + flowerBed(262, 146, 34, cols.slice(4).concat(cols.slice(0, 4))) + flowerBed(350, 136, 36, cols.slice(1).concat(cols.slice(0, 1)));
    g += fence(100, 122, 6) + fence(292, 120, 5);
    for (var t = 0; t < 14; t++) g += tuft(Math.round(10 + R() * 380), Math.round(126 + R() * 40), 0.8);
    g += bunny(226, 160) + '<g transform="translate(120 112)">' + bush(0, 0, 26) + '</g>' + '<g transform="translate(320 110)">' + bush(0, 0, 22) + '</g>';
    return g + '</svg>';
  }
  // Bordure de gazon fleuri (fond CSS répété).
  var GRASS = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='18' viewBox='0 0 80 18'><path d='M0 18c4-6 6-9 6-14M5 18c2-4 5-7 9-9M14 18c0-5 1-8 4-12M24 18c2-6 4-8 8-10M34 18c0-4-1-8-3-11M42 18c2-5 3-9 2-14M50 18c3-4 6-6 10-7M60 18c0-5 2-9 5-12M70 18c1-4 3-7 7-9' stroke='%2386B97F' stroke-width='1.4' fill='none' stroke-linecap='round'/><circle cx='18' cy='6' r='2.2' fill='%23F2B6C8' stroke='%238A6A5C' stroke-width='.7'/><circle cx='44' cy='4' r='2.2' fill='%23F5D27E' stroke='%238A6A5C' stroke-width='.7'/><circle cx='65' cy='6' r='2.2' fill='%23C4ADE0' stroke='%238A6A5C' stroke-width='.7'/></svg>\")";

  root.SchoolArt = {
    INK: INK, icon: icon, symbol: symbol, tree: tree, pine: pine, flower: flower, bush: bush, tinyHouse: tinyHouse,
    fountain: fountain, bench: bench, building: building, pot: pot, plant: plant, piggyBank: piggyBank, GRAIN: GRAIN,
    gardenPlant: gardenPlant, brandMark: brandMark, PLANTS: PLANTS, mapScene: mapScene, village: village, GRASS: GRASS
  };
})(typeof window !== 'undefined' ? window : globalThis);
