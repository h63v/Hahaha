// ======================================
// PlayBoy Manga
// ======================================


// Manga Data

const manga = [

    {
        title: "Solo Leveling",
        image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=600&q=80",
        chapters: 210,
        status: "مكتملة",
        popular: true
    },

    {
        title: "The Beginning After The End",
        image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
        chapters: 190,
        status: "مستمرة",
        popular: true
    },

    {
        title: "Omniscient Reader",
        image: "https://images.unsplash.com/photo-1614583224978-f9c7e1c5a0c4?auto=format&fit=crop&w=600&q=80",
        chapters: 180,
        status: "مستمرة",
        popular: true
    },

    {
        title: "Nano Machine",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
        chapters: 250,
        status: "مستمرة",
        popular: true
    },

    {
        title: "Tower of God",
        image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=600&q=80",
        chapters: 600,
        status: "مستمرة",
        popular: true
    },

    {
        title: "Lookism",
        image: "https://images.unsplash.com/photo-1578632738988-6b0b8f9b7e35?auto=format&fit=crop&w=600&q=80",
        chapters: 520,
        status: "مستمرة",
        popular: false
    },

    {
        title: "Eleceed",
        image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=600&q=80",
        chapters: 370,
        status: "مستمرة",
        popular: false
    },

    {
        title: "Mercenary Enrollment",
        image: "https://images.unsplash.com/photo-1607604276583-eef5e2c7d6c4?auto=format&fit=crop&w=600&q=80",
        chapters: 250,
        status: "مستمرة",
        popular: false
    }

];


// ======================================
// Create Manga Card
// ======================================

function createCard(item) {

    return `

        <div class="manga-card"
             onclick="openManga('${item.title}')">

            <div class="cover">

                <img
                    src="${item.image}"
                    alt="${item.title}"
                    loading="lazy"
                >

                <div class="status">
                    ${item.status}
                </div>

            </div>

            <div class="card-info">

                <h3>
                    ${item.title}
                </h3>

                <p>
                    ${item.chapters} فصل
                </p>

            </div>

        </div>

    `;

}


// ======================================
// Display Manga
// ======================================

function displayManga(list, elementId) {

    const container =
        document.getElementById(elementId);

    container.innerHTML = "";

    if (list.length === 0) {

        container.innerHTML = `
            <p style="
                color:#777;
                grid-column:1/-1;
                text-align:center;
                padding:40px;
            ">
                لم يتم العثور على أي عمل.
            </p>
        `;

        return;
    }

    list.forEach(item => {

        container.innerHTML +=
            createCard(item);

    });

}


// ======================================
// Initial Load
// ======================================

displayManga(
    manga,
    "mangaGrid"
);


displayManga(
    manga.filter(item => item.popular),
    "popularGrid"
);


// ======================================
// Search
// ======================================

function searchManga() {

    const query =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();

    const results =
        manga.filter(item =>
            item.title
                .toLowerCase()
                .includes(query)
        );

    displayManga(
        results,
        "mangaGrid"
    );

}


// ======================================
// Mobile Menu
// ======================================

function toggleMenu() {

    const menu =
        document.getElementById("mobileMenu");

    menu.classList.toggle("active");

}


// ======================================
// Open Manga
// ======================================

function openManga(title) {

    alert(
        "سيتم فتح صفحة: " + title
    );

                          }
