$(function () {
  "use strict";

  const DEBUG = false, DEBUG_FINAL = false;
  const LEVEL_DATA = [
    {
      name: 1,
      cards: ["H", "H", "O", "O", "F", "F", "X", "X"],
      layout: [4, 4],
      lives: 3,
      bg: "E",
    },
    {
      name: 2,
      cards: [
        "A", "A", "D", "D", "T", "T", "Y", "Y",
        "S", "S", "X", "X", "X", "X", "X",
      ],
      layout: [5, 5, 5],
      lives: 7,
      bg: "M",
    },
    {
      name: 3,
      cards: [
        "B", "B", "I", "I", "L", "L", "P", "P", "R", "R",
        "C", "C", "W", "W", "X", "X", "X", "X", "X", "X", "X",
      ],
      layout: [7, 7, 7],
      lives: 10,
      bg: "Z",
    },
  ];
  const BAG_ITEMS = ["A", "B", "D", "H", "I", "L", "O", "P", "R", "T", "Y"];
  const FINAL_ANSWER = [
    ["H", "A", "P", "P", "Y"],
    ["B", "I", "R", "T", "H", "D", "A", "Y"],
    ["T", "O", " ", "O", "I", "L"],
  ];
  const EXTRA_ANSWER = ["B", "L", "R", "D"];
  const CARD_WIDTH = 70, CARD_HEIGHT = 90;
  const SCREEN_WIDTH = 800, SCREEN_HEIGHT = 500;
  const TIMEOUT = 1000,
    INFO_FADE = 300,
    ITEM_FADE = 300,
    SLOT_FADE = 2000,
    EXTRA_TIMEOUT = DEBUG_FINAL ? 1000 : 3000;
  let currentLevel = 0;
  if (DEBUG_FINAL) currentLevel = 3;

  // ################################
  // Part 1: Matching game

  let pairsLeft = 0,
    livesLeft = 0,
    open1 = null,
    open2 = null;

  function toggleCard(card, flag) {
    let name = card.data('name');
    if (flag === false) {
      name = LEVEL_DATA[currentLevel].bg;
    } else if (flag !== true) {
      name = flag;
    }
    let offset = (65 - name.charCodeAt(0)) * CARD_WIDTH;
    card.css('background-position-x', '' + offset + 'px');
  }

  $('#pane-info .button').click(function () {
    if (currentLevel < LEVEL_DATA.length) {
      genCards();
      livesLeft = LEVEL_DATA[currentLevel].lives;
      updateHud();
    } else {
      genFinal();
    }
    $('#pane-info').fadeOut(INFO_FADE);
  });

  function genCards() {
    let cards = LEVEL_DATA[currentLevel].cards;
    // Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      if (j != i) {
        let tmp = cards[i];
        cards[i] = cards[j];
        cards[j] = tmp;
      }
    }
    // Put on board
    pairsLeft = 0;
    $('#pane-area').empty();
    let rowId = 0, rowLimit = 0, rowDiv;
    for (let k = 0; k < cards.length; k++) {
      if (k == rowLimit) {
        rowDiv = $('<div class=card-row>').appendTo('#pane-area');
        rowLimit += LEVEL_DATA[currentLevel].layout[rowId++];
      }
      let cardFlipper = $('<div class=card-flipper>').appendTo(rowDiv)
        .data({index: k, name: cards[k]});
      let cardFront = $('<div class="card card-front">').appendTo(cardFlipper);
      let cardBack = $('<div class="card card-back">').appendTo(cardFlipper);
      toggleCard(cardBack, false);
      toggleCard(cardFront, cards[k]);
      // Update the count
      if (cards[k] != 'X') {
        pairsLeft += 0.5;
      } 
      // Remove from bag
      incrBagItem(cards[k], -1);
    }
    open1 = open2 = null;
  };

  function updateHud() {
    $('#hud-pairs').text(pairsLeft);
    $('#hud-lives').text(livesLeft);
  }

  $('#pane-area').on("click", ".card-flipper", function (e) {
    if (livesLeft <= 0 || pairsLeft <= 0) return;
    let thisCard = $(this);
    console.log(thisCard.data('name'));
    // Don't open removed or opened card
    if (
      thisCard.hasClass('removed') ||
      (open1 !== null && open1.data('index') == thisCard.data('index')) ||
      (open2 !== null && open2.data('index') == thisCard.data('index'))
    ) {
      return;
    }
    // Flip back the old cards if needed
    if (open1 !== null && open2 !== null) {
      if (!open1.hasClass('removed')) open1.removeClass('flip');
      if (!open2.hasClass('removed')) open2.removeClass('flip');
      open1 = null;
      open2 = null;
    }
    thisCard.addClass('flip');
    // If it's X, reduce life and maybe show the game over screen
    if (thisCard.data('name') == 'X') {
      livesLeft--;
      updateHud();
      flashHud('#hud-lives');
      flashBackground();
      if (livesLeft === 0) {
        showLose();
        return;
      }
    }
    // If it's the 2nd card, check for match
    if (open1 === null) {
      open1 = thisCard;
    } else {
      open2 = thisCard;
      validatePair();
    }
  });

  function validatePair() {
    if (open1.data('name') == open2.data('name')) {
      open1.addClass('removed');
      open2.addClass('removed');
      if (open1.data('name') != 'X') {
        pairsLeft -= 1;
        flashHud('#hud-pairs');
        incrBagItem(open1.data('name'), +2);
      }
      updateHud();
      if (pairsLeft === 0) {
        showWin();
        return true;
      }
    }
  }

  function validatePairAfter() {
    if (open1.data('name') == open2.data('name')) {
    } else {
      toggleCard(open1, false);
      toggleCard(open2, false);
    }
    open1 = null;
    open2 = null;
  }

  function showWin() {
    confetti(normalConfetti);
    setTimeout(function () {
      $('.info').hide();
      $('#info-win').show();
      $('#pane-info').fadeIn(INFO_FADE);
      currentLevel++;
    }, TIMEOUT);
  }

  function showLose() {
    confetti(poopConfetti);
    setTimeout(function () {
      $('.info').hide();
      $('#info-lose').show();
      $('#pane-info').fadeIn(INFO_FADE);
    }, TIMEOUT);
  }

  // ################################
  // Part 2: Inventory

  const bgItems = {
    'C': 'item-cake',
    'F': 'item-flag',
    'S': 'item-balloons',
    'W': 'item-present',
  };
  let bagGroups = {}, bagAmounts = {};
  let slotReady = false, slotDivs = [], currentSlotMark = 0;

  function initBag() {
    BAG_ITEMS.forEach(function (name) {
      let bagGroup = $('<div class=bag-group>')
        .appendTo('#pane-bag').data('name', name)
      let card1 = $('<div class="card bag-card-1">')
        .data('name', name).appendTo(bagGroup);
      toggleCard(card1, true);
      let card2 = $('<div class="card bag-card-2">')
        .data('name', name).appendTo(bagGroup);
      toggleCard(card2, true);
      bagGroups[name] = bagGroup;
      bagAmounts[name] = 0;
      if (DEBUG_FINAL) incrBagItem(name, +2);
    });
  }

  function incrBagItem(name, incr) {
    if (bgItems[name] !== undefined) {
      let item = $('#' + bgItems[name]);
      if (incr > 0) {
        item.fadeIn(ITEM_FADE);
      } else {
        item.hide();
      }
      return;
    }
    if (bagGroups[name] === undefined) return; 
    bagAmounts[name] = Math.min(2, Math.max(0, bagAmounts[name] + incr));
    bagGroups[name].find('.bag-card-1').toggle(bagAmounts[name] >= 1);
    bagGroups[name].find('.bag-card-2').toggle(bagAmounts[name] >= 2);
  };

  function genFinal() {
    $('#pane-hud, #pane-area').empty();
    FINAL_ANSWER.forEach(function (row) {
      let rowDiv = $('<div class=card-row>').appendTo('#pane-final');
      row.forEach(function (name) {
        let slotDiv = $('<div class=card-slot>')
          .appendTo(rowDiv).data({name: name});
        if (name == ' ') {
          slotDiv.addClass('empty');
        } else {
          toggleCard(slotDiv, 'J');
          slotDivs.push(slotDiv);
        }
      });
    });
    toggleCard(slotDivs[0], 'K');
    slotReady = false;
    $('#pane-final').fadeIn(SLOT_FADE, function () {slotReady = true;});
    $('#pane-bag').addClass('final');
  }

  function genExtra() {
    slotDivs = [];
    currentSlotMark = 0;
    let rowDiv = $('<div class=card-row>').appendTo('#pane-extra');
    rowDiv.append($('<span>ขอให้ไม่</span>'));
    EXTRA_ANSWER.forEach(function (name) {
      let slotDiv = $('<div class=card-slot>')
        .appendTo(rowDiv).data({name: name});
      toggleCard(slotDiv, 'J');
      slotDivs.push(slotDiv);
    });
    toggleCard(slotDivs[0], 'K');
    slotReady = false;
    $('#item-present').css('z-index', 100);
    $('#pane-extra').fadeIn(SLOT_FADE, function () {slotReady = true;});
  }

  $('#pane-bag').on('click', '.card', function () {
    if (currentLevel < LEVEL_DATA.length ||
        currentSlotMark >= slotDivs.length ||
        !slotReady) return;
    let thisCard = $(this), name = thisCard.data('name');
    if (name == slotDivs[currentSlotMark].data('name')) {
      incrBagItem(name, -1);
      toggleCard(slotDivs[currentSlotMark], true);
      currentSlotMark++;
      if (currentSlotMark !== slotDivs.length) {
        toggleCard(slotDivs[currentSlotMark], 'K');
      } else {
        if (currentLevel == LEVEL_DATA.length) {
          confetti(normalConfetti);
          setTimeout(function () {
            currentLevel++;
            genExtra();
          }, EXTRA_TIMEOUT);
        } else {
          $('#item-bird').fadeIn(ITEM_FADE);
          let loop = function () {
            confetti(birdConfetti);
            setTimeout(loop, CONFETTI_TIMEOUT * 1.2);
          };
          loop();
        }
      }
    }
  });

  // ################################
  // Special effects

  const FLASH_TIMEOUT = 400;
  const FLASH_COLOR = {
    '#hud-pairs': {'fg': '#0B0', 'bg': '#BFB'},
    '#hud-lives': {'fg': '#B00', 'bg': '#F88'},
  }

  function flashHud(hudName) {
    let div = $(hudName);
    if (div.data('flash')) clearTimeout(+div.data('flash'));
    let style = {
      'color': FLASH_COLOR[hudName].fg,
      'background-color': FLASH_COLOR[hudName].bg,
      'box-shadow': '0 0 15px 15px ' + FLASH_COLOR[hudName].bg,
    };
    div.css(style);
    div.data('flash', setTimeout(function () {
      div.css({
        'color': '',
        'background-color': '',
        'box-shadow': '',
      });
    }, FLASH_TIMEOUT));
  };

  function flashBackground() {
    let div = $('#pane-flash');
    if (div.data('flash')) clearTimeout(+div.data('flash'));
    div.show().data('flash', setTimeout(function () {
      div.hide();
    }, FLASH_TIMEOUT));
  }

  // Stole the idea from Chuck Grimmett's post here:
  // http://www.cagrimmett.com/til/2018/01/05/css-confetti.html

  const NUM_CONFETTI = 50,
    CONFETTI_TIMEOUT = 2000;

  function randRange(a, b) {
    return (Math.random() * (b - a)) + a;
  }

  function confetti(objFn) {
    let confettis = [], afters = [];
    for (let i = 0; i < NUM_CONFETTI; i++) {
      let leftBefore = randRange(25, SCREEN_WIDTH - 50);
      let leftAfter = leftBefore + randRange(-200, 200);
      leftAfter = Math.max(25, Math.min(SCREEN_WIDTH - 50, leftAfter));
      let topAfter = randRange(0.5, 1.0) * SCREEN_HEIGHT;
      let rotateBefore = Math.random();
      let rotateAfter = Math.random();
      let confetti = objFn().appendTo('#game');
      confetti.css({
        'top': '-20px',
        'left': leftBefore + 'px',
        'opacity': 1.0,
        'transform': 'rotate(' + rotateBefore + 'turn)',
        'transition': 'top 2s, left 2s, opacity 2s, transform 2s',
        'display': 'none',
      });
      confettis.push(confetti);
      afters.push({
        'top': topAfter + 'px',
        'left': leftAfter + 'px',
        'opacity': 0.2,
        'transform': 'rotate(' + rotateAfter + 'turn)',
      });
    }
    setTimeout(function () {
      for (let i = 0; i < NUM_CONFETTI; i++) {
        confettis[i].show().css(afters[i]);
      }
    }, 10);
    setTimeout(function () {
      $('.confetti').remove();
    }, CONFETTI_TIMEOUT);
  }

  const CONFETTI_COLORS = ['red', 'green', 'yellow', 'blue'];

  function normalConfetti() {
    let width = Math.random() * 8 + 1;
    let height = width * 1.6;
    let bg = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
    return $('<div class=confetti>').css({
      'width': width + 'px',
      'height': height + 'px',
      'background-color': bg,
    });
  }

  function poopConfetti() {
    let size = Math.random() * 60 + 10;
    return $('<div class="confetti confetti-poop">').css({
      'width': size + 'px',
      'height': size + 'px',
      'background-size': size + 'px',
    });
  }

  function birdConfetti() {
    let size = Math.random() * 60 + 10;
    return $('<div class="confetti confetti-bird">').css({
      'width': size + 'px',
      'height': size + 'px',
      'background-size': size + 'px',
    });
  }

  // ################################
  // READY!!

  function resizeScreen() {
    let ratio = Math.min(
      1.0,
      window.innerWidth / SCREEN_WIDTH,
      (window.innerHeight - 25) / SCREEN_HEIGHT,
    );
    $('#game-wrapper').css({
      'width': (SCREEN_WIDTH * ratio) + 'px',
      'height': (SCREEN_HEIGHT * ratio) + 'px',
    });
    $('#game').css('transform', 'scale(' + ratio + ')');
  }

  resizeScreen();
  $(window).resize(resizeScreen);

  const imageList = [
    "img/cards.png",
    "img/bg.png",
    "img/balloons.png",
    "img/flags.png",
    "img/cake.png",
    "img/present.png",
    "img/poop.png",
    "img/bird.png",
  ];
  let numResourcesLeft = imageList.length;
  $('#pane-loading').text('Loading resources (' + numResourcesLeft + ' left)');

  function decrementPreload () {
    numResourcesLeft--;
    if (numResourcesLeft == 0) {
      $('#pane-loading')
        .empty()
        .append($('<div class=button>').text('เริ่มเล่น!').click(function () {
          $('#scene-main').show();
          $('#pane-info, #info-inst').show();
          $('#scene-preload').hide();
          initBag();
        }));
    } else {
      $('#pane-loading').text('Loading resources (' + numResourcesLeft + ' left)');
    }
  }

  let images = [];
  imageList.forEach(function (x) {
    let img = new Image();
    img.onload = decrementPreload;
    img.src = x;
    images.push(img);
  });

});
