/* ==================================================
   NoroHentai
   Main JavaScript
================================================== */


/* ================= ELEMENTS ================= */

const searchBtn =
    document.getElementById("searchBtn");

const searchPanel =
    document.getElementById("searchPanel");

const closeSearch =
    document.getElementById("closeSearch");

const searchInput =
    document.getElementById("searchInput");

const menuBtn =
    document.getElementById("menuBtn");

const mobileMenu =
    document.getElementById("mobileMenu");

const themeBtn =
    document.getElementById("themeBtn");

const mangaGrid =
    document.getElementById("mangaGrid");

const noResults =
    document.getElementById("noResults");

const categories =
    document.querySelectorAll(".category");

const mangaCards =
    document.querySelectorAll(".manga-card");

const favorites =
    document.querySelectorAll(".favorite");


/* ================= SEARCH ================= */

searchBtn.addEventListener("click", () => {

    searchPanel.classList.add("open");

    setTimeout(() => {
        searchInput.focus();
    }, 200);

});


closeSearch.addEventListener("click", () => {

    searchPanel.classList.remove("open");

    searchInput.value = "";

    filterManga("");

});


searchInput.addEventListener("input", () => {

    const value =
        searchInput.value
            .trim()
            .toLowerCase();

    filterManga(value);

});


function filterManga(searchValue) {

    let visibleCount = 0;

    mangaCards.forEach(card => {

        const title =
            card.dataset.title
                .toLowerCase();

        const genres =
            card.dataset.genres
                .toLowerCase();

        const matches =
            title.includes(searchValue) ||
            genres.includes(searchValue);

        if (matches) {

            card.style.display = "";

            visibleCount++;

        } else {

            card.style.display = "none";

        }

    });


    if (visibleCount === 0) {

        noResults.classList.add("show");

    } else {

        noResults.classList.remove("show");

    }

}


/* ================= MOBILE MENU ================= */

menuBtn.addEventListener("click", () => {

    mobileMenu.classList.toggle("open");

});


document.querySelectorAll(".mobile-menu a")
    .forEach(link => {

        link.addEventListener("click", () => {

            mobileMenu.classList.remove("open");

        });

    });


/* ================= CATEGORIES ================= */

categories.forEach(category => {

    category.addEventListener("click", () => {

        categories.forEach(item => {

            item.classList.remove("active");

        });

        category.classList.add("active");

        const filter =
            category.dataset.filter
                .toLowerCase();

        let visibleCount = 0;


        mangaCards.forEach(card => {

            const genres =
                card.dataset.genres
                    .toLowerCase();


            if (
                filter === "all" ||
                genres.includes(filter)
            ) {

                card.style.display = "";

                visibleCount++;

            } else {

                card.style.display = "none";

            }

        });


        if (visibleCount === 0) {

            noResults.classList.add("show");

        } else {

            noResults.classList.remove("show");

        }

    });

});


/* ================= FAVORITES ================= */

favorites.forEach(button => {

    button.addEventListener("click", event => {

        event.preventDefault();

        event.stopPropagation();

        button.classList.toggle("saved");


        if (button.classList.contains("saved")) {

            button.textContent = "♥";

        } else {

            button.textContent = "♡";

        }

    });

});


/* ================= THEME ================= */

/*
   الموقع أساساً Dark.
   هذا الزر يغير مظهر العناصر
   إلى نسخة أهدأ عند الضغط.
*/

let lightMode =
    localStorage.getItem("noroTheme") === "light";


function updateTheme() {

    if (lightMode) {

        document.body.classList.add("light-mode");

        themeBtn.textContent = "☀";

    } else {

        document.body.classList.remove("light-mode");

        themeBtn.textContent = "☾";

    }

}


themeBtn.addEventListener("click", () => {

    lightMode = !lightMode;

    localStorage.setItem(
        "noroTheme",
        lightMode ? "light" : "dark"
    );

    updateTheme();

});


updateTheme();


/* ================= CLOSE SEARCH WITH ESC ================= */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        searchPanel.classList.remove("open");

        mobileMenu.classList.remove("open");

    }

});


/* ================= HEADER SCROLL ================= */

let lastScroll = 0;

window.addEventListener("scroll", () => {

    const currentScroll =
        window.scrollY;

    const header =
        document.querySelector(".header");


    if (currentScroll > 50) {

        header.style.boxShadow =
            "0 10px 40px rgba(0,0,0,.35)";

    } else {

        header.style.boxShadow =
            "none";

    }


    lastScroll = currentScroll;

});


/* ================= SMOOTH NAV ================= */

document.querySelectorAll(
    'a[href^="#"]'
).forEach(anchor => {

    anchor.addEventListener("click", function(event) {

        const targetId =
            this.getAttribute("href");

        if (
            targetId === "#" ||
            !targetId
        ) {
            return;
        }


        const target =
            document.querySelector(targetId);

        if (!target) {
            return;
        }


        event.preventDefault();


        const headerHeight = 75;

        const targetPosition =
            target.offsetTop -
            headerHeight;


        window.scrollTo({

            top: targetPosition,

            behavior: "smooth"

        });

    });

});


/* ================= CARD HOVER EFFECT ================= */

mangaCards.forEach(card => {

    card.addEventListener("mousemove", event => {

        const rect =
            card.getBoundingClientRect();

        const x =
            event.clientX - rect.left;

        const y =
            event.clientY - rect.top;

        const centerX =
            rect.width / 2;

        const centerY =
            rect.height / 2;

        const rotateX =
            (y - centerY) / 40;

        const rotateY =
            (centerX - x) / 40;


        if (window.innerWidth > 800) {

            card.style.transform =
                `translateY(-7px)
                 perspective(800px)
                 rotateX(${rotateX}deg)
                 rotateY(${rotateY}deg)`;

        }

    });


    card.addEventListener("mouseleave", () => {

        card.style.transform = "";

    });

});


/* ================= INITIALIZATION ================= */

console.log(
    "NoroHentai loaded successfully."
);
