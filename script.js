let currentScreen = 1;

const totalScreens = 9;

const labels = [
    "OUR STORY",
    "QUESTION",
    "THE BEGINNING",
    "FIRST MESSAGE",
    "GETTING CLOSER",
    "THE HARD PART",
    "THE DISTANCE",
    "BACK TOGETHER",
    "FROM MY HEART"
];


/* =========================
   PRELOADER
========================= */

window.addEventListener("load", () => {

    setTimeout(() => {

        document
            .getElementById("preloader")
            .classList.add("hide");

    }, 1800);

});


/* =========================
   تغيير الشاشة
========================= */

function showScreen(number) {

    const current =
        document.getElementById(`screen-${currentScreen}`);

    const next =
        document.getElementById(`screen-${number}`);

    if (!current || !next) return;

    current.classList.remove("active");

    setTimeout(() => {

        next.classList.add("active");

        currentScreen = number;

        updateUI();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        if (number === 9) {
            celebration();
        }

    }, 120);
}


/* =========================
   تحديث العداد
========================= */

function updateUI() {

    const number =
        String(currentScreen).padStart(2, "0");

    document
        .getElementById("currentNumber")
        .textContent = number;

    document
        .getElementById("memoryLabel")
        .textContent = labels[currentScreen - 1];
}


/* =========================
   زر لا 😂
========================= */

const noButton =
    document.getElementById("noButton");

if (noButton) {

    const messages = [
        "متأكدة؟ 😭",
        "فكري مرة ثانية 😂",
        "لا مو هذي الإجابة",
        "جربي الزر الثاني ❤️",
        "لاااا 😭",
        "غلط 😂"
    ];

    function escapeNo() {

        const width =
            noButton.offsetWidth;

        const height =
            noButton.offsetHeight;

        const maxX =
            window.innerWidth - width - 15;

        const maxY =
            window.innerHeight - height - 15;

        const x =
            Math.max(10, Math.random() * maxX);

        const y =
            Math.max(80, Math.random() * maxY);

        noButton.style.position = "fixed";
        noButton.style.left = `${x}px`;
        noButton.style.top = `${y}px`;

        noButton.textContent =
            messages[
                Math.floor(
                    Math.random() * messages.length
                )
            ];

        noButton.style.zIndex = "500";
    }

    noButton.addEventListener(
        "mouseenter",
        escapeNo
    );

    noButton.addEventListener(
        "touchstart",
        function(e) {

            e.preventDefault();

            escapeNo();

        }
    );

    noButton.addEventListener(
        "click",
        escapeNo
    );
}


/* =========================
   قلوب متحركة
========================= */

const symbols = [
    "♥",
    "♡",
    "❤",
    "💗",
    "💖"
];

function createHeart() {

    const heart =
        document.createElement("div");

    heart.className =
        "floating-heart";

    heart.textContent =
        symbols[
            Math.floor(
                Math.random() * symbols.length
            )
        ];

    heart.style.left =
        Math.random() * 100 + "vw";

    heart.style.fontSize =
        (9 + Math.random() * 20) + "px";

    heart.style.animationDuration =
        (6 + Math.random() * 8) + "s";

    heart.style.setProperty(
        "--move",
        ((Math.random() - .5) * 300) + "px"
    );

    document
        .getElementById("particles")
        .appendChild(heart);

    setTimeout(() => {
        heart.remove();
    }, 15000);
}


setInterval(createHeart, 650);


/* =========================
   احتفال النهاية
========================= */

function celebration() {

    for (let i = 0; i < 35; i++) {

        setTimeout(() => {
            createHeart();
        }, i * 100);

    }

}


/* =========================
   البداية
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateUI();

        for (let i = 0; i < 8; i++) {

            setTimeout(() => {
                createHeart();
            }, i * 250);

        }

    }
);


/* =========================
   إعادة البداية
========================= */

function restart() {

    const current =
        document.querySelector(".screen.active");

    if (current) {
        current.classList.remove("active");
    }

    currentScreen = 1;

    document
        .getElementById("screen-1")
        .classList.add("active");

    updateUI();

    const no =
        document.getElementById("noButton");

    if (no) {

        no.style.position = "";
        no.style.left = "";
        no.style.top = "";
        no.style.zIndex = "";

        no.textContent = "لا 💔";

    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}
