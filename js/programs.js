(() => {
  const root = document.querySelector("#programs.ca-programs");
  const wrap = root?.querySelector("[data-curriculum-accordion]");
  if (!root || !wrap) return;

  const levels = [
    {name:"Beginner",tag:"LEVEL 01 · FOUNDATION",desc:"Build a confident foundation: understand the board, learn how every piece moves, and discover the patterns that lead to checkmate.",focus:["Piece movements","Checks and checkmate","First tactics"],modules:[
      ["The board and the pieces","Introduction to the game|Movement of pieces: rook, bishop, queen|Movement of pieces: knight, king, pawn|Naming squares and setting the board|Test 1|Attack using rook and bishop|Attack using queen and king|Attack using knight and pawn"],
      ["Check and defense","Creating a check|Test 2|Defense by moving the piece away|Defense by supporting|Defense by interposing|Defense by capturing|Test 3|Castling"],
      ["Checkmate","Checkmate or stalemate|Mate in one: queen|Mate in one: rook|Mate in one: minor pieces|Mate in one: pawn|Test 4|Pawn promotion|Types of draw"],
      ["Winning material","Capturing an unprotected piece|Test 5|En passant|Gaining exchange advantage|Checkmate with queen and rook|Double rook checkmate|Test 6|Opening principles"],
      ["Your first tactics","Simul: opening principles revision|Game analysis|Pin|Double attack|Discovered attack|Discovered check|Double check|Test review"],
      ["Play and review","Notation writing|Review of special moves|Creating a mating threat|Group sessions: in-class tournaments and feedback|One-on-one sessions with your educator"]
    ]},
    {name:"Intermediate",tag:"LEVEL 02 · DEVELOPMENT",desc:"Build practical tactical vision and learn to recognise the combinations, defensive resources and basic endgames that decide real games.",focus:["Core tactics","Mating patterns","Basic endgames"],modules:[
      ["Core tactics","Introduction and assessment|Simple pin|Discovered attack|Discovered check and double check|Skewer and x-ray|Test 1|Double attack: bishop and rook|Double attack: queen and pawn"],
      ["Double attacks and defense","Double attack: knight|Defending against mate|Capturing the defender|Test 2|Basic opening principles|Simplification|Queen checkmate|Cross pin"],
      ["Breakthroughs","Back rank|Test 3|Counterattack|Pawn breakthrough|Stalemate|Overloaded pieces|Key squares|Test 4"],
      ["Structure and endgames","Pawn structure|Clearance|Double rook on the 7th rank|Underpromotion|Drawing combinations|Test 5|Single rook mate|Zugzwang"],
      ["Mating patterns","Decoy|Creating a mating threat|Domination|Test 6|Simplification 2|Windmill|Smothered mate|Perpetual check"],
      ["Mate in 2 and review","Draw by insufficient material|Test 7|Mate in 2|Deflection|Opening principles 2|Intermediate pins|Intermediate double attacks|Test 8"]
    ]},
    {name:"Advanced 1",tag:"LEVEL 03 · ADVANCED",desc:"Strengthen calculation and positional understanding through deeper endgame work, king attacks, pawn structures and opening systems.",focus:["Endgame theory","Attacking the king","Pawn structures"],modules:[
      ["Endgame foundations","Queen vs pawn on the 7th: theory|Queen vs pawn on the 7th: exercises|Initiative|Activity of pieces|Revision 1|King and pawn endgames 1: simple endgames|King and pawn endgames 2: examples and exercises|King and pawn endgames 3: mined and corresponding squares"],
      ["Kings and attacks","King and pawn endgames 4: triangulation and zugzwang|Revision 2|Attacking the king: sacrifices on h7 and g7|Attacking the castled king (same side)|Attacking the uncastled king|Attacking the castled king (opposite sides)|Revision 3|Lead in development"],
      ["Outposts and passed pawns","Pawn storms|Using outposts|Active defense|Revision 4|Passed pawns|Dynamic vs static advantage|Bishop vs pawns|Rook vs pawns"],
      ["Bishops, rooks and pawns","Revision 5|Bishop vs bishop and pawns|Rook vs rook and pawns|Opposite-colored bishop endgames|Good bishop vs bad bishop|Revision 6|Backward pawns|Isolated pawns"],
      ["Pawn structures","Hanging pawns|Pawn wedge|Revision 7|Connected pawns|Doubled pawns|Pawn nail|Pawn chain|Revision 8"],
      ["Opening systems","Ruy Lopez|Ruy Lopez continued|French Defense|French Defense continued|Caro-Kann Defense|Caro-Kann continued|Sicilian Defense|Sicilian continued"]
    ]},
    {name:"Advanced 2",tag:"LEVEL 04 · COMPETITIVE",desc:"Develop a more complete opening repertoire, calculate with greater accuracy and make strategic plans across the middlegame and endgame.",focus:["Opening repertoire","Calculation","Strategy and endgames"],modules:[
      ["Opening repertoire I","Ruy Lopez|Sicilian Najdorf, part 1|King's Indian|Nimzo-Indian|Revision|Catalan|Sicilian, part 2|Giuoco Piano"],
      ["Opening repertoire II","Revision|English Opening|Nimzo-Indian|French|Revision|Caro-Kann|Center Counter|King's Gambit"],
      ["Opening repertoire III","Queen's Indian|Revision|Grünfeld|Benoni|Benko|Slav|Revision|Semi-Slav"],
      ["Games and calculation","Scotch Game|Practice match|Game analysis|Continuation|Bishop and knight checkmate|Calculation|Continuation|Dragging the king out"],
      ["Middlegame strategy","Revision|Mobilizing all pieces|Maneuvering pieces|Pawn majority|Pawn majority continued|Revision|Prophylaxis|Rook endgames"],
      ["Endgames and mastery","Undermining the pawn center|Queen and pawn endgames|Revision|King activity in the endgame|Knight vs bishop (closed positions)|Knight endgames|Principle of two weaknesses|Continuation|Revision"]
    ]}
  ];

  wrap.innerHTML = '<div class="cp-course-tabs" role="tablist" aria-label="Course levels"></div><div class="cp-course-panel" role="tabpanel" aria-live="polite"></div>';
  const tabs = wrap.querySelector(".cp-course-tabs");
  const panel = wrap.querySelector(".cp-course-panel");

  levels.forEach((level, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cp-course-tab";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    button.tabIndex = index === 0 ? 0 : -1;
    button.innerHTML = '<span class="cp-course-tab-num">0' + (index + 1) + '</span><span class="cp-course-tab-name">' + level.name + '</span><span class="cp-course-tab-sub">' + level.focus[0] + '</span>';
    button.addEventListener("click", () => showLevel(index));
    button.addEventListener("keydown", event => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const next = (index + (event.key === "ArrowRight" ? 1 : 3)) % levels.length;
      showLevel(next);
      tabs.children[next].focus();
    });
    tabs.appendChild(button);
  });

  function showLevel(index) {
    const level = levels[index];
    [...tabs.children].forEach((button, i) => {
      button.setAttribute("aria-selected", String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    const total = level.modules.reduce((sum, module) => sum + module[1].split("|").length, 0);
    panel.innerHTML = '<div class="cp-course-intro"><div><small>' + level.tag + '</small><h3>' + level.name + '</h3><p>' + level.desc + '</p><div class="cp-course-focus">' + level.focus.map(item => '<span>' + item + '</span>').join("") + '</div></div><div class="cp-course-count"><b>' + level.modules.length + '</b><span>modules</span><b>' + total + '</b><span>lesson topics</span></div></div><div class="cp-course-modules">' + level.modules.map((module, i) => {
      const lessons = module[1].split("|");
      return '<article class="cp-course-module"><div class="cp-course-module-head"><span>' + String(i + 1).padStart(2, "0") + '</span><div><small>MODULE ' + (i + 1) + '</small><h4>' + module[0] + '</h4></div></div><ul>' + lessons.map(lesson => '<li' + (/^(Test|Revision)/.test(lesson) ? ' class="is-review"' : '') + '>' + lesson + '</li>').join("") + '</ul></article>';
    }).join("") + '</div>';
  }
  showLevel(0);
})();