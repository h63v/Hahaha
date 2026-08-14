const INDEX_URL = "/manga/index.json";

const worksEl = document.querySelector("#works");
const emptyEl = document.querySelector("#empty");
const countEl = document.querySelector("#count");
const searchEl = document.querySelector("#search");

let works = [];
let currentStatus = "all";
let searchQuery = "";

const statusNames = {
    ongoing: "مستمر",
    completed: "مكتمل",
    paused: "متوقف"
};


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char]));
}


function encodePath(path) {
    return path
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");
}


function getWorkURL(work) {
    return `/manga/${encodeURIComponent(work.slug)}/${encodeURIComponent(work.file)}`;
}


function getChapterURL(work, number) {
    return `/manga/${encodeURIComponent(work.slug)}/${encodeURIComponent(work.slug)}-chapter-${number}.html`;
}


/* =========================================================
   LOAD INDEX
========================================================= */

async function loadIndex() {

    const response = await fetch(
        `${INDEX_URL}?v=${Date.now()}`,
        {
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            `تعذر تحميل index.json (${response.status})`
        );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.works)) {
        throw new Error(
            "صيغة index.json غير صحيحة."
        );
    }

    return data.works;
}


/* =========================================================
   NORMALIZE WORK
========================================================= */

function normalizeWork(work) {

    return {

        slug:
            String(work.slug || "").trim(),

        title:
            String(
                work.title ||
                work.slug ||
                "عمل بدون اسم"
            ).trim(),

        file:
            String(
                work.file ||
                `${work.slug}.html`
            ).trim(),

        cover:
            String(
                work.cover || ""
            ).trim(),

        description:
            String(
                work.description ||
                "لم تتم إضافة قصة بعد"
            ).trim(),

        genres:
            Array.isArray(work.genres)
                ? work.genres
                    .map(x => String(x).trim())
                    .filter(Boolean)
                : [],

        status:
            normalizeStatus(work.status),

        chapters:
            normalizeChapters(work)

    };
}


/* =========================================================
   CHAPTERS
========================================================= */

function normalizeChapters(work) {

    /*
       إذا index.json يحتوي:

       "chapters": 27

       ننشئ:

       1 -> 27
    */

    if (
        typeof work.chapters === "number"
    ) {

        const total =
            Math.max(
                0,
                Math.floor(work.chapters)
            );

        return Array.from(
            { length: total },
            (_, index) => index + 1
        );
    }


    /*
       إذا كان chapters مصفوفة:

       "chapters": [1,2,3]
    */

    if (
        Array.isArray(work.chapters)
    ) {

        return work.chapters
            .map(chapter => {

                if (
                    typeof chapter === "object" &&
                    chapter !== null
                ) {

                    return Number(
                        chapter.number
                    );
                }

                return Number(chapter);
            })
            .filter(
                number =>
                    Number.isFinite(number) &&
                    number > 0
            )
            .sort(
                (a, b) => b - a
            );
    }


    return [];
}


/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(status) {

    const value =
        String(status || "")
            .trim()
            .toLowerCase();

    if (
        value === "completed" ||
        value === "complete" ||
        value === "مكتمل"
    ) {
        return "completed";
    }

    if (
        value === "paused" ||
        value === "stopped" ||
        value === "متوقف"
    ) {
        return "paused";
    }

    return "ongoing";
}


/* =========================================================
   COVER
========================================================= */

function renderCover(work) {

    if (!work.cover) {

        return `
            <div class="no-cover">
                <span>MangaX</span>
            </div>
        `;
    }


    return `
        <img
            src="${escapeHTML(work.cover)}"
            alt="${escapeHTML(work.title)}"
            loading="lazy"
            onerror="
                this.onerror=null;
                this.src='https://placehold.co/600x850/15151e/8b5cf6?text=MangaX';
            "
        >
    `;
}


/* =========================================================
   RENDER WORKS
========================================================= */

function render() {

    if (!worksEl) {
        return;
    }


    const filtered =
        works.filter(work => {

            const matchesStatus =
                currentStatus === "all" ||
                work.status === currentStatus;


            const searchText =
                [
                    work.title,
                    work.description,
                    ...work.genres
                ]
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                searchText.includes(
                    searchQuery
                );


            return (
                matchesStatus &&
                matchesSearch
            );
        });


    if (countEl) {

        countEl.textContent =
            `${filtered.length} عمل`;
    }


    if (emptyEl) {

        emptyEl.hidden =
            filtered.length !== 0;
    }


    worksEl.innerHTML = "";


    filtered.forEach(work => {

        const card =
            document.createElement("article");


        card.className = "work";


        const genresHTML =
            work.genres
                .map(
                    genre => `
                        <span class="genre">
                            ${escapeHTML(genre)}
                        </span>
                    `
                )
                .join("");


        const latestChapter =
            work.chapters.length
                ? work.chapters[0]
                : null;


        const chapterText =
            latestChapter
                ? `الفصل ${latestChapter}`
                : "لا توجد فصول";


        card.innerHTML = `

            <div class="cover">

                ${renderCover(work)}

                <span class="status">

                    ${escapeHTML(
                        statusNames[
                            work.status
                        ] || "مستمر"
                    )}

                </span>

            </div>


            <div class="work-info">

                <h3>
                    ${escapeHTML(
                        work.title
                    )}
                </h3>


                <p class="description">

                    ${escapeHTML(
                        work.description
                    )}

                </p>


                <div class="genres">

                    ${genresHTML}

                </div>


                <div class="work-actions">

                    <a
                        class="read"
                        href="${getWorkURL(work)}"
                    >
                        عرض العمل
                    </a>

                    ${
                        latestChapter
                            ? `
                                <a
                                    class="latest"
                                    href="${getChapterURL(
                                        work,
                                        latestChapter
                                    )}"
                                >
                                    ${chapterText}
                                </a>
                              `
                            : ""
                    }

                </div>

            </div>

        `;


        worksEl.appendChild(card);
    });
}


/* =========================================================
   SEARCH
========================================================= */

if (searchEl) {

    searchEl.addEventListener(
        "input",
        event => {

            searchQuery =
                event.target.value
                    .toLowerCase()
                    .trim();

            render();
        }
    );
}


/* =========================================================
   FILTERS
========================================================= */

document
    .querySelectorAll(".filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filter")
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                currentStatus =
                    button.dataset.status ||
                    "all";


                render();
            }
        );
    });


/* =========================================================
   INIT
========================================================= */

async function init() {

    try {

        if (worksEl) {

            worksEl.innerHTML = `

                <div class="empty">

                    جاري تحميل الأعمال...

                </div>

            `;
        }


        const data =
            await loadIndex();


        works =
            data
                .map(normalizeWork)
                .filter(
                    work =>
                        work.slug &&
                        work.file
                );


        render();


    } catch (error) {

        console.error(
            "MangaX:",
            error
        );


        if (worksEl) {

            worksEl.innerHTML = `

                <div class="empty">

                    ❌ تعذر تحميل الأعمال

                    <br><br>

                    <small>
                        ${escapeHTML(
                            error.message
                        )}
                    </small>

                </div>

            `;
        }
    }
}


init();
