const searchInput = document.getElementById("searchInput");
const mangaCards = document.querySelectorAll(".manga-card");
const categories = document.querySelectorAll(".category");
const noResults = document.getElementById("noResults");
const themeBtn = document.getElementById("themeBtn");

let selectedCategory = "all";


function filterManga() {

    const search = searchInput.value
        .trim()
        .toLowerCase();

    let visible = 0;

    mangaCards.forEach(card => {

        const title = card.dataset.title.toLowerCase();
        const cardCategories = card.dataset.category.toLowerCase();

        const matchesSearch =
            title.includes(search);

        const matchesCategory =
            selectedCategory === "all" ||
            cardCategories.includes(selectedCategory);

        if (matchesSearch && matchesCategory) {
            card.style.display = "";
            visible++;
        } else {
            card.style.display = "none";
        }

    });

    noResults.style.display =
        visible === 0 ? "block" : "none";
}


searchInput.addEventListener("input", filterManga);


categories.forEach(button => {

    button.addEventListener("click", () => {

        categories.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        selectedCategory =
            button.dataset.category;

        filterManga();
    });

});


themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {
        themeBtn.textContent = "☾";
        localStorage.setItem("theme", "light");
    } else {
        themeBtn.textContent = "☀";
        localStorage.setItem("theme", "dark");
    }

});


if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    themeBtn.textContent = "☾";
}
