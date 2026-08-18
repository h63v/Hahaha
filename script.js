/* =====================================================
   NOROHENTAI
   Main JavaScript
===================================================== */


/* ================= ELEMENTS ================= */

const searchButton =
    document.getElementById("searchButton");

const searchBox =
    document.getElementById("searchBox");

const searchInput =
    document.getElementById("searchInput");

const closeSearch =
    document.getElementById("closeSearch");

const menuButton =
    document.getElementById("menuButton");

const mobileMenu =
    document.getElementById("mobileMenu");

const mangaCards =
    document.querySelectorAll(".manga-card");

const favorites =
    document.querySelectorAll(".favorite");

const genres =
    document.querySelectorAll(".genre");

const noResults =
    document.getElementById("noResults");


/* ================= SEARCH OPEN ================= */

searchButton.addEventListener("click", () => {

    searchBox.classList.add("open");

    setTimeout(() => {
        searchInput.focus();
    }, 200);

});


/* ================= SEARCH CLOSE ================= */

closeSearch.addEventListener("click", () => {

    closeSearchBox();

});


function closeSearchBox() {

    searchBox.classList.remove("open");

    searchInput.value = "";

    showAllCards();

}


/* ================= SEARCH ================= */

searchInput.addEventListener("input", () => {

    const value =
        searchInput.value
            .trim()
            .toLowerCase();

    if (!value) {

        showAllCards();

        return;
    }


    let count = 0;


    mangaCards.forEach(card => {

        const title =
            card.dataset.title
                .toLowerCase();

        const cardGenres =
            card.dataset.genres
                .toLowerCase();


        const found =
            title.includes(value) ||
            cardGenres.includes(value);


        if (found) {

            card.style.display = "";

            count++;

        } else {

            card.style.display = "none";

        }

    });


    updateResults(count);

});


/* ================= SHOW ALL ================= */

function showAllCards() {

    mangaCards.forEach(card => {

        card.style.display = "";

    });

    noResults.classList.remove("show");

}


/* ================= RESULTS ================= */

function updateResults(count) {

    if (count === 0) {

        noResults.classList.add("show");

    } else {

        noResults.classList.remove("show");

    }

}


/* ================= MOBILE MENU ================= */

menuButton.addEventListener("click", () => {

    mobileMenu.classList.toggle("open");

});


document.querySelectorAll(".mobile-menu a")
    .forEach(link => {

        link.addEventListener("click", () => {

            mobileMenu.classList.remove("open");

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


/* ================= GENRE FILTER ================= */

genres.forEach(genre => {

    genre.addEventListener("click", () => {

        genres.forEach(item => {

            item.classList.remove("active");

        });


        genre.classList.add("active");


        const filter =
            genre.dataset.filter
                .toLowerCase();


        if (filter === "all") {

            showAllCards();

            return;
        }


        let count = 0;


        mangaCards.forEach(card => {

            const cardGenres =
                card.dataset.genres
                    .toLowerCase();


            if (cardGenres.includes(filter)) {

                card.style.display = "";

                count++;

            } else {

                card.style.display = "none";

            }

        });


        updateResults(count);


        document.getElementById("latest")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    });

});


/* ================= ESCAPE ================= */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeSearchBox();

        mobileMenu.classList.remove("open");

    }

});


/* ================= CLOSE MENU OUTSIDE ================= */

document.addEventListener("click", event => {

    const clickedInsideMenu =
        mobileMenu.contains(event.target);

    const clickedButton =
        menuButton.contains(event.target);


    if (
        !clickedInsideMenu &&
        !clickedButton
    ) {

        mobileMenu.classList.remove("open");

    }

});


/* ================= ACTIVE NAV ================= */

const navLinks =
    document.querySelectorAll(
        ".desktop-nav a"
    );


const sections =
    document.querySelectorAll(
        "main section"
    );


window.addEventListener("scroll", () => {

    let current = "";


    sections.forEach(section => {

        const sectionTop =
            section.offsetTop - 120;

        const sectionHeight =
            section.offsetHeight;


        if (
            window.scrollY >= sectionTop &&
            window.scrollY <
                sectionTop + sectionHeight
        ) {

            current =
                section.getAttribute("id");

        }

    });


    navLinks.forEach(link => {

        link.classList.remove("active");


        if (
            link.getAttribute("href") ===
            "#" + current
        ) {

            link.classList.add("active");

        }

    });

});


/* ================= SMOOTH LINKS ================= */

document.querySelectorAll(
    'a[href^="#"]'
).forEach(link => {

    link.addEventListener("click", event => {

        const id =
            link.getAttribute("href");


        if (
            !id ||
            id === "#"
        ) {

            return;

        }


        const target =
            document.querySelector(id);


        if (!target) {

            return;

        }


        event.preventDefault();


        const headerHeight = 70;


        const position =
            target.offsetTop -
            headerHeight;


        window.scrollTo({

            top: position,

            behavior: "smooth"

        });

    });

});


/* ================= HEADER SHADOW ================= */

const header =
    document.querySelector(".header");


window.addEventListener("scroll", () => {

    if (window.scrollY > 20) {

        header.style.boxShadow =
            "0 10px 35px rgba(0,0,0,.25)";

    } else {

        header.style.boxShadow =
            "none";

    }

});


/* ================= INIT ================= */

console.log(
    "NoroHentai — Ready."
);
